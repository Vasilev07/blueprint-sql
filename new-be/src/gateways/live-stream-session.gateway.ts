import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { MediasoupService } from "../services/mediasoup.service";
import { LiveStreamSessionService } from "../services/live-stream-session.service";
import { SessionStatus } from "../enums/session-status.enum";
import { verify } from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";

interface AuthenticatedSocket extends Socket {
    userId?: number;
    email?: string;
}

@WebSocketGateway({
    cors: {
        origin: ["http://localhost:4200", "app.impulseapp.net"],
        credentials: true,
    },
    namespace: "/live-stream-session",
    transports: ["websocket", "polling"],
})
@Injectable()
export class LiveStreamSessionGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(LiveStreamSessionGateway.name);
    private userSockets: Map<number, AuthenticatedSocket> = new Map();
    private sessionParticipants: Map<string, Set<number>> = new Map();

    // Store transport and producer IDs for cleanup
    private userTransports: Map<number, Set<string>> = new Map();
    private userProducers: Map<number, Set<string>> = new Map();

    constructor(
        private readonly mediasoupService: MediasoupService,
        private readonly liveStreamSessionService: LiveStreamSessionService,
        private readonly configService: ConfigService,
    ) {}

    async handleConnection(client: AuthenticatedSocket) {
        try {
            // Authenticate using JWT from handshake
            const token = client.handshake.auth.token;
            if (!token) {
                throw new UnauthorizedException("No token provided");
            }

            const secret = this.configService.get<string>("JWT_SECRET");
            const decoded = verify(token, secret) as any;

            client.userId = decoded.id || decoded.userId;
            client.email = decoded.email;

            this.userSockets.set(client.userId, client);
            this.logger.log(
                `User ${client.userId} connected to live stream session`,
            );

            // Notify about connection
            client.emit("connected", { userId: client.userId });
        } catch (error) {
            this.logger.error("Authentication failed:", error);
            client.disconnect();
        }
    }

    async handleDisconnect(client: AuthenticatedSocket) {
        if (client.userId) {
            this.logger.log(
                `User ${client.userId} disconnected from live stream session`,
            );
            this.userSockets.delete(client.userId);

            // Clean up user's transports and producers
            const transports = this.userTransports.get(client.userId);
            if (transports) {
                for (const transportId of transports) {
                    await this.mediasoupService.closeTransport(transportId);
                }
                this.userTransports.delete(client.userId);
            }

            const producers = this.userProducers.get(client.userId);
            if (producers) {
                for (const producerId of producers) {
                    await this.mediasoupService.closeProducer(producerId);
                }
                this.userProducers.delete(client.userId);
            }

            // End any active sessions
            const activeSession =
                await this.liveStreamSessionService.getActiveSessionByUserId(
                    client.userId,
                );
            if (activeSession) {
                await this.liveStreamSessionService.endSession(
                    activeSession.id,
                    "User disconnected",
                );
                this.server
                    .to(`session:${activeSession.id}`)
                    .emit("session-ended", {
                        sessionId: activeSession.id,
                        reason: "User disconnected",
                    });
            }
        }
    }

    @SubscribeMessage("join-session")
    async handleJoinSession(
        @MessageBody() data: { sessionId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { sessionId } = data;
            const session =
                await this.liveStreamSessionService.getSessionById(sessionId);

            // For 1-to-1 sessions, verify user is part of the session
            if (!session.isLiveStream) {
                if (
                    session.initiatorId !== client.userId &&
                    session.recipientId !== client.userId
                ) {
                    throw new UnauthorizedException(
                        "You are not part of this session",
                    );
                }
            } else {
                // For streaming rooms, anyone can join (as long as room is active)
                // Additional participant limit checks could be added here
            }

            // Join the session room
            client.join(`session:${sessionId}`);

            // Track participants
            if (!this.sessionParticipants.has(sessionId)) {
                this.sessionParticipants.set(sessionId, new Set());
            }
            this.sessionParticipants.get(sessionId)!.add(client.userId);

            this.logger.log(
                `User ${client.userId} joined session ${sessionId}`,
            );

            // Update session status to ringing if pending
            if (session.status === SessionStatus.PENDING) {
                await this.liveStreamSessionService.updateSessionStatus(
                    sessionId,
                    SessionStatus.RINGING,
                );
            }

            // Get router RTP capabilities
            const rtpCapabilities =
                this.mediasoupService.getRouterRtpCapabilities(sessionId);

            // Notify others in the session
            client
                .to(`session:${sessionId}`)
                .emit("user-joined", { userId: client.userId });

            return {
                success: true,
                rtpCapabilities,
                participants: Array.from(
                    this.sessionParticipants.get(sessionId)!,
                ),
            };
        } catch (error) {
            this.logger.error("Error joining session:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("leave-session")
    async handleLeaveSession(
        @MessageBody() data: { sessionId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { sessionId } = data;

            client.leave(`session:${sessionId}`);

            // Remove from participants
            const participants = this.sessionParticipants.get(sessionId);
            if (participants) {
                participants.delete(client.userId);
                if (participants.size === 0) {
                    this.sessionParticipants.delete(sessionId);
                }
            }

            // Notify others
            client
                .to(`session:${sessionId}`)
                .emit("user-left", { userId: client.userId });

            this.logger.log(`User ${client.userId} left session ${sessionId}`);

            return { success: true };
        } catch (error) {
            this.logger.error("Error leaving session:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("create-transport")
    async handleCreateTransport(
        @MessageBody() data: { sessionId: string; direction: "send" | "recv" },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { sessionId, direction } = data;
            const transportId = `${sessionId}-${client.userId}-${direction}-${Date.now()}`;

            const transport = await this.mediasoupService.createWebRtcTransport(
                sessionId,
                transportId,
            );

            // Track transport for cleanup
            if (!this.userTransports.has(client.userId)) {
                this.userTransports.set(client.userId, new Set());
            }
            this.userTransports.get(client.userId)!.add(transportId);

            return {
                success: true,
                transportId,
                ...transport,
            };
        } catch (error) {
            this.logger.error("Error creating transport:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("produce")
    async handleProduce(
        @MessageBody()
        data: {
            sessionId: string;
            transportId: string;
            kind: "audio" | "video";
            rtpParameters: any;
        },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { sessionId, transportId, kind, rtpParameters } = data;
            const producerId = `${sessionId}-${client.userId}-${kind}-${Date.now()}`;

            const _result = await this.mediasoupService.createProducer(
                transportId,
                producerId,
                kind,
                rtpParameters,
            );

            // Track producer for cleanup
            if (!this.userProducers.has(client.userId)) {
                this.userProducers.set(client.userId, new Set());
            }
            this.userProducers.get(client.userId)!.add(producerId);

            // Update session to active when first producer is created
            const session =
                await this.liveStreamSessionService.getSessionById(sessionId);
            if (
                session.status === SessionStatus.RINGING ||
                session.status === SessionStatus.PENDING
            ) {
                await this.liveStreamSessionService.updateSessionStatus(
                    sessionId,
                    SessionStatus.ACTIVE,
                );
            }

            // Notify others about new producer
            client.to(`session:${sessionId}`).emit("new-producer", {
                producerId,
                userId: client.userId,
                kind,
            });

            return {
                success: true,
                producerId,
            };
        } catch (error) {
            this.logger.error("Error producing:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("consume")
    async handleConsume(
        @MessageBody()
        data: {
            sessionId: string;
            transportId: string;
            producerId: string;
            rtpCapabilities: any;
        },
        @ConnectedSocket() _client: AuthenticatedSocket,
    ) {
        try {
            const { sessionId, transportId, producerId, rtpCapabilities } =
                data;

            const consumer = await this.mediasoupService.createConsumer(
                sessionId,
                transportId,
                producerId,
                rtpCapabilities,
            );

            if (!consumer) {
                return { success: false, error: "Cannot consume" };
            }

            return {
                success: true,
                ...consumer,
            };
        } catch (error) {
            this.logger.error("Error consuming:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("session-answer")
    async handleSessionAnswer(
        @MessageBody() data: { sessionId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { sessionId } = data;
            const session =
                await this.liveStreamSessionService.getSessionById(sessionId);

            // Verify recipient is answering
            if (session.recipientId !== client.userId) {
                throw new UnauthorizedException(
                    "Only recipient can answer the session",
                );
            }

            // Notify initiator
            const initiatorSocket = this.userSockets.get(session.initiatorId);
            if (initiatorSocket) {
                initiatorSocket.emit("session-answered", {
                    sessionId,
                    userId: client.userId,
                });
            }

            return { success: true };
        } catch (error) {
            this.logger.error("Error answering session:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("session-reject")
    async handleSessionReject(
        @MessageBody() data: { sessionId: string },
        @ConnectedSocket() _client: AuthenticatedSocket,
    ) {
        try {
            const { sessionId } = data;
            const _session =
                await this.liveStreamSessionService.getSessionById(sessionId);

            // Update session status
            await this.liveStreamSessionService.updateSessionStatus(
                sessionId,
                SessionStatus.REJECTED,
                { endReason: "Session rejected by recipient" },
            );

            // Notify all participants
            this.server
                .to(`session:${sessionId}`)
                .emit("session-rejected", { sessionId });

            // Clean up
            await this.mediasoupService.cleanupCall(sessionId);

            return { success: true };
        } catch (error) {
            this.logger.error("Error rejecting session:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    // Live streaming room specific handlers
    @SubscribeMessage("join-live-stream-room")
    async handleJoinLiveStreamRoom(
        @MessageBody() data: { sessionId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { sessionId } = data;

            // Use the service method to join (which validates the room)
            await this.liveStreamSessionService.joinLiveStreamRoom({
                sessionId,
                userId: client.userId,
            });

            // Join the room socket channel
            client.join(`session:${sessionId}`);

            // Track participants
            if (!this.sessionParticipants.has(sessionId)) {
                this.sessionParticipants.set(sessionId, new Set());
            }
            this.sessionParticipants.get(sessionId)!.add(client.userId);

            this.logger.log(
                `User ${client.userId} joined live stream room ${sessionId}`,
            );

            // Get router RTP capabilities
            const rtpCapabilities =
                this.mediasoupService.getRouterRtpCapabilities(sessionId);

            // Notify others in the room about new viewer
            client
                .to(`session:${sessionId}`)
                .emit("viewer-joined", { userId: client.userId });

            return {
                success: true,
                rtpCapabilities,
                participants: Array.from(
                    this.sessionParticipants.get(sessionId)!,
                ),
            };
        } catch (error) {
            this.logger.error("Error joining live stream room:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("leave-live-stream-room")
    async handleLeaveLiveStreamRoom(
        @MessageBody() data: { sessionId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { sessionId } = data;

            // Use the service method to leave (handles streamer ending room)
            await this.liveStreamSessionService.leaveLiveStreamRoom({
                sessionId,
                userId: client.userId,
            });

            // Leave the socket room
            client.leave(`session:${sessionId}`);

            // Remove from participants
            const participants = this.sessionParticipants.get(sessionId);
            if (participants) {
                participants.delete(client.userId);
                if (participants.size === 0) {
                    this.sessionParticipants.delete(sessionId);
                }
            }

            // Notify others that viewer left
            client
                .to(`session:${sessionId}`)
                .emit("viewer-left", { userId: client.userId });

            this.logger.log(
                `User ${client.userId} left live stream room ${sessionId}`,
            );

            return { success: true };
        } catch (error) {
            this.logger.error("Error leaving live stream room:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    // Helper method to notify specific user
    notifyUser(userId: number, event: string, data: any) {
        const socket = this.userSockets.get(userId);
        if (socket) {
            socket.emit(event, data);
        }
    }
}
