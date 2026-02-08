import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger } from "@nestjs/common";
import { ChatService } from "../services/chat.service";
import { LiveStreamSessionService } from "../services/live-stream-session.service";
import { GrokService } from "../services/grok.service";
import { EntityManager } from "typeorm";
import { User } from "../entities/user.entity";
import { SessionStatus } from "../enums/session-status.enum";

@WebSocketGateway({
    cors: {
        origin: ["http://localhost:4200", "app.impulseapp.net"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
})
@Injectable()
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private userSockets = new Map<string, Socket>();
    private userIdToEmail = new Map<number, string>();
    private grokUserId: number | null = null;

    constructor(
        private chatService: ChatService,
        private liveStreamSessionService: LiveStreamSessionService,
        private grokService: GrokService,
        private entityManager: EntityManager,
    ) {
        // Initialize Grok user ID on startup
        this.initializeGrokUser();
    }

    /**
     * Find or create the Grok user
     * Grok user is identified by email "grok@system" or username "Grok"
     */
    private async initializeGrokUser(): Promise<void> {
        try {
            // Try to find Grok user by email first
            let grokUser = await this.entityManager.findOne(User, {
                where: { email: "grok@system" },
            });

            // If not found, try by name (firstname + lastname = "Grok")
            if (!grokUser) {
                grokUser = await this.entityManager.findOne(User, {
                    where: [
                        { firstname: "Grok", lastname: "" },
                        { firstname: "Grok", lastname: " " },
                    ],
                });
            }

            if (grokUser) {
                this.grokUserId = grokUser.id;
                this.logger.log(`Grok user found with ID: ${this.grokUserId}`);
            } else {
                this.logger.warn(
                    "Grok user not found. Please create a user with email 'grok@system' or name 'Grok' to enable Grok integration.",
                );
            }
        } catch (error) {
            this.logger.error("Error initializing Grok user:", error);
        }
    }

    /**
     * Check if recipient is Grok user
     */
    private isGrokUser(userId: number): boolean {
        return this.grokUserId !== null && userId === this.grokUserId;
    }

    async handleConnection(client: Socket) {
        const email = client.handshake.query.email as string;
        const userId = client.handshake.query.userId as string;

        if (email) {
            this.userSockets.set(email, client);
            if (userId) {
                const userIdNum = parseInt(userId);
                this.userIdToEmail.set(userIdNum, email);

                // Join user to their own room for targeted notifications
                client.join(`user:${userIdNum}`);

                // Update lastOnline timestamp in database
                await this.updateLastOnline(userIdNum);

                // Broadcast online status change
                this.server.emit("user:online", { email, userId: userIdNum });
            }
        }
    }

    handleDisconnect(client: Socket) {
        const email = client.handshake.query.email as string;
        const userId = client.handshake.query.userId as string;

        if (email) {
            this.userSockets.delete(email);
            if (userId) {
                const userIdNum = parseInt(userId);
                this.userIdToEmail.delete(userIdNum);

                // Leave user room
                client.leave(`user:${userIdNum}`);
            }
            // Broadcast offline status change
            this.server.emit("user:offline", {
                email,
                userId: parseInt(userId),
            });
        }
    }

    getOnlineUserIds(): number[] {
        return Array.from(this.userIdToEmail.keys());
    }

    isUserOnline(userId: number): boolean {
        return this.userIdToEmail.has(userId);
    }

    private async updateLastOnline(userId: number): Promise<void> {
        try {
            await this.entityManager.update(
                User,
                { id: userId },
                { lastOnline: new Date() },
            );
        } catch (error) {
            console.error(
                `Failed to update lastOnline for user ${userId}:`,
                error,
            );
        }
    }

    @SubscribeMessage("chat:send")
    async handleSend(
        @MessageBody()
        payload: {
            conversationId?: number;
            senderId: number;
            recipientId: number;
            content: string;
        },
        @ConnectedSocket() _client: Socket,
    ) {
        try {
            // Update sender's lastOnline timestamp
            await this.updateLastOnline(payload.senderId);

            // Check if recipient is Grok user and handle accordingly
            if (this.isGrokUser(payload.recipientId)) {
                return await this.handleGrokMessage(payload);
            }

            let conversationId = payload.conversationId;
            if (!conversationId) {
                const conv = await this.chatService.getOrCreateConversation(
                    payload.senderId,
                    payload.recipientId,
                );
                conversationId = conv.id;
            }
            const message = await this.chatService.sendMessage(
                conversationId,
                payload.senderId,
                payload.content,
                "text",
            );
            this.server.emit(`chat:message:${conversationId}`, message);
            this.server.emit("chat:message", { conversationId, message });
            return message;
        } catch (err: any) {
            // Normalize error for WS pipeline to avoid instanceof issues
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to send chat message";
            return { error: true, message };
        }
    }

    /**
     * Handle messages sent to Grok user
     */
    private async handleGrokMessage(payload: {
        conversationId?: number;
        senderId: number;
        recipientId: number;
        content: string;
    }): Promise<any> {
        try {
            // Ensure Grok user is initialized
            if (this.grokUserId === null) {
                await this.initializeGrokUser();
                if (this.grokUserId === null) {
                    return {
                        error: true,
                        message:
                            "Grok user not found. Please configure Grok user in the system.",
                    };
                }
            }

            // Get or create conversation
            let conversationId = payload.conversationId;
            if (!conversationId) {
                const conv = await this.chatService.getOrCreateConversation(
                    payload.senderId,
                    this.grokUserId,
                );
                conversationId = conv.id;
            }

            // Save user's message first
            const userMessage = await this.chatService.sendMessage(
                conversationId,
                payload.senderId,
                payload.content,
                "text",
            );

            // Emit user message immediately
            this.server.emit(`chat:message:${conversationId}`, userMessage);
            this.server.emit("chat:message", {
                conversationId,
                message: userMessage,
            });

            // Get Grok response (async, don't wait)
            this.processGrokResponse(
                conversationId,
                payload.senderId,
                payload.content,
            );

            return userMessage;
        } catch (err: any) {
            this.logger.error("Error handling Grok message:", err);
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to send message to Grok";
            return { error: true, message };
        }
    }

    /**
     * Process Grok response and send it back as a message
     */
    private async processGrokResponse(
        conversationId: number,
        senderId: number,
        userContent: string,
    ): Promise<void> {
        try {
            // Call Grok API
            const grokResponse = await this.grokService.chat(
                senderId,
                userContent,
            );

            // Send Grok's response as a message from Grok user
            const grokMessage = await this.chatService.sendMessage(
                conversationId,
                this.grokUserId!,
                grokResponse,
                "text",
            );

            // Emit Grok's response
            this.server.emit(`chat:message:${conversationId}`, grokMessage);
            this.server.emit("chat:message", {
                conversationId,
                message: grokMessage,
            });

            this.logger.log(
                `Grok response sent for conversation ${conversationId}`,
            );
        } catch (err: any) {
            this.logger.error("Error processing Grok response:", err);
            // Send error message as Grok's response
            try {
                const errorMessage = await this.chatService.sendMessage(
                    conversationId,
                    this.grokUserId!,
                    "Sorry, I encountered an error processing your message. Please try again.",
                    "text",
                );
                this.server.emit(
                    `chat:message:${conversationId}`,
                    errorMessage,
                );
                this.server.emit("chat:message", {
                    conversationId,
                    message: errorMessage,
                });
            } catch (sendErr) {
                this.logger.error("Error sending error message:", sendErr);
            }
        }
    }

    // Video Call Event Handlers
    @SubscribeMessage("video-call:start")
    async handleVideoCallStart(
        @MessageBody() payload: { recipientId: number },
        @ConnectedSocket() client: Socket,
    ) {
        console.log("🎥 Video call start received:", payload);
        try {
            const senderId = parseInt(client.handshake.query.userId as string);
            console.log("🎥 Sender ID:", senderId);

            if (!senderId) {
                console.log("🎥 No sender ID found");
                return { error: true, message: "User not authenticated" };
            }

            // Get sender info for notification
            const sender = await this.entityManager.findOne(User, {
                where: { id: senderId },
                select: ["id", "firstname", "lastname", "email"],
            });

            console.log("🎥 Sender found:", sender);

            if (!sender) {
                return { error: true, message: "Sender not found" };
            }

            // Create the video call
            console.log(
                "🎥 Calling liveStreamSessionService.startSession with:",
                {
                    initiatorId: senderId,
                    recipientId: payload.recipientId,
                    isLiveStream: false,
                    maxParticipants: 2,
                },
            );

            const videoCall = await this.liveStreamSessionService.startSession({
                initiatorId: senderId,
                recipientId: payload.recipientId,
                isLiveStream: false,
                maxParticipants: 2,
            });

            console.log("🎥 Video call created:", videoCall);

            // Notify the recipient
            console.log(
                "🎥 Notifying recipient:",
                `user:${payload.recipientId}`,
            );
            const fullName = `${sender.firstname} ${sender.lastname}`.trim();
            this.server
                .to(`user:${payload.recipientId}`)
                .emit("video-call:incoming", {
                    callId: videoCall.id,
                    initiatorId: senderId,
                    initiatorName: fullName || sender.email,
                    sessionId: videoCall.id,
                });

            console.log("🎥 Notification sent successfully");

            return { success: true, callId: videoCall.id };
        } catch (err: any) {
            console.error("🎥 Error starting video call:", err);
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to start video call";
            return { error: true, message };
        }
    }

    @SubscribeMessage("video-call:accept")
    async handleVideoCallAccept(
        @MessageBody() payload: { callId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = parseInt(client.handshake.query.userId as string);

            if (!userId) {
                return { error: true, message: "User not authenticated" };
            }

            // Update call status to active
            const videoCall =
                await this.liveStreamSessionService.updateSessionStatus(
                    payload.callId,
                    SessionStatus.ACTIVE,
                );

            // Notify the initiator
            const initiatorId =
                videoCall.initiatorId === userId
                    ? videoCall.recipientId
                    : videoCall.initiatorId;
            this.server.to(`user:${initiatorId}`).emit("video-call:accepted", {
                callId: payload.callId,
                sessionId: payload.callId,
            });

            return { success: true };
        } catch (err: any) {
            console.error("Error accepting video call:", err);
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to accept video call";
            return { error: true, message };
        }
    }

    @SubscribeMessage("video-call:reject")
    async handleVideoCallReject(
        @MessageBody() payload: { callId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = parseInt(client.handshake.query.userId as string);

            if (!userId) {
                return { error: true, message: "User not authenticated" };
            }

            // Update call status to rejected
            await this.liveStreamSessionService.updateSessionStatus(
                payload.callId,
                SessionStatus.REJECTED,
                { endReason: "Call rejected by recipient" },
            );

            // Get call details to notify initiator
            const call = await this.liveStreamSessionService.getSessionById(
                payload.callId,
            );
            const initiatorId = call.initiatorId;

            // Notify the initiator
            this.server.to(`user:${initiatorId}`).emit("video-call:rejected");

            return { success: true };
        } catch (err: any) {
            console.error("Error rejecting video call:", err);
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to reject video call";
            return { error: true, message };
        }
    }

    @SubscribeMessage("video-call:end")
    async handleVideoCallEnd(
        @MessageBody() payload: { callId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = parseInt(client.handshake.query.userId as string);

            if (!userId) {
                return { error: true, message: "User not authenticated" };
            }

            // End the call
            const videoCall = await this.liveStreamSessionService.endSession(
                payload.callId,
            );

            // Notify the other participant
            const otherUserId =
                videoCall.initiatorId === userId
                    ? videoCall.recipientId
                    : videoCall.initiatorId;
            this.server.to(`user:${otherUserId}`).emit("video-call:ended");

            return { success: true };
        } catch (err: any) {
            console.error("Error ending video call:", err);
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to end video call";
            return { error: true, message };
        }
    }

    // WebRTC Signaling
    @SubscribeMessage("video-call:webrtc:offer")
    async handleWebRTCOffer(
        @MessageBody() payload: { callId: string; offer: any },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = parseInt(client.handshake.query.userId as string);

            if (!userId) {
                return { error: true, message: "User not authenticated" };
            }

            // Get call details to find the other participant
            const call = await this.liveStreamSessionService.getSessionById(
                payload.callId,
            );
            const otherUserId =
                call.initiatorId === userId
                    ? call.recipientId
                    : call.initiatorId;

            // Forward the offer to the other participant
            this.server
                .to(`user:${otherUserId}`)
                .emit("video-call:webrtc:offer", {
                    callId: payload.callId,
                    offer: payload.offer,
                });

            return { success: true };
        } catch (err: any) {
            console.error("Error handling WebRTC offer:", err);
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to handle WebRTC offer";
            return { error: true, message };
        }
    }

    @SubscribeMessage("video-call:webrtc:answer")
    async handleWebRTCAnswer(
        @MessageBody() payload: { callId: string; answer: any },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = parseInt(client.handshake.query.userId as string);

            if (!userId) {
                return { error: true, message: "User not authenticated" };
            }

            // Get call details to find the other participant
            const call = await this.liveStreamSessionService.getSessionById(
                payload.callId,
            );
            const otherUserId =
                call.initiatorId === userId
                    ? call.recipientId
                    : call.initiatorId;

            // Forward the answer to the other participant
            this.server
                .to(`user:${otherUserId}`)
                .emit("video-call:webrtc:answer", {
                    callId: payload.callId,
                    answer: payload.answer,
                });

            return { success: true };
        } catch (err: any) {
            console.error("Error handling WebRTC answer:", err);
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to handle WebRTC answer";
            return { error: true, message };
        }
    }

    @SubscribeMessage("video-call:webrtc:ice-candidate")
    async handleWebRTCIceCandidate(
        @MessageBody() payload: { callId: string; candidate: any },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = parseInt(client.handshake.query.userId as string);

            if (!userId) {
                return { error: true, message: "User not authenticated" };
            }

            // Get call details to find the other participant
            const call = await this.liveStreamSessionService.getSessionById(
                payload.callId,
            );
            const otherUserId =
                call.initiatorId === userId
                    ? call.recipientId
                    : call.initiatorId;

            // Forward the ICE candidate to the other participant
            this.server
                .to(`user:${otherUserId}`)
                .emit("video-call:webrtc:ice-candidate", {
                    callId: payload.callId,
                    candidate: payload.candidate,
                });

            return { success: true };
        } catch (err: any) {
            console.error("Error handling WebRTC ICE candidate:", err);
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to handle WebRTC ICE candidate";
            return { error: true, message };
        }
    }
}
