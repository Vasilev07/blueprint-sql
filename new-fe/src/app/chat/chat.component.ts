import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { ChatService, User, Message } from "./chat.service";
import { UserService } from "src/typescript-api-client/src/api/api";
import { MessageService } from "primeng/api";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
    selector: "app-chat",
    templateUrl: "./chat.component.html",
    styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit, OnDestroy, OnChanges {
    private destroy$ = new Subject<void>();

    @Input() userId?: string | null; // Allow userId to be passed as input

    currentUser: User | null = null;
    messages: Message[] = [];
    messageForm: FormGroup;
    isLoading = false;
    currentUserId: string = "";
    conversationId?: string;
    allUsers: User[] = [];
    friends: User[] = [];
    showFriendsPicker = false;
    // SVG data URL for default avatar
    defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
    headerProfilePictureUrl: string = this.defaultAvatar;
    senderProfilePictures: Map<string, string> = new Map();
    
    // Gift properties
    showSendGiftDialog = false;
    recipientUserForGift: { id: number; name?: string; fullName?: string } | null = null;

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
        private userService: UserService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
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
        
        // Use Input userId if provided (when embedded), otherwise get from route params
        const userIdToUse = this.userId || this.route.snapshot.params["userId"];
        if (userIdToUse && userIdToUse !== "" && userIdToUse !== this.currentUserId) {
            this.currentUserId = userIdToUse;
            this.loadConversation(userIdToUse);
            this.loadUserData(userIdToUse);
        } else if (!this.userId) {
            // Get from route params when accessed directly via route
            this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
                const userId = params["userId"];
                if (userId && userId !== this.currentUserId) {
                    this.currentUserId = userId;
                    this.loadConversation(userId);
                    this.loadUserData(userId);
                }
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // If userId input changes, reload the conversation (for backward compatibility)
        if (changes['userId']) {
            const newUserId = this.userId || '';
            if (newUserId && newUserId !== '' && newUserId !== this.currentUserId) {
                this.currentUserId = newUserId;
                this.messages = []; // Clear previous messages
                this.loadConversation(newUserId);
                this.loadUserData(newUserId);
            } else if (!newUserId || newUserId === '') {
                // Clear if userId becomes empty
                this.currentUserId = '';
                this.messages = [];
                this.currentUser = null;
            }
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        // Revoke blob URLs to free memory
        if (this.headerProfilePictureUrl !== this.defaultAvatar && this.headerProfilePictureUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this.headerProfilePictureUrl);
        }
        this.senderProfilePictures.forEach((url) => {
            if (url && url !== this.defaultAvatar && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        this.senderProfilePictures.clear();
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
                            next: (messages) => {
                                // Map ChatMessageDTO[] to Message[] for UI
                                this.messages = (messages || []).map((m) => ({
                                    id: String(m.id),
                                    conversationId: m.conversationId,
                                    senderId: String(m.senderId),
                                    content: m.content,
                                    type: m.type,
                                    isRead: m.isRead,
                                    createdAt: m.createdAt,
                                    updatedAt: m.updatedAt,
                                    timestamp: new Date(
                                        m.createdAt || Date.now(),
                                    ),
                                }));
                                this.isLoading = false;
                                this.loadSenderProfilePictures();
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
                                id: String(msg.id),
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
                            this.loadProfilePictureForSender(mapped.senderId);
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

        // Load profile picture
        this.loadProfilePicture(userId);
    }

    private loadProfilePicture(userId: string): void {
        const numericUserId = parseInt(userId, 10);

        if (!numericUserId) {
            // Set default avatar if userId is invalid
            this.headerProfilePictureUrl = this.defaultAvatar;
            return;
        }
        
        // Set default avatar initially while loading
        this.headerProfilePictureUrl = this.defaultAvatar;

        // Revoke old blob URL if exists
        if (this.headerProfilePictureUrl !== this.defaultAvatar && this.headerProfilePictureUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this.headerProfilePictureUrl);
        }

        this.userService
            .getProfilePictureByUserId(numericUserId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob: Blob) => {
                    const objectURL = URL.createObjectURL(blob);
                    this.headerProfilePictureUrl = objectURL;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    // Profile picture not found is okay - use default avatar
                    console.error(
                        `Error loading profile picture for user ${userId}:`,
                        error,
                        'status:', error.status
                    );
                    // Keep default avatar on error
                    this.headerProfilePictureUrl = this.defaultAvatar;
                    this.cdr.detectChanges();
                },
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
        // Navigate back to chat home (parent route)
        this.router.navigate(["/chat"], { replaceUrl: true });
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

    private loadSenderProfilePictures(): void {
        const uniqueSenderIds = new Set<string>();
        this.messages.forEach((message) => {
            if (!this.isOwnMessage(message)) {
                uniqueSenderIds.add(String(message.senderId));
            }
        });

        uniqueSenderIds.forEach((senderId) => {
            if (!this.senderProfilePictures.has(senderId)) {
                this.loadProfilePictureForSender(senderId);
            }
        });
    }

    private loadProfilePictureForSender(senderId: string): void {
        // Skip if already loaded
        if (this.senderProfilePictures.has(senderId)) {
            return;
        }

        const numericUserId = parseInt(senderId, 10);
        if (!numericUserId) {
            return;
        }

        this.userService
            .getProfilePictureByUserId(numericUserId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob: Blob) => {
                    const objectURL = URL.createObjectURL(blob);
                    this.senderProfilePictures.set(senderId, objectURL);
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    // Profile picture not found is okay
                    if (error.status !== 404) {
                        console.error(
                            `Error loading profile picture for sender ${senderId}:`,
                            error,
                        );
                    }
                    // Set default avatar on error
                    this.senderProfilePictures.set(senderId, this.defaultAvatar);
                    this.cdr.detectChanges();
                },
            });
    }

    getSenderProfilePicture(senderId: string): string {
        return this.senderProfilePictures.get(senderId) || this.defaultAvatar;
    }

    getSenderInitials(senderId: string): string {
        const user = this.allUsers.find((u) => String(u.id) === senderId);
        if (user?.name) {
            return (user.name.charAt(0) || "?").toUpperCase();
        }
        return "?";
    }

    getSenderName(senderId: string): string {
        const user = this.allUsers.find((u) => String(u.id) === senderId);
        return user?.name || "Unknown User";
    }

    getDefaultAvatar(): string {
        return this.defaultAvatar;
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        if (img) {
            img.src = this.defaultAvatar;
        }
    }

    openUserProfile(): void {
        if (this.currentUserId) {
            this.router.navigate(['/profile', this.currentUserId]);
        }
    }

    // Send Gift methods
    openSendGiftDialog(): void {
        if (!this.currentUserId) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to send gift. User information not available.",
            });
            return;
        }
        
        this.recipientUserForGift = {
            id: Number(this.currentUserId),
            name: this.currentUser?.name,
            fullName: this.currentUser?.name,
        };
        this.showSendGiftDialog = true;
    }

    onGiftSent(response: any): void {
        // Gift was sent successfully, dialog is already closed
        this.recipientUserForGift = null;
    }

    // Gift Message Detection and Parsing
    isGiftMessage(message: Message): boolean {
        return message.content?.includes('🎁 Gift Sent:') || false;
    }

    parseGiftMessage(message: Message): { emoji: string; amount: string; giftMessage: string } | null {
        if (!this.isGiftMessage(message)) {
            return null;
        }

        const content = message.content || '';
        // Format: "🎁 Gift Sent: {emoji} ({amount} tokens) - "{message}""
        const giftMatch = content.match(/🎁 Gift Sent:\s*([^\s]+)\s*\(([^)]+)\s*tokens\)(?:\s*-\s*"([^"]*)")?/);
        
        if (giftMatch) {
            return {
                emoji: giftMatch[1] || '🎁',
                amount: giftMatch[2] || '0',
                giftMessage: giftMatch[3] || '',
            };
        }

        // Fallback parsing
        const emojiMatch = content.match(/🎁 Gift Sent:\s*([^\s]+)/);
        const amountMatch = content.match(/\(([^)]+)\s*tokens\)/);
        const messageMatch = content.match(/-\s*"([^"]*)"/);

        return {
            emoji: emojiMatch?.[1] || '🎁',
            amount: amountMatch?.[1] || '0',
            giftMessage: messageMatch?.[1] || '',
        };
    }

    // Video Call Methods
    startVideoCall(): void {
        if (!this.currentUserId) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to start call. User information not available.",
            });
            return;
        }

        const recipientId = Number(this.currentUserId);
        const recipientName = this.currentUser?.name || 'Unknown User';

        // Navigate to video call page with recipient info
        this.router.navigate(['/video-call'], {
            queryParams: {
                recipientId: recipientId,
                recipientName: recipientName
            }
        });
    }
}
