import { Injectable, inject, Injector, DestroyRef } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { signal } from "@angular/core";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from "../services/auth.service";
import {
    MessagesService,
    UserService,
} from "src/typescript-api-client/src/api/api";
import { UserDTO } from "src/typescript-api-client/src/model/user-dto";
import { ChatMessageDTO } from "src/typescript-api-client/src/model/chat-message-dto";
import { ChatConversationDTO } from "src/typescript-api-client/src/model/chat-conversation-dto";
import { CreateConversationDTO } from "src/typescript-api-client/src/model/create-conversation-dto";
import { FriendsService } from "src/typescript-api-client/src/api/friends.service";
import { ChatService as ChatApiService } from "src/typescript-api-client/src/api/chat.service";
import { WebsocketService } from "../services/websocket.service";

// UI Extensions - extend backend DTOs with UI-specific fields only
export interface User extends Omit<
    UserDTO,
    "id" | "password" | "confirmPassword"
> {
    id: string; // Convert number to string for UI routing
    name?: string; // Computed from fullName for display
    avatar?: string; // Blob URL for profile picture
    isOnline?: boolean; // Real-time WebSocket status
    lastSeen?: Date; // Parsed date for UI
}

export interface Message extends Omit<ChatMessageDTO, "id" | "senderId"> {
    id: string; // Convert number to string for UI
    senderId: string; // Convert number to string for UI
    receiverId?: string; // Computed for bilateral conversations
    timestamp?: Date; // Parsed date helper
    // Gift-specific fields
    isGift?: boolean;
    giftEmoji?: string;
    giftAmount?: string;
    giftMessage?: string;
}

export interface Conversation extends Omit<
    ChatConversationDTO,
    "id" | "participants"
> {
    id: string; // Convert number to string for UI
    participants: string[]; // Convert number[] to string[] for UI
    lastMessage?: string; // Computed from messages
    lastMessageTime?: Date; // Parsed date helper
    name?: string; // Display name from otherUser
    avatar?: string; // Blob URL
    isOnline?: boolean; // Real-time status
}

@Injectable({
    providedIn: "root",
})
export class ChatService {
    private readonly destroyRef = inject(DestroyRef);
    private readonly injector = inject(Injector);
    private readonly httpClient = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly userService = inject(UserService);
    private readonly friendsApi = inject(FriendsService);
    private readonly chatApi = inject(ChatApiService);
    private readonly ws = inject(WebsocketService);
    private readonly messagesService = inject(MessagesService);

    // Signals as single source of truth
    private readonly usersSignal = signal<User[]>([]);
    private readonly friendsSignal = signal<User[]>([]);
    private readonly conversationsSignal = signal<Conversation[]>([]);
    private readonly messagesSignal = signal<Message[]>([]);

    readonly users = this.usersSignal.asReadonly();
    readonly friends = this.friendsSignal.asReadonly();
    readonly conversations = this.conversationsSignal.asReadonly();
    readonly messages = this.messagesSignal.asReadonly();

    // Expose as Observables for backward compatibility (e.g. toSignal, subscribe)
    readonly users$ = toObservable(this.usersSignal, {
        injector: this.injector,
    });
    readonly friends$ = toObservable(this.friendsSignal, {
        injector: this.injector,
    });
    readonly conversations$ = toObservable(this.conversationsSignal, {
        injector: this.injector,
    });
    readonly messages$ = toObservable(this.messagesSignal, {
        injector: this.injector,
    });

    constructor() {
        this.applyAuthHeadersToApiServices();
        this.loadInitialData();
        this.setupGlobalChatSubscription();
    }

    private setupGlobalChatSubscription(): void {
        this.ws
            .onAnyChatMessage()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(({ conversationId, message }) => {
                const currentUserId = this.getCurrentUserId();
                const otherUserId =
                    Number(message.senderId) === currentUserId
                        ? this.getOtherUserIdFromConversation(
                              conversationId,
                              currentUserId,
                          )
                        : Number(message.senderId);

                const convId = String(conversationId);
                const existing = this.conversationsSignal().find(
                    (c) => c.id === convId,
                );
                const updated: Conversation = existing
                    ? {
                          ...existing,
                          lastMessage: message.content,
                          lastMessageTime: new Date(
                              message.createdAt ?? Date.now(),
                          ),
                          unreadCount:
                              (existing.unreadCount ?? 0) +
                              (Number(message.senderId) === currentUserId
                                  ? 0
                                  : 1),
                      }
                    : ({
                          id: convId,
                          participants: [
                              String(currentUserId),
                              String(otherUserId),
                          ],
                          unreadCount:
                              Number(message.senderId) === currentUserId
                                  ? 0
                                  : 1,
                          lastMessage: message.content,
                          lastMessageTime: new Date(
                              message.createdAt ?? Date.now(),
                          ),
                      } as Conversation);

                const convs = this.conversationsSignal().filter(
                    (c) => c.id !== updated.id,
                );
                this.conversationsSignal.set([updated, ...convs]);
            });
    }

