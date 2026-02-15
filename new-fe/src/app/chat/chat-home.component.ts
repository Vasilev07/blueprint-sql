import {
    Component,
    signal,
    inject,
    HostListener,
    DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
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
    private destroyRef = inject(DestroyRef);

    // Convert observables to signals
    lastRegisteredUsers = toSignal(
        this.chatService.getLastRegisteredUsers(10),
        {
            initialValue: [] as User[],
        },
    );
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
    private loadingAvatars = new Set<string>(); // Don't use signal here to avoid loops
    isMobile = signal<boolean>(false);

    // SVG data URL for default avatar
    defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

    constructor() {
        console.log("[ChatHomeComponent] Constructor called");
        this.checkScreenSize();

        // Load avatars when conversations change - use subscription instead of effect to avoid loops
        this.chatService.conversations$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((conversations) => {
                console.log(
                    "[ChatHomeComponent] Conversations updated, count:",
                    conversations?.length || 0,
                );
                if (conversations && conversations.length > 0) {
                    this.loadConversationAvatars(conversations);
                }
            });

        const initialParams = this.route.snapshot.queryParams;
        if (initialParams["userId"]) {
            this.selectedUserId.set(initialParams["userId"]);
        }

        this.route.queryParams
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                console.log(
                    "[ChatHomeComponent] Query params changed:",
                    params,
                );
                if (params["userId"]) {
                    console.log(
                        "[ChatHomeComponent] Setting selectedUserId to:",
                        params["userId"],
                    );
                    this.selectedUserId.set(params["userId"]);
                } else {
                    console.log("[ChatHomeComponent] Clearing selectedUserId");
                    this.selectedUserId.set(null);
                }
            });
    }

    startChat(userId: any): void {
        const id = String(
            userId && typeof userId === "object" ? userId.id : userId,
        );
        if (!id || id === "undefined" || id === "null") return;

        console.log("[ChatHomeComponent] startChat called with userId:", id);
        this.selectedUserId.set(id);

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

    isConversationActive(conversation: Conversation): boolean {
        const sid = this.selectedUserId();
        if (!sid) return false;
        return (conversation.participants ?? []).some((p) => String(p) === sid);
    }

    getUserName(userId: string): string {
        const friendsList = this.friends();
        const friend = friendsList?.find(
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
        const friend = friendsList?.find(
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

        // Don't trigger loading from here - let the effect handle it
        // This prevents excessive calls from change detection
        return avatars.get(otherId) || this.defaultAvatar;
    }

    private loadConversationAvatars(conversations: Conversation[]): void {
        const me = this.getLoggedInUserId();
        const uniqueUserIds = new Set<string>();
        const currentAvatars = this.conversationAvatars();

        conversations.forEach((conversation) => {
            const parts = (conversation.participants || []).map((p: any) =>
                String(p),
            );
            const others = parts.filter((p) => p !== me);
            const otherId = others[0] || parts[0] || "";
            if (otherId) {
                uniqueUserIds.add(otherId);
            }
        });

        uniqueUserIds.forEach((userId) => {
            // Skip if already loaded or loading
            if (
                !currentAvatars.has(userId) &&
                !this.loadingAvatars.has(userId)
            ) {
                this.loadProfilePictureForUser(userId);
            }
        });
    }

    private loadProfilePictureForUser(userId: string): void {
        const numericUserId = parseInt(userId, 10);
        if (!numericUserId) {
            this.conversationAvatars.update((avatars) => {
                const newMap = new Map(avatars);
                newMap.set(userId, this.defaultAvatar);
                return newMap;
            });
            return;
        }

        // Mark as loading - use plain Set, not signal
        this.loadingAvatars.add(userId);

        this.userService
            .getProfilePictureByUserId(numericUserId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (blob: Blob) => {
                    this.conversationAvatars.update((avatars) => {
                        const newMap = new Map(avatars);
                        if (blob.size > 0) {
                            const objectURL = URL.createObjectURL(blob);
                            newMap.set(userId, objectURL);
                        } else {
                            newMap.set(userId, this.defaultAvatar);
                        }
                        return newMap;
                    });
                    this.loadingAvatars.delete(userId);
                },
                error: (error) => {
                    if (error.status !== 404) {
                        console.error(
                            `Error loading profile picture for user ${userId}:`,
                            error,
                        );
                    }
                    this.conversationAvatars.update((avatars) => {
                        const newMap = new Map(avatars);
                        newMap.set(userId, this.defaultAvatar);
                        return newMap;
                    });
                    this.loadingAvatars.delete(userId);
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
