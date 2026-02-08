import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { UserService } from "../../typescript-api-client/src/api/api";
import { ProfileViewDTO } from "../../typescript-api-client/src/model/profile-view-dto";
import { MessageService } from "primeng/api";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import {
    GiftDialogUser,
    SendGiftDialogComponent,
} from "../shared/send-gift-dialog/send-gift-dialog.component";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { ProgressSpinnerModule } from "primeng/progressspinner";

interface GroupedProfileView {
    viewerId: number;
    viewerName?: string;
    isFriend: boolean;
    visitCount: number;
    mostRecentView: ProfileViewDTO;
}

@Component({
    selector: "app-who-visited-me",
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TooltipModule,
        ProgressSpinnerModule,
        SendGiftDialogComponent,
    ],
    templateUrl: "./who-visited-me.component.html",
    styleUrls: ["./who-visited-me.component.scss"],
})
export class WhoVisitedMeComponent implements OnInit, OnDestroy {
    profileViews: ProfileViewDTO[] = [];
    loading = false;
    profilePictures = new Map<number, SafeUrl | string>();
    defaultAvatar: string =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
    private loadingProfilePictures = new Set<number>();
    private destroy$ = new Subject<void>();

    // Gift properties
    showSendGiftDialog = false;
    recipientUserForGift: GiftDialogUser | null = null;

    get groupedViews(): GroupedProfileView[] {
        const groupedMap = new Map<number, GroupedProfileView>();

        this.profileViews.forEach((view) => {
            if (!view.viewerId) return;

            if (groupedMap.has(view.viewerId)) {
                const grouped = groupedMap.get(view.viewerId)!;
                grouped.visitCount++;
                // Update most recent view if this one is more recent
                const currentDate = new Date(view.viewedAt);
                const existingDate = new Date(grouped.mostRecentView.viewedAt);
                if (currentDate > existingDate) {
                    grouped.mostRecentView = view;
                }
            } else {
                groupedMap.set(view.viewerId, {
                    viewerId: view.viewerId,
                    viewerName: view.viewerName,
                    isFriend: view.isFriend,
                    visitCount: 1,
                    mostRecentView: view,
                });
            }
        });

        // Convert map to array and sort by most recent view
        return Array.from(groupedMap.values()).sort((a, b) => {
            const dateA = new Date(a.mostRecentView.viewedAt);
            const dateB = new Date(b.mostRecentView.viewedAt);
            return dateB.getTime() - dateA.getTime();
        });
    }

    get uniqueViewersCount(): number {
        return this.groupedViews.length;
    }

    get totalViewsCount(): number {
        return this.profileViews.length;
    }

    get friendsCount(): number {
        return this.groupedViews.filter((v) => v.isFriend).length;
    }

    get friendsLabel(): string {
        return this.friendsCount === 1 ? "friend" : "friends";
    }

    constructor(
        private userService: UserService,
        private router: Router,
        private messageService: MessageService,
        private sanitizer: DomSanitizer,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.loadProfileViews();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        // Revoke blob URLs to free memory
        this.profilePictures.forEach((url) => {
            if (
                url !== this.defaultAvatar &&
                typeof url === "string" &&
                url.startsWith("blob:")
            ) {
                URL.revokeObjectURL(url);
            }
        });
    }

    loadProfileViews(): void {
        this.loading = true;
        const token = localStorage.getItem("id_token");
        if (token) {
            this.userService.defaultHeaders =
                this.userService.defaultHeaders.set(
                    "Authorization",
                    `Bearer ${token}`,
                );
        }

        this.userService
            .getProfileViews(50) // Limit to 50 profile views
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (views) => {
                    this.profileViews = views || [];
                    this.loading = false;
                    // Load profile pictures for unique viewers only
                    const uniqueViewerIds = new Set<number>();
                    this.profileViews.forEach((view) => {
                        if (
                            view.viewerId &&
                            !uniqueViewerIds.has(view.viewerId)
                        ) {
                            uniqueViewerIds.add(view.viewerId);
                            this.loadProfilePicture(view.viewerId);
                        }
                    });
                },
                error: (error) => {
                    console.error("Error loading profile views:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load profile views",
                    });
                    this.loading = false;
                },
            });
    }

    formatTimeAgo(dateString: string): string {
        if (!dateString) return "Unknown";

        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000,
        );

        if (diffInSeconds < 60) {
            return "Just now";
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            if (days < 7) {
                return `${days} day${days > 1 ? "s" : ""} ago`;
            } else if (days < 30) {
                const weeks = Math.floor(days / 7);
                return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
            } else {
                const months = Math.floor(days / 30);
                return `${months} month${months > 1 ? "s" : ""} ago`;
            }
        }
    }

    onViewProfile(viewerId: number): void {
        this.router.navigate(["/profile", viewerId]);
    }

    onChatClick(viewerId: number, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.router.navigate(["/chat"], { queryParams: { userId: viewerId } });
    }

    onGiftClick(viewerId: number, viewerName?: string, event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        this.recipientUserForGift = {
            id: viewerId,
            name: viewerName,
        };
        this.showSendGiftDialog = true;
    }

    onGiftSent(_response: any): void {
        // Gift was sent successfully, dialog is already closed
        this.recipientUserForGift = null;
    }

    trackByViewId(index: number, view: ProfileViewDTO): number {
        return view.id;
    }

    trackByViewerId(index: number, grouped: GroupedProfileView): number {
        return grouped.viewerId;
    }

    loadProfilePicture(userId: number): void {
        // Skip if already loaded or loading
        if (
            this.profilePictures.has(userId) ||
            this.loadingProfilePictures.has(userId)
        ) {
            return;
        }

        this.loadingProfilePictures.add(userId);
        // Set default avatar initially
        this.profilePictures.set(userId, this.defaultAvatar);

        const token = localStorage.getItem("id_token");
        if (token) {
            this.userService.defaultHeaders =
                this.userService.defaultHeaders.set(
                    "Authorization",
                    `Bearer ${token}`,
                );
        }

        this.userService
            .getProfilePictureByUserId(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob: Blob) => {
                    if (blob.size > 0) {
                        const objectURL = URL.createObjectURL(blob);
                        this.profilePictures.set(
                            userId,
                            this.sanitizer.bypassSecurityTrustUrl(objectURL),
                        );
                    } else {
                        this.profilePictures.set(userId, this.defaultAvatar);
                    }
                    this.loadingProfilePictures.delete(userId);
                    // Create new Map to trigger change detection
                    this.profilePictures = new Map(this.profilePictures);
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
                    this.profilePictures.set(userId, this.defaultAvatar);
                    this.loadingProfilePictures.delete(userId);
                    // Create new Map to trigger change detection
                    this.profilePictures = new Map(this.profilePictures);
                    this.cdr.detectChanges();
                },
            });
    }

    getProfilePicture(userId: number): SafeUrl | string {
        return this.profilePictures.get(userId) || this.defaultAvatar;
    }

    isDefaultAvatar(picture: SafeUrl | string | undefined): boolean {
        if (!picture) return true;
        if (typeof picture === "string") {
            return picture === this.defaultAvatar;
        }
        // For SafeUrl, check by comparing the underlying value
        return (
            (picture as any).changingThisBreaksApplicationSecurity ===
            this.defaultAvatar
        );
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = this.defaultAvatar;
    }

    getInitials(name?: string): string {
        if (!name) return "?";
        const names = name.split(" ");
        return names
            .map((n) => n.charAt(0))
            .join("")
            .toUpperCase()
            .substring(0, 2);
    }
}
