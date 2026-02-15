import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    OnChanges,
    SimpleChanges,
    signal,
    computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { ChatService, User, Message } from "./chat.service";
import { UserService } from "src/typescript-api-client/src/api/api";
import { MessageService } from "primeng/api";
import { DomSanitizer } from "@angular/platform-browser";
import { SendGiftDialogComponent } from "../shared/send-gift-dialog/send-gift-dialog.component";
import { ToastModule } from "primeng/toast";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { ParseGiftMessagePipe } from "./parse-gift-message.pipe";

@Component({
    selector: "app-chat",
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SendGiftDialogComponent,
        ToastModule,
        ButtonModule,
        InputTextModule,
        TooltipModule,
        ParseGiftMessagePipe,
    ],
    templateUrl: "./chat.component.html",
    styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit, OnDestroy, OnChanges {
    private destroy$ = new Subject<void>();
    private conversationSubscription$ = new Subject<void>(); // For canceling conversation-specific subscriptions

    @Input() userId?: string | null; // Allow userId to be passed as input

    // Signals for reactive state
    messages = signal<Message[]>([]);
    messageForm: FormGroup;
    isLoading = signal(false);
    currentUserId = signal<string>("");
    conversationId = signal<string | undefined>(undefined);
    allUsers = signal<User[]>([]);
    friends = signal<User[]>([]);
    showFriendsPicker = signal(false);
    isMobile = signal(false);
    loggedInUserId = signal<number>(0);
    private _cachedLoggedInUserId: number | null = null;

    // Gift properties
    showSendGiftDialog = signal(false);
    recipientUserForGift = signal<{
        id: number;
        name?: string;
        fullName?: string;
    } | null>(null);

    // SVG data URL for default avatar
    defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
    headerProfilePictureUrl = signal<string>(this.defaultAvatar);
    senderProfilePictures = signal<Map<string, string>>(new Map());

    // Computed signal for current user - automatically updates when allUsers or currentUserId changes
    currentUser = computed(() => {
        const userId = this.currentUserId();
        const users = this.allUsers();
        return users.find((user) => user.id === userId) || null;
    });

    // Header computed properties using signals
    otherUserName = computed(() => this.currentUser()?.name || "Unknown User");
    isOtherUserOnline = computed(() => Boolean(this.currentUser()?.isOnline));
    otherUserStatus = computed(() => {
        if (this.isOtherUserOnline()) {
            return "Online";
        }
        const lastSeen = this.currentUser()?.lastSeen;
        return lastSeen
            ? `Last seen ${new Date(lastSeen).toLocaleString()}`
            : "Offline";
    });

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        public chatService: ChatService,
        private fb: FormBuilder,
        private userService: UserService,
        private messageService: MessageService,
        private sanitizer: DomSanitizer,
    ) {
        this.messageForm = this.fb.group({
            content: ["", [Validators.required, Validators.maxLength(1000)]],
        });
    }

    ngOnInit(): void {
        console.log("[ChatComponent] ngOnInit called - userId:", this.userId);
        this.loggedInUserId.set(this.getLoggedInUserId());
        this.isMobile.set(window.innerWidth <= 768);
        this.setupMobileOptimizations();

        // Cache users for display names/avatars
        this.chatService.users$
            .pipe(takeUntil(this.destroy$))
            .subscribe((users) => {
                this.allUsers.set(users || []);
            });
        this.chatService.friends$
            .pipe(takeUntil(this.destroy$))
            .subscribe((friends) => {
                this.friends.set(friends || []);
            });

        // Use Input userId if provided (when embedded), otherwise get from route params
        const userIdToUse = this.userId || this.route.snapshot.params["userId"];
        if (
            userIdToUse &&
            userIdToUse !== "" &&
            userIdToUse !== this.currentUserId()
        ) {
            this.currentUserId.set(userIdToUse);
            this.loadConversation(userIdToUse);
        } else if (!this.userId) {
            // Get from route params when accessed directly via route
            this.route.params
                .pipe(takeUntil(this.destroy$))
                .subscribe((params) => {
                    const userId = params["userId"];
                    if (userId && userId !== this.currentUserId()) {
                        this.currentUserId.set(userId);
                        this.loadConversation(userId);
                    }
                });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Skip initial value - handled in ngOnInit; only react to subsequent changes
        if (changes["userId"]?.firstChange) return;
        // If userId input changes, reload the conversation (for backward compatibility)
        if (changes["userId"]) {
            const newUserId = this.userId || "";
            if (
                newUserId &&
                newUserId !== "" &&
                newUserId !== this.currentUserId()
            ) {
                this.currentUserId.set(newUserId);
                // loadConversation will clear messages, so no need to clear here
                this.loadConversation(newUserId);
            } else if (!newUserId || newUserId === "") {
                // Clear if userId becomes empty
                this.conversationSubscription$.next();
                this.currentUserId.set("");
                this.messages.set([]);
            }
        }
    }

    ngOnDestroy(): void {
        console.log("[ChatComponent] ngOnDestroy called - cleaning up");

        if (this.setVHRef) {
            window.removeEventListener("resize", this.setVHRef);
        }
        if (this.orientationHandler) {
            window.removeEventListener(
                "orientationchange",
                this.orientationHandler,
            );
        }
        if (this.touchEndHandler) {
            document.removeEventListener("touchend", this.touchEndHandler);
        }

        // Cancel conversation-specific subscriptions first
        this.conversationSubscription$.next();
        this.conversationSubscription$.complete();

        // Then cancel global subscriptions
        this.destroy$.next();
        this.destroy$.complete();

        // Revoke blob URLs to free memory
        const headerUrl = this.headerProfilePictureUrl();
        if (headerUrl !== this.defaultAvatar && headerUrl.startsWith("blob:")) {
            URL.revokeObjectURL(headerUrl);
        }
        this.senderProfilePictures().forEach((url) => {
            if (url && url !== this.defaultAvatar && url.startsWith("blob:")) {
                URL.revokeObjectURL(url);
            }
        });
        this.senderProfilePictures().clear();
    }

    private loadConversation(userId: string): void {
        console.log(
            "[ChatComponent] loadConversation called for userId:",
            userId,
        );
        console.log("[ChatComponent] Active subscriptions before cleanup");

        // Cancel any existing conversation subscriptions to prevent memory leaks
        this.conversationSubscription$.next();
        this.conversationSubscription$.complete();
        this.conversationSubscription$ = new Subject<void>();

        // Clear previous messages
        this.messages.set([]);
        this.isLoading.set(true);

        const otherUserId = Number(userId);
        if (!Number.isFinite(otherUserId) || otherUserId <= 0) {
            this.isLoading.set(false);
            return;
        }

        this.chatService
            .getOrCreateConversation(otherUserId)
            .pipe(takeUntil(this.conversationSubscription$))
            .subscribe({
                next: (conv) => {
                    this.conversationId.set(String(conv.id));

                    // Load messages
                    this.chatService
                        .loadConversationMessages(conv.id)
                        .pipe(takeUntil(this.conversationSubscription$))
                        .subscribe({
                            next: (messages) => {
                                // Map ChatMessageDTO[] to Message[] for UI
                                this.messages.set(
                                    (messages || []).map((m) => ({
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
                                    })),
                                );
                                this.isLoading.set(false);
                                this.loadSenderProfilePictures();
                                this.scrollToBottom();
                            },
                            error: () => {
                                this.isLoading.set(false);
                            },
                        });

                    // Subscribe to WebSocket updates
                    this.chatService
                        .subscribeToConversation(conv.id)
                        .pipe(takeUntil(this.conversationSubscription$))
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
                            this.messages.update((current) => [
                                ...current,
                                mapped,
                            ]);
                            this.loadProfilePictureForSender(mapped.senderId);
                            this.scrollToBottom();
                        });
                },
                error: () => {
                    this.isLoading.set(false);
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
            this.currentUserId();
        // Normalize to numeric user id if an email sneaks in from legacy data
        const targetUserId = /^(\d+)$/.test(String(otherUserId))
            ? String(otherUserId)
            : this.allUsers()
                  .find((u) => u.email === otherUserId)
                  ?.id?.toString() || this.currentUserId();
        if (
            !targetUserId ||
            targetUserId === "undefined" ||
            targetUserId === "null"
        ) {
            return;
        }
        // Preload immediately so the chat opens even if routing is delayed
        this.currentUserId.set(targetUserId);
        this.loadConversation(targetUserId);
        this.router.navigate(["/chat/conversation", targetUserId]);
    }

    getLoggedInUserId(): number {
        // Use cached value to avoid repeated JWT parsing
        if (this._cachedLoggedInUserId !== null) {
            return this._cachedLoggedInUserId;
        }

        try {
            const token = localStorage.getItem("id_token") || "";
            const payload = token.split(".")[1] || "e30=";
            const decoded = JSON.parse(atob(payload));
            this._cachedLoggedInUserId = Number(decoded?.id || 0);
            return this._cachedLoggedInUserId;
        } catch (error) {
            console.error("Error parsing JWT token:", error);
            this._cachedLoggedInUserId = 0;
            return 0;
        }
    }

    getConversationName(conv: any): string {
        const loggedId = String(this.getLoggedInUserId());
        const otherId =
            (conv?.participants || [])
                .map((p: any) => String(p))
                .find((p: string) => p !== loggedId) || "";
        const user = this.allUsers().find(
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
            this.currentUserId();
        // If it's not numeric, try resolving from email to user id
        if (/^\d+$/.test(String(rawOther))) {
            return String(rawOther);
        }
        const user = this.allUsers().find((u) => u.email === rawOther);
        return user?.id?.toString() || this.currentUserId();
    }

    toggleFriends(): void {
        this.showFriendsPicker.update((val) => !val);
    }

    startNewChat(friend: User): void {
        if (!friend?.id) return;
        this.showFriendsPicker.set(false);
        this.router.navigate(["/chat/conversation", String(friend.id)]);
    }

    private loadProfilePicture(userId: string): void {
        const numericUserId = parseInt(userId, 10);

        if (!numericUserId) {
            // Set default avatar if userId is invalid
            this.headerProfilePictureUrl.set(this.defaultAvatar);
            return;
        }

        // Set default avatar initially while loading
        this.headerProfilePictureUrl.set(this.defaultAvatar);

        // Revoke old blob URL if exists
        const currentUrl = this.headerProfilePictureUrl();
        if (
            currentUrl !== this.defaultAvatar &&
            currentUrl.startsWith("blob:")
        ) {
            URL.revokeObjectURL(currentUrl);
        }

        this.userService
            .getProfilePictureByUserId(numericUserId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob: Blob) => {
                    const objectURL = URL.createObjectURL(blob);
                    this.headerProfilePictureUrl.set(objectURL);
                },
                error: (error) => {
                    if (error?.status !== 404) {
                        console.error(
                            `Error loading profile picture for user ${userId}:`,
                            error,
                        );
                    }
                    this.headerProfilePictureUrl.set(this.defaultAvatar);
                },
            });
    }

    sendMessage(): void {
        const userId = this.currentUserId();
        if (this.messageForm.valid && userId) {
            const content = this.messageForm.get("content")?.value;
            const convIdStr = this.conversationId();
            const convId = convIdStr ? Number(convIdStr) : undefined;
            this.chatService.sendChatMessage(convId, Number(userId), content);
            this.messageForm.reset();
        }
    }

    private scrollToBottom(): void {
        const isMobile = this.isMobile();
        setTimeout(
            () => {
                const chatContainer = document.querySelector(".chat-messages");
                if (chatContainer) {
                    // Smooth scroll on desktop, instant on mobile for better performance
                    if (isMobile) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    } else {
                        chatContainer.scrollTo({
                            top: chatContainer.scrollHeight,
                            behavior: "smooth",
                        });
                    }
                }
            },
            isMobile ? 50 : 100,
        );
    }

    private setVHRef: (() => void) | null = null;
    private orientationHandler: (() => void) | null = null;
    private touchEndHandler: ((e: TouchEvent) => void) | null = null;

    private setupMobileOptimizations(): void {
        if (!this.isMobile()) return;

        this.setVHRef = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty("--vh", `${vh}px`);
        };
        this.setVHRef();
        window.addEventListener("resize", this.setVHRef);

        this.orientationHandler = () => setTimeout(this.setVHRef!, 100);
        window.addEventListener("orientationchange", this.orientationHandler);

        let lastTouchEnd = 0;
        this.touchEndHandler = (event: TouchEvent) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) event.preventDefault();
            lastTouchEnd = now;
        };
        document.addEventListener("touchend", this.touchEndHandler, {
            passive: false,
        });
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
        return Number(message.senderId) === this.loggedInUserId();
    }

    trackByMessageId(_index: number, message: Message): string {
        return message.id;
    }

    private loadSenderProfilePictures(): void {
        const uniqueSenderIds = new Set<string>();
        this.messages().forEach((message) => {
            if (!this.isOwnMessage(message)) {
                uniqueSenderIds.add(String(message.senderId));
            }
        });

        uniqueSenderIds.forEach((senderId) => {
            if (!this.senderProfilePictures().has(senderId)) {
                this.loadProfilePictureForSender(senderId);
            }
        });
    }

    private loadProfilePictureForSender(senderId: string): void {
        // Skip if already loaded
        if (this.senderProfilePictures().has(senderId)) {
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
                    this.senderProfilePictures.update((map) => {
                        const newMap = new Map(map);
                        newMap.set(senderId, objectURL);
                        return newMap;
                    });
                },
                error: (error) => {
                    if (error?.status !== 404) {
                        console.error(
                            `Error loading profile picture for sender ${senderId}:`,
                            error,
                        );
                    }
                    this.senderProfilePictures.update((map) => {
                        const newMap = new Map(map);
                        newMap.set(senderId, this.defaultAvatar);
                        return newMap;
                    });
                },
            });
    }

    getSenderProfilePicture(senderId: string): string {
        return this.senderProfilePictures().get(senderId) || this.defaultAvatar;
    }

    getSenderInitials(senderId: string): string {
        const user = this.allUsers().find((u) => String(u.id) === senderId);
        if (user?.name) {
            return (user.name.charAt(0) || "?").toUpperCase();
        }
        return "?";
    }

    getSenderName(senderId: string): string {
        const user = this.allUsers().find((u) => String(u.id) === senderId);
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
        const userId = this.currentUserId();
        if (userId) {
            this.router.navigate(["/profile", userId]);
        }
    }

    // Send Gift methods
    openSendGiftDialog(): void {
        const userId = this.currentUserId();
        if (!userId) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to send gift. User information not available.",
            });
            return;
        }

        const user = this.currentUser();
        this.recipientUserForGift.set({
            id: Number(userId),
            name: user?.name,
            fullName: user?.name,
        });
        this.showSendGiftDialog.set(true);
    }

    onGiftSent(_response: any): void {
        // Gift was sent successfully, dialog is already closed
        this.recipientUserForGift.set(null);
    }

    isGiftMessage(message: Message): boolean {
        return message.content?.includes("🎁 Gift Sent:") || false;
    }

    // Video Call Methods
    startVideoCall(): void {
        const userId = this.currentUserId();
        if (!userId) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to start call. User information not available.",
            });
            return;
        }

        const recipientId = Number(userId);
        const recipientName = this.currentUser()?.name || "Unknown User";

        // Navigate to video call page with recipient info
        this.router.navigate(["/video-call"], {
            queryParams: {
                recipientId: recipientId,
                recipientName: recipientName,
            },
        });
    }
}
