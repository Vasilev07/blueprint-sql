import { Injectable } from "@angular/core";
import { Socket, io } from "socket.io-client";
import { Observable } from "rxjs";
import { MessageDTO } from "../../typescript-api-client/src/model/models";
import { AuthService } from "./auth.service";
import { environment } from "../../environments/environment";

@Injectable({
    providedIn: "root",
})
export class WebsocketService {
    private socket: Socket;

    constructor(private authService: AuthService) {
        console.log("WebsocketService constructor called");
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
            console.log("Socket connected:", this.socket.id);
        });
        this.socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
        });
        this.socket.on("connect_error", (err: any) => {
            console.error("Socket connect_error:", err?.message || err);
        });
        this.socket.on("error", (err: any) => {
            console.error("Socket error:", err);
        });
        console.log("Socket created for:", email);
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
                console.log("WebSocket: Received friend:request:created");
                observer.next();
            };
            this.socket.on("friend:request:created", handler);
            return () => this.socket.off("friend:request:created", handler);
        });
    }

    onFriendRequestUpdated(): Observable<void> {
        return new Observable<void>((observer) => {
            const handler = () => {
                console.log("WebSocket: Received friend:request:updated");
                observer.next();
            };
            this.socket.on("friend:request:updated", handler);
            return () => this.socket.off("friend:request:updated", handler);
        });
    }

    onFriendListUpdated(): Observable<void> {
        return new Observable<void>((observer) => {
            const handler = () => {
                console.log("WebSocket: Received friend:list:updated");
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

    onChatMessage(conversationId: number): Observable<any> {
        return new Observable<any>((observer) => {
            const event = `chat:message:${conversationId}`;
            const handler = (message: any) => observer.next(message);
            this.socket.on(event, handler);
            return () => this.socket.off(event, handler);
        });
    }

    onAnyChatMessage(): Observable<{ conversationId: number; message: any }> {
        return new Observable<{ conversationId: number; message: any }>(
            (observer) => {
                const handler = (payload: {
                    conversationId: number;
                    message: any;
                }) => observer.next(payload);
                this.socket.on("chat:message", handler);
                return () => this.socket.off("chat:message", handler);
            },
        );
    }

    onUserOnline(): Observable<{ email: string; userId: number }> {
        return new Observable<{ email: string; userId: number }>((observer) => {
            const handler = (payload: { email: string; userId: number }) => {
                console.log("User came online:", payload);
                observer.next(payload);
            };
            this.socket.on("user:online", handler);
            return () => this.socket.off("user:online", handler);
        });
    }

    onUserOffline(): Observable<{ email: string; userId: number }> {
        return new Observable<{ email: string; userId: number }>((observer) => {
            const handler = (payload: { email: string; userId: number }) => {
                console.log("User went offline:", payload);
                observer.next(payload);
            };
            this.socket.on("user:offline", handler);
            return () => this.socket.off("user:offline", handler);
        });
    }

    disconnect() {
        console.log("WebsocketService disconnect called");
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
