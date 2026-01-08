import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { UserService } from "../../typescript-api-client/src/api/api";
import { ProfileViewDTO } from "../../typescript-api-client/src/model/profile-view-dto";
import { MessageService } from "primeng/api";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

@Component({
    selector: "app-who-visited-me",
    templateUrl: "./who-visited-me.component.html",
    styleUrls: ["./who-visited-me.component.scss"],
})
export class WhoVisitedMeComponent implements OnInit, OnDestroy {
    profileViews: ProfileViewDTO[] = [];
    loading = false;
    profilePictures = new Map<number, SafeUrl | string>();
    defaultAvatar: string = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";
    private loadingProfilePictures = new Set<number>();
    private destroy$ = new Subject<void>();

    get friendsCount(): number {
        return this.profileViews.filter((v) => v.isFriend).length;
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
            if (url !== this.defaultAvatar && typeof url === 'string' && url.startsWith('blob:')) {
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
                    // Load profile pictures for all viewers
                    this.profileViews.forEach((view) => {
                        if (view.viewerId) {
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

    trackByViewId(index: number, view: ProfileViewDTO): number {
        return view.id;
    }

    loadProfilePicture(userId: number): void {
        // Skip if already loaded or loading
        if (this.profilePictures.has(userId) || this.loadingProfilePictures.has(userId)) {
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
                            this.sanitizer.bypassSecurityTrustUrl(objectURL)
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
                        console.error(`Error loading profile picture for user ${userId}:`, error);
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
        if (typeof picture === 'string') {
            return picture === this.defaultAvatar;
        }
        // For SafeUrl, check by comparing the underlying value
        return (picture as any).changingThisBreaksApplicationSecurity === this.defaultAvatar;
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

