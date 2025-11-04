import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable, Subject, takeUntil } from "rxjs";
import { User, Message, ChatService, Conversation } from "./chat.service";
import { UserService } from "src/typescript-api-client/src/api/api";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
    selector: "app-chat-home",
    templateUrl: "./chat-home.component.html",
    styleUrls: ["./chat-home.component.scss"],
})
export class ChatHomeComponent implements OnInit, OnDestroy {
    lastRegisteredUsers$: Observable<User[]>;
    topFriends$: Observable<User[]>;
    recentMessages$: Observable<Message[]>;
    conversations$: Observable<Conversation[]>;
    users$: Observable<User[]>; // All users for lookups
    friends: User[] = [];
    selectedUserId: string | null = null;
    conversationAvatars: Map<string, string> = new Map();
    private loadingAvatars: Set<string> = new Set(); // Track which avatars are currently loading
    private avatarUpdateCounter = 0; // Force change detection
    private destroy$ = new Subject<void>();
    
    // SVG data URL for default avatar
    defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private chatService: ChatService,
        private userService: UserService,
        private cdr: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
    ) {
        this.lastRegisteredUsers$ = this.chatService.getLastRegisteredUsers(10);
        this.topFriends$ = this.chatService.getTopFriends(10);
        this.recentMessages$ = this.chatService.getRecentMessages(5);
        this.conversations$ = this.chatService.conversations$;
        this.users$ = this.chatService.users$; // For recent messages component
    }

    ngOnInit(): void {
        // Observables are already initialized in constructor
        this.chatService.friends$
            .pipe(takeUntil(this.destroy$))
            .subscribe((f) => (this.friends = f || []));
        
        // Load profile pictures for conversations
        this.conversations$
            .pipe(takeUntil(this.destroy$))
            .subscribe((conversations) => {
                this.loadConversationAvatars(conversations);
            });
        
        // Check if there's a userId in query params
        const initialParams = this.route.snapshot.queryParams;
        if (initialParams['userId']) {
            this.selectedUserId = initialParams['userId'];
        }
        
        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe(params => {
                if (params['userId']) {
                    this.selectedUserId = params['userId'];
                } else {
                    this.selectedUserId = null;
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        
        // Revoke blob URLs to free memory
        this.conversationAvatars.forEach((url) => {
            if (url && url !== this.defaultAvatar && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        this.conversationAvatars.clear();
    }

    startChat(userId: any): void {
        const id = String(
            userId && typeof userId === "object" ? userId.id : userId,
        );
        if (!id || id === "undefined" || id === "null") return;
        this.selectedUserId = id;
        // Update URL to reflect the selected conversation
        this.router.navigate(['/chat'], { queryParams: { userId: id }, replaceUrl: true });
    }

    startChatFromConversation(conversation: Conversation): void {
        const me = this.getLoggedInUserId();
        const otherUserId = (conversation.participants || [])
            .map((p: any) => String(p))
            .find((p: string) => p !== me);

        if (otherUserId) {
            this.selectedUserId = otherUserId;
            // Update URL to reflect the selected conversation
            this.router.navigate(['/chat'], { queryParams: { userId: otherUserId }, replaceUrl: true });
        }
    }

    closeChat(): void {
        this.selectedUserId = null;
        this.router.navigate(['/chat'], { replaceUrl: true });
    }

    formatTime(date: Date | undefined): string {
        if (!date) return "";
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    getUserName(userId: string): string {
        const friend = this.friends.find(
            (u) => String(u.id) === String(userId),
        );
        return friend?.name || userId || "Unknown User";
    }

    private getLoggedInUserId(): string {
        const id = Number(
            JSON.parse(
                atob(
                    (localStorage.getItem("id_token") || "").split(".")[1] ||
                        "e30=",
                ),
            )?.id || 0,
        );
        return String(id || "");
    }

    getConversationDisplayName(conversation: Conversation): string {
        if (conversation.name) {
            return conversation.name;
        }
        const me = this.getLoggedInUserId();
        const parts = (conversation.participants || []).map((p: any) =>
            String(p),
        );
        const others = parts.filter((p) => p !== me);
        const otherId = others[0] || parts[0] || "";
        const friend = this.friends.find(
            (f) => String(f.id) === otherId || f.email === otherId,
        );
        return friend?.name || otherId || "Unknown User";
    }

    getConversationAvatar(conversation: Conversation): string {
        const me = this.getLoggedInUserId();
        const parts = (conversation.participants || []).map((p: any) =>
            String(p),
        );
        
        const others = parts.filter((p) => p !== me);
        const otherId = others[0] || parts[0] || "";
        
        if (!otherId) {
            return this.defaultAvatar;
        }
        
        // If avatar is not loaded yet and not currently loading, trigger loading
        if (!this.conversationAvatars.has(otherId) && !this.loadingAvatars.has(otherId)) {
            this.loadProfilePictureForUser(otherId);
        }
        
        return this.conversationAvatars.get(otherId) || this.defaultAvatar;
    }

    private loadConversationAvatars(conversations: Conversation[]): void {
        const me = this.getLoggedInUserId();
        const uniqueUserIds = new Set<string>();
        
        conversations.forEach((conversation) => {
            const parts = (conversation.participants || []).map((p: any) =>
                String(p),
            );
            const others = parts.filter((p) => p !== me);
            const otherId = others[0] || parts[0] || "";
            if (otherId) {
                // Always try to load, even if already in map (to refresh)
                uniqueUserIds.add(otherId);
            }
        });

        uniqueUserIds.forEach((userId) => {
            // Only load if not already loaded or loading
            if (!this.conversationAvatars.has(userId)) {
                this.loadProfilePictureForUser(userId);
            }
        });
    }

    private loadProfilePictureForUser(userId: string): void {
        const numericUserId = parseInt(userId, 10);
        if (!numericUserId) {
            this.conversationAvatars.set(userId, this.defaultAvatar);
            return;
        }

        // Mark as loading to prevent duplicate requests
        this.loadingAvatars.add(userId);

        this.userService
            .getProfilePictureByUserId(numericUserId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob: Blob) => {
                    const objectURL = URL.createObjectURL(blob);
                    this.conversationAvatars.set(userId, objectURL);
                    this.loadingAvatars.delete(userId);
                    this.avatarUpdateCounter++; // Force change detection
                    this.cdr.markForCheck();
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    // Profile picture not found is okay
                    if (error.status !== 404) {
                        console.error(
                            `Error loading profile picture for user ${userId}:`,
                            error,
                        );
                    }
                    // Set default avatar on error
                    this.conversationAvatars.set(userId, this.defaultAvatar);
                    this.loadingAvatars.delete(userId);
                    this.cdr.detectChanges();
                },
            });
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        if (img) {
            img.src = this.defaultAvatar;
        }
    }
}
