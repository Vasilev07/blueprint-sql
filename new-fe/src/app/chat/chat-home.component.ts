import {
    Component,
    signal,
    computed,
    effect,
    inject,
    HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { User, Message, ChatService, Conversation } from "./chat.service";
import { UserService } from "src/typescript-api-client/src/api/api";
import { DomSanitizer } from "@angular/platform-browser";
import { ChatComponent } from "./chat.component";
import { UserListComponent } from "./user-list.component";
import { FriendsListComponent } from "./friends-list.component";
import { RecentMessagesComponent } from "./recent-messages.component";

@Component({
    selector: "app-chat-home",
    standalone: true,
    imports: [
        CommonModule,
        ChatComponent,
        UserListComponent,
        FriendsListComponent,
        RecentMessagesComponent,
    ],
    templateUrl: "./chat-home.component.html",
    styleUrls: ["./chat-home.component.scss"],
})
export class ChatHomeComponent {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private chatService = inject(ChatService);
    private userService = inject(UserService);
    private sanitizer = inject(DomSanitizer);

    // Convert observables to signals
    lastRegisteredUsers = toSignal(this.chatService.getLastRegisteredUsers(10), {
        initialValue: [] as User[],
    });
    topFriends = toSignal(this.chatService.getTopFriends(10), {
        initialValue: [] as User[],
    });
    recentMessages = toSignal(this.chatService.getRecentMessages(5), {
        initialValue: [] as Message[],
    });
    conversations = toSignal(this.chatService.conversations$, {
        initialValue: [] as Conversation[],
    });
    users = toSignal(this.chatService.users$, {
        initialValue: [] as User[],
    });
    friends = toSignal(this.chatService.friends$, {
        initialValue: [] as User[],
    });

    // Local state signals
    selectedUserId = signal<string | null>(null);
    conversationAvatars = signal<Map<string, string>>(new Map());
    private loadingAvatars = signal<Set<string>>(new Set());
    isMobile = signal<boolean>(false);

    // SVG data URL for default avatar
    defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

    // Expose observables for child components that still use them
    lastRegisteredUsers$ = toObservable(this.lastRegisteredUsers);
    topFriends$ = toObservable(this.topFriends);
    recentMessages$ = toObservable(this.recentMessages);
    conversations$ = toObservable(this.conversations);
    users$ = toObservable(this.users);

    constructor() {
        // Check initial screen size
        this.checkScreenSize();

        // Load profile pictures for conversations when they change
        effect(() => {
            const conversations = this.conversations();
            this.loadConversationAvatars(conversations);
        });

        // Check if there's a userId in query params
        const initialParams = this.route.snapshot.queryParams;
        if (initialParams["userId"]) {
            this.selectedUserId.set(initialParams["userId"]);
        }

        // Subscribe to route query params
        this.route.queryParams.subscribe((params) => {
            if (params["userId"]) {
                this.selectedUserId.set(params["userId"]);
            } else {
                this.selectedUserId.set(null);
            }
        });
    }

    // Cleanup effect for revoking blob URLs
    private cleanupEffect = effect(() => {
        const avatars = this.conversationAvatars();
        // This effect runs when avatars change, but we'll handle cleanup in ngOnDestroy equivalent
        // For now, we'll use a cleanup function that can be called
    });

    // Cleanup function to revoke blob URLs
    private cleanupAvatars(): void {
        const avatars = this.conversationAvatars();
        avatars.forEach((url) => {
            if (url && url !== this.defaultAvatar && url.startsWith("blob:")) {
                URL.revokeObjectURL(url);
            }
        });
        this.conversationAvatars.set(new Map());
    }

    startChat(userId: any): void {
        const id = String(
            userId && typeof userId === "object" ? userId.id : userId,
        );
        if (!id || id === "undefined" || id === "null") return;
        this.selectedUserId.set(id);
        // Update URL to reflect the selected conversation
        this.router.navigate(["/chat"], {
            queryParams: { userId: id },
            replaceUrl: true,
        });
    }

    startChatFromConversation(conversation: Conversation): void {
        const me = this.getLoggedInUserId();
        const otherUserId = (conversation.participants || [])
            .map((p: any) => String(p))
            .find((p: string) => p !== me);

        if (otherUserId) {
            this.selectedUserId.set(otherUserId);
            // Update URL to reflect the selected conversation
            this.router.navigate(["/chat"], {
                queryParams: { userId: otherUserId },
                replaceUrl: true,
            });
        }
    }

    closeChat(): void {
        this.selectedUserId.set(null);
        this.router.navigate(["/chat"], { replaceUrl: true });
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
        const friendsList = this.friends();
        const friend = friendsList.find(
            (u: User) => String(u.id) === String(userId),
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
        const friendsList = this.friends();
        const friend = friendsList.find(
            (f: User) => String(f.id) === otherId || f.email === otherId,
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

        const avatars = this.conversationAvatars();
        const loading = this.loadingAvatars();

        // If avatar is not loaded yet and not currently loading, trigger loading
        if (!avatars.has(otherId) && !loading.has(otherId)) {
            this.loadProfilePictureForUser(otherId);
        }

        // Return stored avatar (could be blob URL, regular URL, or default)
        return avatars.get(otherId) || this.defaultAvatar;
    }

    private loadConversationAvatars(conversations: Conversation[]): void {
        const me = this.getLoggedInUserId();
        const uniqueUserIds = new Set<string>();
        const avatars = this.conversationAvatars();

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
            if (!avatars.has(userId)) {
                this.loadProfilePictureForUser(userId);
            }
        });
    }

    private loadProfilePictureForUser(userId: string): void {
        const numericUserId = parseInt(userId, 10);
        if (!numericUserId) {
            const avatars = this.conversationAvatars();
            avatars.set(userId, this.defaultAvatar);
            this.conversationAvatars.set(new Map(avatars));
            return;
        }

        // Mark as loading to prevent duplicate requests
        const loading = this.loadingAvatars();
        loading.add(userId);
        this.loadingAvatars.set(new Set(loading));

        this.userService.getProfilePictureByUserId(numericUserId).subscribe({
            next: (blob: Blob) => {
                const avatars = this.conversationAvatars();
                // Only create blob URL for non-empty images
                if (blob.size > 0) {
                    const objectURL = URL.createObjectURL(blob);
                    avatars.set(userId, objectURL);
                } else {
                    // Empty blob, use default avatar
                    avatars.set(userId, this.defaultAvatar);
                }
                this.conversationAvatars.set(new Map(avatars));

                const loadingSet = this.loadingAvatars();
                loadingSet.delete(userId);
                this.loadingAvatars.set(new Set(loadingSet));
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
                const avatars = this.conversationAvatars();
                avatars.set(userId, this.defaultAvatar);
                this.conversationAvatars.set(new Map(avatars));

                const loadingSet = this.loadingAvatars();
                loadingSet.delete(userId);
                this.loadingAvatars.set(new Set(loadingSet));
            },
        });
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        if (img) {
            img.src = this.defaultAvatar;
        }
    }

    navigateToSearch(): void {
        this.router.navigate(["/advanced-search"]);
    }

    createGroup(): void {
        // TODO: Implement group creation functionality
        // For now, navigate to friends page or show a dialog
        this.router.navigate(["/friends"]);
    }

    @HostListener("window:resize", ["$event"])
    onResize(_event: any) {
        this.checkScreenSize();
    }

    private checkScreenSize(): void {
        this.isMobile.set(window.innerWidth <= 768);
    }
}
