import { Injectable } from "@angular/core";
import { Socket, io } from "socket.io-client";
import { Observable } from "rxjs";
import {
    MessageDTO,
    ChatMessageDTO,
} from "../../typescript-api-client/src/model/models";
import { AuthService } from "./auth.service";
import { environment } from "../../environments/environment";

// Define proper types for Socket.IO events
interface ProfileViewNotification {
    viewerId: number;
    viewerName: string;
    viewerEmail: string;
    viewerProfilePictureId?: number;
    viewedAt: string;
    message: string;
}

interface ChatMessagePayload {
    conversationId: number;
    message: ChatMessageDTO;
}

interface VerificationStatusChangeNotification {
    status: string;
    rejectionReason?: string;
    reviewedAt: string;
    message: string;
}

interface GiftReceivedNotification {
    giftId: number;
    senderId: number;
    senderName: string;
    senderEmail: string;
    giftEmoji: string;
    amount: string;
    message: string | null;
    createdAt: string;
}

@Injectable({
    providedIn: "root",
})
export class WebsocketService {
    private socket: Socket;

    constructor(private authService: AuthService) {
        const email = this.authService.getUserEmail();
        const token = localStorage.getItem("id_token");
        let userId = "";

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                userId = payload.id || "";
            } catch (error) {
                console.error("Error parsing token for userId:", error);
            }
        }

        this.socket = io(environment.socketUrl, {
            query: {
                email: email || "",
                userId: userId,
            },
            transports: ["websocket", "polling"],
            withCredentials: true,
        });

        this.socket.on("connect", () => {
            // Socket connected
        });
        this.socket.on("disconnect", (reason) => {
            // Socket disconnected
        });
        this.socket.on("connect_error", (err: Error) => {
            console.error("Socket connect_error:", err?.message || err);
        });
        this.socket.on("error", (err: Error) => {
            console.error("Socket error:", err);
        });
    }

    subscribeToMessages(): Observable<void> {
        return new Observable<void>((observer) => {
            const handler = () => observer.next();
            this.socket.on("messageCreated", handler);
            return () => this.socket.off("messageCreated", handler);
        });
    }

    onPresenceSnapshot(): Observable<string[]> {
        return new Observable<string[]>((observer) => {
            const handler = (onlineEmails: string[]) =>
                observer.next(onlineEmails || []);
            this.socket.on("presence:snapshot", handler);
            return () => this.socket.off("presence:snapshot", handler);
        });
    }

    onPresenceOnline(): Observable<string> {
        return new Observable<string>((observer) => {
            const handler = (email: string) => observer.next(email);
            this.socket.on("presence:online", handler);
            return () => this.socket.off("presence:online", handler);
        });
    }

    onPresenceOffline(): Observable<string> {
        return new Observable<string>((observer) => {
            const handler = (email: string) => observer.next(email);
            this.socket.on("presence:offline", handler);
            return () => this.socket.off("presence:offline", handler);
        });
    }

    onFriendRequestCreated(): Observable<void> {
        return new Observable<void>((observer) => {
            const handler = () => {
                observer.next();
            };
            this.socket.on("friend:request:created", handler);
            return () => this.socket.off("friend:request:created", handler);
        });
    }

    onFriendRequestUpdated(): Observable<void> {
        return new Observable<void>((observer) => {
            const handler = () => {
                observer.next();
            };
            this.socket.on("friend:request:updated", handler);
            return () => this.socket.off("friend:request:updated", handler);
        });
    }

    onFriendListUpdated(): Observable<void> {
        return new Observable<void>((observer) => {
            const handler = () => {
                observer.next();
            };
            this.socket.on("friend:list:updated", handler);
            return () => this.socket.off("friend:list:updated", handler);
        });
    }

    // Chat helpers
    sendChat(payload: {
        conversationId?: number;
        senderId: number;
        recipientId: number;
        content: string;
    }) {
        this.socket.emit("chat:send", payload);
    }

    onChatMessage(conversationId: number): Observable<ChatMessageDTO> {
        return new Observable<ChatMessageDTO>((observer) => {
            const event = `chat:message:${conversationId}`;
            const handler = (message: ChatMessageDTO) => observer.next(message);
            this.socket.on(event, handler);
            return () => this.socket.off(event, handler);
        });
    }

    onAnyChatMessage(): Observable<ChatMessagePayload> {
        return new Observable<ChatMessagePayload>((observer) => {
            const handler = (payload: ChatMessagePayload) =>
                observer.next(payload);
            this.socket.on("chat:message", handler);
            return () => this.socket.off("chat:message", handler);
        });
    }

    onUserOnline(): Observable<{ email: string; userId: number }> {
        return new Observable<{ email: string; userId: number }>((observer) => {
            const handler = (payload: { email: string; userId: number }) => {
                observer.next(payload);
            };
            this.socket.on("user:online", handler);
            return () => this.socket.off("user:online", handler);
        });
    }

    onUserOffline(): Observable<{ email: string; userId: number }> {
        return new Observable<{ email: string; userId: number }>((observer) => {
            const handler = (payload: { email: string; userId: number }) => {
                observer.next(payload);
            };
            this.socket.on("user:offline", handler);
            return () => this.socket.off("user:offline", handler);
        });
    }

    onProfileView(): Observable<ProfileViewNotification> {
        return new Observable<ProfileViewNotification>((observer) => {
            const handler = (payload: ProfileViewNotification) => {
                observer.next(payload);
            };
            this.socket.on("profile:view", handler);
            return () => this.socket.off("profile:view", handler);
        });
    }

    onVerificationStatusChange(): Observable<VerificationStatusChangeNotification> {
        return new Observable<VerificationStatusChangeNotification>((observer) => {
            const handler = (payload: VerificationStatusChangeNotification) => {
                observer.next(payload);
            };
            this.socket.on("verification:status_changed", handler);
            return () => this.socket.off("verification:status_changed", handler);
        });
    }

    onGiftReceived(): Observable<GiftReceivedNotification> {
        return new Observable<GiftReceivedNotification>((observer) => {
            const handler = (payload: GiftReceivedNotification) => {
                observer.next(payload);
            };
            this.socket.on("gift:received", handler);
            return () => this.socket.off("gift:received", handler);
        });
    }

    // Video Call Events
    emitStartCall(payload: { recipientId: number }) {
        console.log("📞 Frontend: Emitting video-call:start", payload);
        this.socket.emit("video-call:start", payload);
    }

    emitAcceptCall(payload: { callId: string }) {
        this.socket.emit("video-call:accept", payload);
    }

    emitRejectCall(payload: { callId: string }) {
        this.socket.emit("video-call:reject", payload);
    }

    emitEndCall(payload: { callId: string }) {
        this.socket.emit("video-call:end", payload);
    }

    emitWebRTCOffer(payload: { callId: string; offer: RTCSessionDescriptionInit }) {
        this.socket.emit("video-call:webrtc:offer", payload);
    }

    emitWebRTCAnswer(payload: { callId: string; answer: RTCSessionDescriptionInit }) {
        this.socket.emit("video-call:webrtc:answer", payload);
    }

    emitWebRTCIceCandidate(payload: { callId: string; candidate: RTCIceCandidate }) {
        this.socket.emit("video-call:webrtc:ice-candidate", payload);
    }

    onIncomingCall(): Observable<any> {
        return new Observable<any>((observer) => {
            const handler = (payload: any) => observer.next(payload);
            this.socket.on("video-call:incoming", handler);
            return () => this.socket.off("video-call:incoming", handler);
        });
    }

    onCallAccepted(): Observable<any> {
        return new Observable<any>((observer) => {
            const handler = (payload: any) => observer.next(payload);
            this.socket.on("video-call:accepted", handler);
            return () => this.socket.off("video-call:accepted", handler);
        });
    }

    onCallRejected(): Observable<any> {
        return new Observable<any>((observer) => {
            const handler = (payload: any) => observer.next(payload);
            this.socket.on("video-call:rejected", handler);
            return () => this.socket.off("video-call:rejected", handler);
        });
    }

    onCallEnded(): Observable<any> {
        return new Observable<any>((observer) => {
            const handler = (payload: any) => observer.next(payload);
            this.socket.on("video-call:ended", handler);
            return () => this.socket.off("video-call:ended", handler);
        });
    }

    onWebRTCOffer(): Observable<any> {
        return new Observable<any>((observer) => {
            const handler = (payload: any) => observer.next(payload);
            this.socket.on("video-call:webrtc:offer", handler);
            return () => this.socket.off("video-call:webrtc:offer", handler);
        });
    }

    onWebRTCAnswer(): Observable<any> {
        return new Observable<any>((observer) => {
            const handler = (payload: any) => observer.next(payload);
            this.socket.on("video-call:webrtc:answer", handler);
            return () => this.socket.off("video-call:webrtc:answer", handler);
        });
    }

    onWebRTCIceCandidate(): Observable<any> {
        return new Observable<any>((observer) => {
            const handler = (payload: any) => observer.next(payload);
            this.socket.on("video-call:webrtc:ice-candidate", handler);
            return () => this.socket.off("video-call:webrtc:ice-candidate", handler);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
