import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { NotificationService } from "../services/notification.service";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ProfileViewDTO } from "../../typescript-api-client/src";
import { Popover, PopoverModule } from "primeng/popover";
import { ButtonModule } from "primeng/button";
import { AvatarModule } from "primeng/avatar";
import { TooltipModule } from "primeng/tooltip";

@Component({
    selector: "app-notification",
    standalone: true,
    imports: [CommonModule, RouterModule, PopoverModule, ButtonModule, AvatarModule, TooltipModule],
    templateUrl: "./notification.component.html",
    styleUrls: ["./notification.component.scss"],
})
export class NotificationComponent implements OnInit, OnDestroy {
    @ViewChild("notificationPanel") notificationPanel!: Popover;

    profileViews: ProfileViewDTO[] = [];
    unreadCount: number = 0;
    isLoading: boolean = false;

    private destroy$ = new Subject<void>();

    constructor(private notificationService: NotificationService) {}

    ngOnInit(): void {
        this.loadNotifications();

        // Subscribe to profile views updates
        this.notificationService.profileViews$
            .pipe(takeUntil(this.destroy$))
            .subscribe((views) => {
                this.profileViews = views;
            });

        // Subscribe to unread count updates
        this.notificationService.unreadCount$
            .pipe(takeUntil(this.destroy$))
            .subscribe((count) => {
                this.unreadCount = count;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Load notifications from the backend
     */
    loadNotifications(): void {
        this.isLoading = true;
        this.notificationService.loadProfileViews(20);
        this.isLoading = false;
    }

    /**
     * Toggle notification panel
     */
    toggleNotificationPanel(event: Event): void {
        this.notificationPanel.toggle(event);

        // Mark as read when opening
        if (this.unreadCount > 0) {
            this.notificationService.markAllAsRead();
        }
    }

    /**
     * Format time ago (e.g., "2 hours ago", "1 day ago")
     */
    getTimeAgo(dateString: string): string {
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
            return `${days} day${days > 1 ? "s" : ""} ago`;
        }
    }

    /**
     * Get user initials for avatar
     */
    getUserInitials(viewerName: string): string {
        return viewerName
            .split(" ")
            .map((name) => name.charAt(0))
            .join("")
            .toUpperCase()
            .substring(0, 2);
    }

    /**
     * Check if viewer is a friend
     */
    isFriend(view: ProfileViewDTO): boolean {
        return view.isFriend || false;
    }

    /**
     * Get friend status text
     */
    getFriendStatusText(view: ProfileViewDTO): string {
        return this.isFriend(view) ? "Friend" : "Not a friend";
    }

    /**
     * Refresh notifications
     */
    refreshNotifications(): void {
        this.loadNotifications();
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications(): void {
        this.profileViews = [];
        this.notificationService.markAllAsRead();
    }

    /**
     * Track by function for ngFor performance
     */
    trackByViewId(index: number, view: ProfileViewDTO): number | string {
        return view.id || index;
    }
}
