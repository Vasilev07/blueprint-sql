import { Injectable, OnDestroy } from "@angular/core";
import { Observable, BehaviorSubject, Subject, takeUntil } from "rxjs";
import {
    UserService,
    ProfileViewDTO,
    GetProfileViewStats200Response,
} from "../../typescript-api-client/src";
import { WebsocketService } from "./websocket.service";

@Injectable({
    providedIn: "root",
})
export class NotificationService implements OnDestroy {
    private profileViewsSubject = new BehaviorSubject<ProfileViewDTO[]>([]);
    private unreadCountSubject = new BehaviorSubject<number>(0);
    private destroy$ = new Subject<void>();

    public profileViews$ = this.profileViewsSubject.asObservable();
    public unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(
        private userService: UserService,
        private websocketService: WebsocketService,
    ) {
        this.initializeWebSocketListeners();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Initialize WebSocket listeners for real-time notifications
     */
    private initializeWebSocketListeners(): void {
        this.websocketService
            .onProfileView()
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload) => {
                console.log(
                    "NotificationService: Received profile view notification:",
                    payload,
                );
                // Only process if this is a notification for the profile owner (has viewerId)
                // Skip count update notifications (has userId but no viewerId)
                if (payload.viewerId && !payload.userId) {
                    console.log(
                        "NotificationService: Processing profile view notification for owner",
                    );
                    // Refresh the notifications when a new profile view is received
                    this.loadProfileViews(20);
                } else {
                    console.log(
                        "NotificationService: Skipping - this is a count update notification",
                    );
                }
            });
    }

    fetchProfileViews(limit?: number): Observable<ProfileViewDTO[]> {
        return this.userService.getProfileViews(limit || 20);
    }

    getProfileViewStats(): Observable<GetProfileViewStats200Response> {
        return this.userService.getProfileViewStats();
    }

    loadProfileViews(limit: number = 20): void {
        this.fetchProfileViews(limit).subscribe({
            next: (views) => {
                this.profileViewsSubject.next(views);
                this.updateUnreadCount(views);
            },
            error: (error) => {
                console.error("Error loading profile views:", error);
            },
        });
    }

    private updateUnreadCount(views: ProfileViewDTO[]): void {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const recentViews = views.filter(
            (view) => new Date(view.viewedAt!) > oneDayAgo,
        );

        this.unreadCountSubject.next(recentViews.length);
    }

    markAllAsRead(): void {
        this.unreadCountSubject.next(0);
    }

    getUnreadCount(): number {
        return this.unreadCountSubject.value;
    }

    getProfileViews(): ProfileViewDTO[] {
        return this.profileViewsSubject.value;
    }
}
