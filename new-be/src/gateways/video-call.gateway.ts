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
import { VideoCallService } from "../services/video-call.service";
import { CallStatus } from "../enums/call-status.enum";
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
    namespace: "/video-call",
    transports: ["websocket", "polling"],
})
@Injectable()
export class VideoCallGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(VideoCallGateway.name);
    private userSockets: Map<number, AuthenticatedSocket> = new Map();
    private callParticipants: Map<string, Set<number>> = new Map();

    // Store transport and producer IDs for cleanup
    private userTransports: Map<number, Set<string>> = new Map();
    private userProducers: Map<number, Set<string>> = new Map();

    constructor(
        private readonly mediasoupService: MediasoupService,
        private readonly videoCallService: VideoCallService,
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
            this.logger.log(`User ${client.userId} connected to video call`);

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
                `User ${client.userId} disconnected from video call`,
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

            // End any active calls
            const activeCall =
                await this.videoCallService.getActiveCallByUserId(
                    client.userId,
                );
            if (activeCall) {
                await this.videoCallService.endCall(
                    activeCall.id,
                    "User disconnected",
                );
                this.server.to(`call:${activeCall.id}`).emit("call-ended", {
                    callId: activeCall.id,
                    reason: "User disconnected",
                });
            }
        }
    }

    @SubscribeMessage("join-call")
    async handleJoinCall(
        @MessageBody() data: { callId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { callId } = data;
            const call = await this.videoCallService.getCallById(callId);

            // Verify user is part of the call
            if (
                call.initiatorId !== client.userId &&
                call.recipientId !== client.userId
            ) {
                throw new UnauthorizedException(
                    "You are not part of this call",
                );
            }

            // Join the call room
            client.join(`call:${callId}`);

            // Track participants
            if (!this.callParticipants.has(callId)) {
                this.callParticipants.set(callId, new Set());
            }
            this.callParticipants.get(callId)!.add(client.userId);

            this.logger.log(
                `User ${client.userId} joined call ${callId}`,
            );

            // Update call status to ringing if pending
            if (call.status === CallStatus.PENDING) {
                await this.videoCallService.updateCallStatus(
                    callId,
                    CallStatus.RINGING,
                );
            }

            // Get router RTP capabilities
            const rtpCapabilities =
                this.mediasoupService.getRouterRtpCapabilities(callId);

            // Notify others in the call
            client
                .to(`call:${callId}`)
                .emit("user-joined", { userId: client.userId });

            return {
                success: true,
                rtpCapabilities,
                participants: Array.from(
                    this.callParticipants.get(callId)!,
                ),
            };
        } catch (error) {
            this.logger.error("Error joining call:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("leave-call")
    async handleLeaveCall(
        @MessageBody() data: { callId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { callId } = data;

            client.leave(`call:${callId}`);

            // Remove from participants
            const participants = this.callParticipants.get(callId);
            if (participants) {
                participants.delete(client.userId);
                if (participants.size === 0) {
                    this.callParticipants.delete(callId);
                }
            }

            // Notify others
            client
                .to(`call:${callId}`)
                .emit("user-left", { userId: client.userId });

            this.logger.log(`User ${client.userId} left call ${callId}`);

            return { success: true };
        } catch (error) {
            this.logger.error("Error leaving call:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("create-transport")
    async handleCreateTransport(
        @MessageBody() data: { callId: string; direction: "send" | "recv" },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { callId, direction } = data;
            const transportId = `${callId}-${client.userId}-${direction}-${Date.now()}`;

            const transport =
                await this.mediasoupService.createWebRtcTransport(
                    callId,
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

    @SubscribeMessage("connect-transport")
    async handleConnectTransport(
        @MessageBody() data: { transportId: string; dtlsParameters: any },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { transportId, dtlsParameters } = data;

            await this.mediasoupService.connectTransport(
                transportId,
                dtlsParameters,
            );

            return { success: true };
        } catch (error) {
            this.logger.error("Error connecting transport:", error);
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
            callId: string;
            transportId: string;
            kind: "audio" | "video";
            rtpParameters: any;
        },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { callId, transportId, kind, rtpParameters } = data;
            const producerId = `${callId}-${client.userId}-${kind}-${Date.now()}`;

            const result = await this.mediasoupService.createProducer(
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

            // Update call to active when first producer is created
            const call = await this.videoCallService.getCallById(callId);
            if (
                call.status === CallStatus.RINGING ||
                call.status === CallStatus.PENDING
            ) {
                await this.videoCallService.updateCallStatus(
                    callId,
                    CallStatus.ACTIVE,
                );
            }

            // Notify others about new producer
            client.to(`call:${callId}`).emit("new-producer", {
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
            callId: string;
            transportId: string;
            producerId: string;
            rtpCapabilities: any;
        },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { callId, transportId, producerId, rtpCapabilities } = data;

            const consumer = await this.mediasoupService.createConsumer(
                callId,
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

    @SubscribeMessage("call-answer")
    async handleCallAnswer(
        @MessageBody() data: { callId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { callId } = data;
            const call = await this.videoCallService.getCallById(callId);

            // Verify recipient is answering
            if (call.recipientId !== client.userId) {
                throw new UnauthorizedException(
                    "Only recipient can answer the call",
                );
            }

            // Notify initiator
            const initiatorSocket = this.userSockets.get(call.initiatorId);
            if (initiatorSocket) {
                initiatorSocket.emit("call-answered", {
                    callId,
                    userId: client.userId,
                });
            }

            return { success: true };
        } catch (error) {
            this.logger.error("Error answering call:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    @SubscribeMessage("call-reject")
    async handleCallReject(
        @MessageBody() data: { callId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ) {
        try {
            const { callId } = data;
            const call = await this.videoCallService.getCallById(callId);

            // Update call status
            await this.videoCallService.updateCallStatus(
                callId,
                CallStatus.REJECTED,
                { endReason: "Call rejected by recipient" },
            );

            // Notify all participants
            this.server.to(`call:${callId}`).emit("call-rejected", { callId });

            // Clean up
            await this.mediasoupService.cleanupCall(callId);

            return { success: true };
        } catch (error) {
            this.logger.error("Error rejecting call:", error);
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