    private getOtherUserIdFromConversation(
        conversationId: number,
        currentUserId: number,
    ): number {
        const conv = this.conversationsSignal().find(
            (c) => c.id === String(conversationId),
        );
        if (!conv || !conv.participants || conv.participants.length === 0) {
            return 0;
        }
        const other = conv.participants
            .map((p) => Number(p))
            .find((p) => p !== currentUserId);
        return other ?? 0;
    }

    private loadInitialData(): void {
        this.loadUsers();
        this.loadFriends();
        this.loadBackendConversations();
    }

    private applyAuthHeadersToApiServices(): void {
        const token = localStorage.getItem("id_token");
        if (token) {
            const authHeader = `Bearer ${token}`;
            this.userService.defaultHeaders =
                this.userService.defaultHeaders.set(
                    "Authorization",
                    authHeader,
                );
            this.friendsApi.defaultHeaders = this.friendsApi.defaultHeaders.set(
                "Authorization",
                authHeader,
            );
            this.chatApi.defaultHeaders = this.chatApi.defaultHeaders.set(
                "Authorization",
                authHeader,
            );
        }
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem("id_token");
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        });
    }

    private getCurrentUserId(): number {
        return Number(
            JSON.parse(
                atob(
                    (localStorage.getItem("id_token") || "").split(".")[1] ||
                        "e30=",
                ),
            )?.id || 0,
        );
    }

    private loadBackendConversations(): void {
        const userId = this.getCurrentUserId();
        if (!userId) return;
        this.chatApi.getConversations(userId).subscribe({
            next: (convs: ChatConversationDTO[]) => {
                const selfId = String(userId);
                const mapped: Conversation[] = (convs || []).map(
                    (c: ChatConversationDTO) => {
                        const participantIds = (c.participants || []).map((p) =>
                            String(p),
                        );

                        const last =
                            c.messages && c.messages.length > 0
                                ? c.messages[c.messages.length - 1]
                                : undefined;

                        const other = c.otherUser;
                        const otherId = participantIds.find(
                            (pid) => pid !== selfId,
                        );
                        const friend = this.friendsSignal().find(
                            (f) =>
                                String(f.id) === String(otherId) ||
                                f.email === otherId,
                        );

                        return {
                            id: String(c.id),
                            participants: participantIds,
                            messages: c.messages,
                            unreadCount: c.unreadCount ?? 0,
                            otherUser: c.otherUser,
                            lastMessage: last?.content,
                            lastMessageTime: last?.createdAt
                                ? new Date(last.createdAt)
                                : undefined,
                            name:
                                friend?.name ||
                                (other
                                    ? `${other.firstname ?? ""} ${other.lastname ?? ""}`.trim() ||
                                      other.email
                                    : undefined),
                            createdAt: c.createdAt,
                            updatedAt: c.updatedAt,
                        } as Conversation;
                    },
                );
                this.conversationsSignal.set(mapped);
            },
            error: () => {
                // Keep existing state
            },
        });
    }

    private loadUsers(): void {
        this.applyAuthHeadersToApiServices();
        this.userService
            .getAll(1, 1000, "all", "recent", "", "", 0, 100, "", "", false)
            .subscribe({
                next: (response: any) => {
                    const users: any[] = response.users || [];
                    const mapped: User[] = (users || []).map((u) => {
                        const fullName =
                            `${u.firstname ?? ""} ${u.lastname ?? ""}`.trim() ||
                            u.fullName ||
                            u.email;
                        return {
                            id: String(u.id ?? u.email),
                            name: fullName,
                            fullName: fullName,
                            email: u.email,
                            avatar: undefined,
                            isOnline: false,
                            gender: u.gender,
                            city: u.city,
                            lastOnline: u.lastOnline,
                            profilePictureId: u.profilePictureId,
                        };
                    });
                    this.usersSignal.set(mapped);
                },
                error: () => {
                    this.usersSignal.set([]);
                },
            });
    }

    private loadFriends(): void {
        this.applyAuthHeadersToApiServices();
        this.friendsApi.getAcceptedFriends().subscribe({
            next: (friends: any[]) => {
                const currentEmail = this.authService.getUserEmail();
                const mapped: User[] = (friends || [])
                    .map((f: any) => {
                        const other =
                            f.user?.email === currentEmail ? f.friend : f.user;
                        const fullName =
                            `${other?.firstname ?? ""} ${other?.lastname ?? ""}`.trim() ||
                            other?.email;
                        return {
                            id: String(other?.id ?? other?.email),
                            name: fullName,
                            fullName: fullName,
                            email: other?.email,
                            avatar: undefined,
                            isOnline: false,
                            gender: other?.gender,
                            city: other?.city,
                            lastOnline: other?.lastOnline,
                            profilePictureId: other?.profilePictureId,
                        } as User;
                    })
                    .filter((u: User) => !!u.email);
                this.friendsSignal.set(mapped);
            },
            error: (err) => {
                console.error("Error loading friends:", err);
                this.friendsSignal.set([]);
            },
        });
    }

    getOrCreateConversation(
        otherUserId: number,
    ): Observable<ChatConversationDTO> {
        const currentUserId = this.getCurrentUserId();
        const dto: CreateConversationDTO = {
            userId: currentUserId,
            otherUserId,
        };
        return this.chatApi.getOrCreateConversation(dto);
    }

    loadConversationMessages(
        conversationId: number,
    ): Observable<ChatMessageDTO[]> {
        return this.chatApi.getMessages(conversationId);
    }

    subscribeToConversation(conversationId: number): Observable<any> {
        return this.ws.onChatMessage(conversationId);
    }

    sendChatMessage(
        conversationId: number | undefined,
        recipientId: number,
        content: string,
    ): void {
        const currentUserId = this.getCurrentUserId();
        this.ws.sendChat({
            conversationId,
            senderId: currentUserId,
            recipientId,
            content,
        });
    }

    getLastRegisteredUsers(limit: number = 10): Observable<User[]> {
        return this.users$.pipe(map((users) => users.slice(-limit)));
    }

    getTopFriends(limit: number = 10): Observable<User[]> {
        return this.friends$.pipe(map((friends) => friends.slice(0, limit)));
    }

    getRecentMessages(limit: number = 5): Observable<Message[]> {
        return this.conversations$.pipe(
            map((conversations) => {
                const allMessages: Message[] = [];

                conversations.forEach((conv) => {
                    if (conv.messages && conv.messages.length > 0) {
                        conv.messages.forEach((msg) => {
                            allMessages.push({
                                id: String(msg.id),
                                conversationId: msg.conversationId,
                                senderId: String(msg.senderId),
                                content: msg.content,
                                type: msg.type,
                                isRead: msg.isRead,
                                createdAt: msg.createdAt,
                                updatedAt: msg.updatedAt,
                                timestamp: new Date(
                                    msg.createdAt || Date.now(),
                                ),
                            });
                        });
                    }
                });

                const sorted = allMessages.sort(
                    (a, b) =>
                        (b.timestamp?.getTime() || 0) -
                        (a.timestamp?.getTime() || 0),
                );
                return sorted.slice(0, limit);
            }),
        );
    }

    getConversation(userId: string): Observable<Conversation | null> {
        const conversation = this.conversationsSignal().find((conv) =>
            (conv.participants || []).includes(userId),
        );
        return of(conversation || null);
    }

    getMessages(userId: string): Observable<Message[]> {
        const messages = this.messagesSignal()
            .filter(
                (msg) =>
                    (msg.senderId === userId && msg.receiverId === "1") ||
                    (msg.senderId === "1" && msg.receiverId === userId),
            )
            .sort(
                (a, b) =>
                    (a.timestamp?.getTime() || 0) -
                    (b.timestamp?.getTime() || 0),
            );
        return of(messages);
    }

    sendMessage(
        message: Omit<Message, "id" | "timestamp">,
    ): Observable<Message> {
        const newMessage: Message = {
            ...message,
            id: Date.now().toString(),
            timestamp: new Date(),
        };

        const currentMessages = this.messagesSignal();
        this.messagesSignal.set([...currentMessages, newMessage]);

        const conversation = this.conversationsSignal().find((conv) =>
            (conv.participants || []).includes(message.receiverId || ""),
        );

        if (conversation) {
            const updatedConversations = this.conversationsSignal().map(
                (conv) =>
                    conv.id === conversation.id
                        ? {
                              ...conv,
                              lastMessage: newMessage.content,
                              lastMessageTime: newMessage.timestamp,
                              unreadCount:
                                  message.senderId === "1"
                                      ? conv.unreadCount || 0
                                      : (conv.unreadCount || 0) + 1,
                          }
                        : conv,
            );
            this.conversationsSignal.set(updatedConversations);
        }

        return of(newMessage);
    }

    markAsRead(messageId: string): void {
        const messages = this.messagesSignal().map((msg) =>
            msg.id === messageId ? { ...msg, isRead: true } : msg,
        );
        this.messagesSignal.set(messages);
    }

    searchUsers(query: string): Observable<User[]> {
        const users = this.usersSignal().filter(
            (user) =>
                user?.name?.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase()),
        );
        return of(users);
    }

    addFriend(userId: string): void {
        const user = this.usersSignal().find((u) => u.id === userId);
        if (user && !this.friendsSignal().find((f) => f.id === userId)) {
            const currentFriends = this.friendsSignal();
            this.friendsSignal.set([...currentFriends, user]);
        }
    }

    removeFriend(userId: string): void {
        const currentFriends = this.friendsSignal().filter(
            (f) => f.id !== userId,
        );
        this.friendsSignal.set(currentFriends);
    }
}
