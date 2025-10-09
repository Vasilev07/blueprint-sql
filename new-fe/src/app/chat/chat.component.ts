import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { User, Message, ChatService } from "./chat.service";

@Component({
    selector: "app-chat",
    templateUrl: "./chat.component.html",
    styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    currentUser: User | null = null;
    messages: Message[] = [];
    messageForm: FormGroup;
    isLoading = false;
    currentUserId: string = "";
    conversationId?: string;
    allUsers: User[] = [];
    friends: User[] = [];
    showFriendsPicker = false;

    // Header computed properties
    get otherUserName(): string {
        return this.currentUser?.name || "Unknown User";
    }

    get isOtherUserOnline(): boolean {
        return Boolean(this.currentUser?.isOnline);
    }

    get otherUserStatus(): string {
        if (this.isOtherUserOnline) {
            return "Online";
        }
        const lastSeen = this.currentUser?.lastSeen;
        return lastSeen
            ? `Last seen ${new Date(lastSeen).toLocaleString()}`
            : "Offline";
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        public chatService: ChatService,
        private fb: FormBuilder,
    ) {
        this.messageForm = this.fb.group({
            content: ["", [Validators.required, Validators.maxLength(1000)]],
        });
    }

    ngOnInit(): void {
        // Cache users for display names/avatars
        this.chatService.users$
            .pipe(takeUntil(this.destroy$))
            .subscribe((users) => {
                this.allUsers = users || [];
            });
        this.chatService.friends$
            .pipe(takeUntil(this.destroy$))
            .subscribe((friends) => {
                this.friends = friends || [];
            });
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            const userId = params["userId"];
            if (userId) {
                this.currentUserId = userId;
                this.loadConversation(userId);
                this.loadUserData(userId);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadConversation(userId: string): void {
        this.isLoading = true;
        const otherUserId = Number(userId);
        if (!Number.isFinite(otherUserId) || otherUserId <= 0) {
            this.isLoading = false;
            return;
        }
        this.chatService
            .getOrCreateConversation(otherUserId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (conv) => {
                    this.conversationId = String(conv.id);
                    this.chatService
                        .loadConversationMessages(conv.id)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (messages: any[]) => {
                                this.messages = (messages || []).map(
                                    (m: any) => ({
                                        ...m,
                                        timestamp: m.timestamp
                                            ? new Date(m.timestamp)
                                            : new Date(
                                                  m.createdAt || Date.now(),
                                              ),
                                    }),
                                );
                                this.isLoading = false;
                                this.scrollToBottom();
                            },
                            error: () => {
                                this.isLoading = false;
                            },
                        });
                    this.chatService
                        .subscribeToConversation(conv.id)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe((msg: any) => {
                            console.log(
                                "Received chat message via WebSocket:",
                                msg,
                            );
                            const mapped = {
                                ...msg,
                                senderId: String(msg.senderId),
                                timestamp: msg.timestamp
                                    ? new Date(msg.timestamp)
                                    : new Date(msg.createdAt || Date.now()),
                            };
                            this.messages.push(mapped);
                            console.log(
                                "Messages array after push:",
                                this.messages,
                            );
                            this.scrollToBottom();
                        });
                },
                error: () => {
                    this.isLoading = false;
                },
            });
    }

    openConversation(conv: { id: any; participants?: any[] }) {
        const loggedId = String(this.getLoggedInUserId());
        const participants = (conv.participants || []).map((p: any) =>
            String(p),
        );
        const otherUserId =
            participants.find((p) => p !== loggedId) ||
            participants[0] ||
            this.currentUserId;
        // Normalize to numeric user id if an email sneaks in from legacy data
        const targetUserId = /^(\d+)$/.test(String(otherUserId))
            ? String(otherUserId)
            : this.allUsers
                  .find((u) => u.email === otherUserId)
                  ?.id?.toString() || this.currentUserId;
        if (
            !targetUserId ||
            targetUserId === "undefined" ||
            targetUserId === "null"
        ) {
            return;
        }
        // Preload immediately so the chat opens even if routing is delayed
        this.currentUserId = targetUserId;
        this.loadConversation(targetUserId);
        this.loadUserData(targetUserId);
        this.router.navigate(["/chat/conversation", targetUserId]);
    }

    getLoggedInUserId(): number {
        return Number(
            JSON.parse(
                atob(
                    (localStorage.getItem("id_token") || "").split(".")[1] ||
                        "e30=",
                ),
            )?.id || 0,
        );
    }

    getConversationName(conv: any): string {
        const loggedId = String(this.getLoggedInUserId());
        const otherId =
            (conv?.participants || [])
                .map((p: any) => String(p))
                .find((p: string) => p !== loggedId) || "";
        const user = this.allUsers.find(
            (u) => String(u.id) === otherId || u.email === otherId,
        );
        return user?.name || otherId || "Unknown User";
    }

    getConversationInitial(conv: any): string {
        const name = this.getConversationName(conv);
        return (name?.charAt(0) || "?").toUpperCase();
    }

    // Helper for routerLink in the sidebar
    getOtherUserId(conv: { participants?: any[] }): string {
        const loggedId = String(this.getLoggedInUserId());
        const parts = (conv?.participants || []).map((p: any) => String(p));
        const rawOther =
            parts.find((p: string) => p !== loggedId) ||
            parts[0] ||
            this.currentUserId;
        // If it's not numeric, try resolving from email to user id
        if (/^\d+$/.test(String(rawOther))) {
            return String(rawOther);
        }
        const user = this.allUsers.find((u) => u.email === rawOther);
        return user?.id?.toString() || this.currentUserId;
    }

    toggleFriends(): void {
        this.showFriendsPicker = !this.showFriendsPicker;
    }

    startNewChat(friend: User): void {
        if (!friend?.id) return;
        this.showFriendsPicker = false;
        this.router.navigate(["/chat/conversation", String(friend.id)]);
    }

    private loadUserData(userId: string): void {
        // Get user data from the service
        this.chatService.users$
            .pipe(takeUntil(this.destroy$))
            .subscribe((users) => {
                this.currentUser =
                    users.find((user) => user.id === userId) || null;
            });
    }

    sendMessage(): void {
        if (this.messageForm.valid && this.currentUserId) {
            const content = this.messageForm.get("content")?.value;
            const convId = this.conversationId
                ? Number(this.conversationId)
                : undefined;
            this.chatService.sendChatMessage(
                convId,
                Number(this.currentUserId),
                content,
            );
            this.messageForm.reset();
        }
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            const chatContainer = document.querySelector(".chat-messages");
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
    }

    goBack(): void {
        this.router.navigate(["/chat"]);
    }

    formatTime(date: Date | string | undefined): string {
        if (!date) return "";
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    isOwnMessage(message: any): boolean {
        const currentUserId = Number(
            JSON.parse(
                atob(
                    (localStorage.getItem("id_token") || "").split(".")[1] ||
                        "e30=",
                ),
            )?.id || 0,
        );
        return Number(message.senderId) === currentUserId;
    }
}
