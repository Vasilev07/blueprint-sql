import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";
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
import { environment } from "../../environments/environment";

// UI Extensions - extend backend DTOs with UI-specific fields only
export interface User extends Omit<UserDTO, 'id' | 'password' | 'confirmPassword'> {
    id: string; // Convert number to string for UI routing
    name?: string; // Computed from fullName for display
    avatar?: string; // Blob URL for profile picture
    isOnline?: boolean; // Real-time WebSocket status
    lastSeen?: Date; // Parsed date for UI
}

export interface Message extends Omit<ChatMessageDTO, 'id' | 'senderId'> {
    id: string; // Convert number to string for UI
    senderId: string; // Convert number to string for UI
    receiverId?: string; // Computed for bilateral conversations
    timestamp?: Date; // Parsed date helper
}

export interface Conversation extends Omit<ChatConversationDTO, 'id' | 'participants'> {
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
    private usersSubject = new BehaviorSubject<User[]>([]);
    private friendsSubject = new BehaviorSubject<User[]>([]);
    private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
    private messagesSubject = new BehaviorSubject<Message[]>([]);

    public users$ = this.usersSubject.asObservable();
    public friends$ = this.friendsSubject.asObservable();
    public conversations$ = this.conversationsSubject.asObservable();
    public messages$ = this.messagesSubject.asObservable();

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService,
        private userService: UserService,
        private friendsApi: FriendsService,
        private chatApi: ChatApiService,
        private ws: WebsocketService,
        private messagesService: MessagesService,
    ) {
        this.applyAuthHeadersToApiServices();
        this.loadInitialData();
        // Live updates for any chat messages
        this.ws.onAnyChatMessage().subscribe(({ conversationId, message }) => {
            const currentUserId = this.getCurrentUserId();
            const otherUserId =
                Number(message.senderId) === currentUserId
                    ? Number(message.recipientId)
                    : Number(message.senderId);

            // Append message to stream
            const nextMsg: Message = {
                id: String(
                    message.id ?? `${message.senderId}-${message.createdAt}`
                ),
                senderId: String(message.senderId),
                receiverId: String(otherUserId || ""),
                content: message.content,
                timestamp: new Date(message.createdAt ?? Date.now()),
                isRead: Number(message.senderId) === currentUserId,
                type: "text",
                conversationId: 0,
                createdAt: "",
                updatedAt: "",
            };
            this.messagesSubject.next([...this.messagesSubject.value, nextMsg]);

            // Normalize conversations using numeric user ids and conversation id
            const convId = String(conversationId);
            const existing = this.conversationsSubject.value.find(
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
                          (Number(message.senderId) === currentUserId ? 0 : 1),
                  }
                : ({
                      id: convId,
                      participants: [
                          String(currentUserId),
                          String(otherUserId),
                      ],
                      unreadCount:
                          Number(message.senderId) === currentUserId ? 0 : 1,
                      lastMessage: message.content,
                      lastMessageTime: new Date(
                          message.createdAt ?? Date.now(),
                      ),
                  } as Conversation);

            const convs = this.conversationsSubject.value.filter(
                (c) => c.id !== updated.id,
            );
            this.conversationsSubject.next([updated, ...convs]);
        });
    }

    private loadInitialData() {
        this.loadUsers();
        this.loadFriends();
        this.loadBackendConversations();
    }

    private applyAuthHeadersToApiServices() {
        const token = localStorage.getItem("id_token");
        if (token) {
            const authHeader = `Bearer ${token}`;
            // Set default headers for generated clients before calling them
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

    private loadBackendConversations() {
        const userId = this.getCurrentUserId();
        if (!userId) return;
        this.chatApi.getConversations(userId).subscribe({
            next: (convs: ChatConversationDTO[]) => {
                const selfId = String(userId);
                const mapped: Conversation[] = (convs || []).map((c: ChatConversationDTO) => {
                    // Backend DTOs return participants as number[], map to string[] for FE
                    const participantIds = (c.participants || []).map(p => String(p));
                    
                    const last = (c.messages && c.messages.length > 0)
                        ? c.messages[c.messages.length - 1]
                        : undefined;
                    
                    const other = c.otherUser;
                    const otherId = participantIds.find(pid => pid !== selfId);
                    const friend = this.friendsSubject.value.find(
                        f => String(f.id) === String(otherId) || f.email === otherId
                    );
                    
                    return {
                        id: String(c.id),
                        participants: participantIds,
                        messages: c.messages, // Include messages from backend
                        unreadCount: c.unreadCount ?? 0,
                        otherUser: c.otherUser, // Include otherUser info
                        lastMessage: last?.content,
                        lastMessageTime: last?.createdAt ? new Date(last.createdAt) : undefined,
                        name: friend?.name || 
                              (other ? `${other.firstname ?? ""} ${other.lastname ?? ""}`.trim() || other.email : undefined),
                        createdAt: c.createdAt,
                        updatedAt: c.updatedAt,
                    } as Conversation;
                });
                this.conversationsSubject.next(mapped);
            },
            error: () => {
                // Keep existing state
            },
        });
    }

    private loadUsers() {
        this.applyAuthHeadersToApiServices();
        this.userService.getAll().subscribe({
            next: (users: any[]) => {
                const mapped: User[] = (users || []).map((u) => {
                    const fullName = `${u.firstname ?? ""} ${u.lastname ?? ""}`.trim() || u.fullName || u.email;
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
                this.usersSubject.next(mapped);
            },
            error: () => {
                this.usersSubject.next([]);
            },
        });
    }

    private loadFriends() {
        this.applyAuthHeadersToApiServices();
        this.friendsApi.getAcceptedFriends().subscribe({
            next: (friends: any[]) => {
                const currentEmail = this.authService.getUserEmail();
                const mapped: User[] = (friends || [])
                    .map((f: any) => {
                        const other = f.user?.email === currentEmail ? f.friend : f.user;
                        const fullName = `${other?.firstname ?? ""} ${other?.lastname ?? ""}`.trim() || other?.email;
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
                this.friendsSubject.next(mapped);
            },
            error: (err) => {
                console.error("Error loading friends:", err);
                this.friendsSubject.next([]);
            },
        });
    }

    // New chat-specific API using proper DTOs
    getOrCreateConversation(otherUserId: number): Observable<ChatConversationDTO> {
        const currentUserId = this.getCurrentUserId();
        const dto: CreateConversationDTO = { 
            userId: currentUserId, 
            otherUserId 
        };
        return this.chatApi.getOrCreateConversation(dto);
    }

    loadConversationMessages(conversationId: number): Observable<ChatMessageDTO[]> {
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
        const currentUserId = Number(
            JSON.parse(
                atob(
                    (localStorage.getItem("id_token") || "").split(".")[1] ||
                        "e30=",
                ),
            )?.id || 0,
        );
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
        // Get recent messages from conversations (backend data)
        return this.conversations$.pipe(
            map((conversations) => {
                const allMessages: Message[] = [];
                
                // Extract all messages from all conversations
                conversations.forEach(conv => {
                    if (conv.messages && conv.messages.length > 0) {
                        conv.messages.forEach(msg => {
                            allMessages.push({
                                id: String(msg.id),
                                conversationId: msg.conversationId,
                                senderId: String(msg.senderId),
                                content: msg.content,
                                type: msg.type,
                                isRead: msg.isRead,
                                createdAt: msg.createdAt,
                                updatedAt: msg.updatedAt,
                                timestamp: new Date(msg.createdAt || Date.now()),
                            });
                        });
                    }
                });
                
                // Sort by timestamp and return top N
                const sorted = allMessages.sort(
                    (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
                );
                return sorted.slice(0, limit);
            }),
        );
    }

    getConversation(userId: string): Observable<Conversation | null> {
        const conversation = this.conversationsSubject.value.find((conv) =>
            (conv.participants || []).includes(userId),
        );
        return of(conversation || null);
    }

    getMessages(userId: string): Observable<Message[]> {
        const messages = this.messagesSubject.value
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

        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, newMessage]);

        // Update conversation
        const conversation = this.conversationsSubject.value.find((conv) =>
            (conv.participants || []).includes(message.receiverId || ""),
        );

        if (conversation) {
            const updatedConversations = this.conversationsSubject.value.map(
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
            this.conversationsSubject.next(updatedConversations);
        }

        return of(newMessage);
    }

    markAsRead(messageId: string): void {
        const messages = this.messagesSubject.value.map((msg) =>
            msg.id === messageId ? { ...msg, isRead: true } : msg,
        );
        this.messagesSubject.next(messages);
    }

    searchUsers(query: string): Observable<User[]> {
        const users = this.usersSubject.value.filter(
            (user) =>
                user?.name?.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase()),
        );
        return of(users);
    }

    addFriend(userId: string): void {
        const user = this.usersSubject.value.find((u) => u.id === userId);
        if (user && !this.friendsSubject.value.find((f) => f.id === userId)) {
            const currentFriends = this.friendsSubject.value;
            this.friendsSubject.next([...currentFriends, user]);
        }
    }

    removeFriend(userId: string): void {
        const currentFriends = this.friendsSubject.value.filter(
            (f) => f.id !== userId,
        );
        this.friendsSubject.next(currentFriends);
    }
}
