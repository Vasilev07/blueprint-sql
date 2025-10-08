import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { MessagesService, UserService } from 'src/typescript-api-client/src/api/api';
import { FriendsService } from 'src/typescript-api-client/src/api/friends.service';
import { WebsocketService } from '../services/websocket.service';
import { MessageService } from 'primeng/api';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    type: 'text' | 'image' | 'file';
}

export interface Conversation {
    id: string;
    participants: string[];
    lastMessage?: string;
    lastMessageTime?: Date;
    unreadCount: number;
    name?: string;
    avatar?: string;
    isOnline?: boolean;
}

@Injectable({
    providedIn: 'root'
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
        private ws: WebsocketService,
        private chatService: ChatService,
        private messagesService: MessagesService
    ) {
        this.applyAuthHeadersToApiServices();
        this.loadInitialData();
        // Live updates for any chat messages
        this.ws.onAnyChatMessage().subscribe(({ conversationId, message }) => {
            const currentUserId = this.getCurrentUserId();
            const otherUserId = Number(message.senderId) === currentUserId ? Number(message.recipientId) : Number(message.senderId);

            // Append message to stream
            const nextMsg: Message = {
                id: String(message.id ?? `${message.senderId}-${message.createdAt}`),
                senderId: String(message.senderId),
                receiverId: String(otherUserId || ''),
                content: message.content,
                timestamp: new Date(message.createdAt ?? Date.now()),
                isRead: Number(message.senderId) === currentUserId,
                type: 'text'
            };
            this.messagesSubject.next([...this.messagesSubject.value, nextMsg]);

            // Normalize conversations using numeric user ids and conversation id
            const convId = String(conversationId);
            const existing = this.conversationsSubject.value.find(c => c.id === convId);
            const updated: Conversation = existing ? {
                ...existing,
                lastMessage: message.content,
                lastMessageTime: new Date(message.createdAt ?? Date.now()),
                unreadCount: (existing.unreadCount ?? 0) + (Number(message.senderId) === currentUserId ? 0 : 1)
            } : {
                id: convId,
                participants: [String(currentUserId), String(otherUserId)],
                unreadCount: Number(message.senderId) === currentUserId ? 0 : 1,
                lastMessage: message.content,
                lastMessageTime: new Date(message.createdAt ?? Date.now())
            } as Conversation;

            const convs = this.conversationsSubject.value.filter(c => c.id !== updated.id);
            this.conversationsSubject.next([updated, ...convs]);
        });
    }

    private loadInitialData() {
        this.loadUsers();
        this.loadFriends();
        this.loadBackendConversations();
    }

    private applyAuthHeadersToApiServices() {
        const token = localStorage.getItem('id_token');
        if (token) {
            const authHeader = `Bearer ${token}`;
            // Set default headers for generated clients before calling them
            this.userService.defaultHeaders = this.userService.defaultHeaders.set('Authorization', authHeader);
            this.friendsApi.defaultHeaders = this.friendsApi.defaultHeaders.set('Authorization', authHeader);
        }
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('id_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
    }

    private getCurrentUserId(): number {
        return Number(JSON.parse(atob((localStorage.getItem('id_token') || '').split('.')[1] || 'e30='))?.id || 0);
    }

    private loadBackendConversations() {
        const userId = this.getCurrentUserId();
        if (!userId) return;
        this.chatService.getConversation(String(userId))
            .subscribe((convs: any) => {
                const selfId = String(userId);
                const mapped: Conversation[] = (convs || []).map((c: any) => {
                    // Backend returns participants as userId[] numbers; normalize to string ids for FE
                    const participantIds = (c.participants || []).map((p: any) => String(p));
                    const last = Array.isArray(c.messages) && c.messages.length > 0
                        ? c.messages[c.messages.length - 1]
                        : undefined;
                    const other = c.otherUser;
                    const otherId = participantIds.find((pid: string) => pid !== selfId);
                    const friend = this.friendsSubject.value.find(f => String(f.id) === String(otherId) || f.email === otherId);
                    return {
                        id: String(c.id),
                        participants: participantIds,
                        unreadCount: Number((c as any).unreadCount ?? 0),
                        lastMessage: last?.content,
                        lastMessageTime: last?.createdAt ? new Date(last.createdAt) : undefined,
                        name: friend?.name || (other ? `${other.firstname ?? ''} ${other.lastname ?? ''}`.trim() || other.email : undefined)
                    } as Conversation;
                });
                this.conversationsSubject.next(mapped);
            });
    }

    private loadUsers() {
        this.applyAuthHeadersToApiServices();
        this.userService.getAll().subscribe({
            next: (users: any[]) => {
                const mapped: User[] = (users || []).map(u => ({
                    id: String(u.id ?? u.email),
                    name: `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.fullName || u.email,
                    email: u.email,
                    avatar: undefined,
                    isOnline: false
                }));
                this.usersSubject.next(mapped);
            },
            error: () => {
                this.usersSubject.next([]);
            }
        });
    }

    private loadFriends() {
        this.applyAuthHeadersToApiServices();
        this.friendsApi.getAcceptedFriends().subscribe({
            next: (friends: any[]) => {
                const currentEmail = this.authService.getUserEmail();
                const mapped: User[] = (friends || []).map((f: any) => {
                    const other = (f.user?.email === currentEmail) ? f.friend : f.user;
                    return {
                        id: String(other?.id ?? other?.email),
                        name: `${other?.firstname ?? ''} ${other?.lastname ?? ''}`.trim() || other?.email,
                        email: other?.email,
                        avatar: undefined,
                        isOnline: false
                    } as User;
                }).filter((u: User) => !!u.email);
                this.friendsSubject.next(mapped);
            },
            error: (err) => {
                console.error('Error loading friends:', err);
                this.friendsSubject.next([]);
            }
        });
    }

    // New chat-specific API
    getOrCreateConversation(otherUserId: number): Observable<{ id: number }> {
        const currentUserId = Number(JSON.parse(atob((localStorage.getItem('id_token') || '').split('.')[1] || 'e30='))?.id || 0);
        return this.chatService.getOrCreateConversation(currentUserId);
    }

    loadConversationMessages(conversationId: number): Observable<Message[]> {
        return this.chatService.getMessages(String(conversationId)) as any;
    }

    subscribeToConversation(conversationId: number): Observable<any> {
        return this.ws.onChatMessage(conversationId);
    }

    sendChatMessage(conversationId: number | undefined, recipientId: number, content: string): void {
        const currentUserId = Number(JSON.parse(atob((localStorage.getItem('id_token') || '').split('.')[1] || 'e30='))?.id || 0);
        this.ws.sendChat({ conversationId, senderId: currentUserId, recipientId, content });
    }

    getLastRegisteredUsers(limit: number = 10): Observable<User[]> {
        return this.users$.pipe(
            map((users) => users.slice(-limit))
        );
    }

    getTopFriends(limit: number = 10): Observable<User[]> {
        return this.friends$.pipe(
            map((friends) => friends.slice(0, limit))
        );
    }

    getRecentMessages(limit: number = 5): Observable<Message[]> {
        return this.messages$.pipe(
            map((messages) => {
                const sorted = [...messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                return sorted.slice(0, limit);
            })
        );
    }

    getConversation(userId: string): Observable<Conversation | null> {
        const conversation = this.conversationsSubject.value
            .find(conv => conv.participants.includes(userId));
        return of(conversation || null);
    }

    getMessages(userId: string): Observable<Message[]> {
        const messages = this.messagesSubject.value
            .filter(msg => (msg.senderId === userId && msg.receiverId === '1') ||
                (msg.senderId === '1' && msg.receiverId === userId))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        return of(messages);
    }

    sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Observable<Message> {
        const newMessage: Message = {
            ...message,
            id: Date.now().toString(),
            timestamp: new Date()
        };

        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, newMessage]);

        // Update conversation
        const conversation = this.conversationsSubject.value
            .find(conv => conv.participants.includes(message.receiverId));

        if (conversation) {
            const updatedConversations = this.conversationsSubject.value.map(conv =>
                conv.id === conversation.id
                    ? {
                        ...conv,
                        lastMessage: newMessage.content,
                        lastMessageTime: newMessage.timestamp,
                        unreadCount: message.senderId === '1' ? conv.unreadCount : conv.unreadCount + 1
                    }
                    : conv
            );
            this.conversationsSubject.next(updatedConversations);
        }

        return of(newMessage);
    }

    markAsRead(messageId: string): void {
        const messages = this.messagesSubject.value.map(msg =>
            msg.id === messageId ? { ...msg, isRead: true } : msg
        );
        this.messagesSubject.next(messages);
    }

    searchUsers(query: string): Observable<User[]> {
        const users = this.usersSubject.value.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
        );
        return of(users);
    }

    addFriend(userId: string): void {
        const user = this.usersSubject.value.find(u => u.id === userId);
        if (user && !this.friendsSubject.value.find(f => f.id === userId)) {
            const currentFriends = this.friendsSubject.value;
            this.friendsSubject.next([...currentFriends, user]);
        }
    }

    removeFriend(userId: string): void {
        const currentFriends = this.friendsSubject.value.filter(f => f.id !== userId);
        this.friendsSubject.next(currentFriends);
    }
}
