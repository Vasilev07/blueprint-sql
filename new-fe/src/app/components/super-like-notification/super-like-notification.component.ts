import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperLikeNotificationService, SuperLikeReceivedNotification, SuperLikeSentNotification } from '../../services/super-like-notification.service';
import { UserService } from 'src/typescript-api-client/src/api/api';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-super-like-notification',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './super-like-notification.component.html',
    styleUrls: ['./super-like-notification.component.scss']
})
export class SuperLikeNotificationComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    showSuperLikeAnimation = false;
    notificationType: 'received' | 'sent' | null = null;
    receivedSuperLike: SuperLikeReceivedNotification | null = null;
    sentSuperLike: SuperLikeSentNotification | null = null;

    constructor(
        private superLikeNotificationService: SuperLikeNotificationService,
        private userService: UserService,
    ) {}

    ngOnInit(): void {
        // Listen for received super likes (for receiver)
        this.superLikeNotificationService.superLikeReceived$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    if (notification) {
                        this.notificationType = 'received';
                        this.receivedSuperLike = notification.data;
                        this.sentSuperLike = null;
                        this.showSuperLikeAnimation = true;
                        
                        // Auto-hide animation after 5 seconds
                        setTimeout(() => {
                            this.closeAnimation();
                        }, 5000);
                    }
                }
            });

        // Listen for sent super likes (for sender)
        this.superLikeNotificationService.superLikeSent$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    if (notification) {
                        console.log('✅ Super like sent notification in component:', notification);
                        this.notificationType = 'sent';
                        this.sentSuperLike = notification.data;
                        this.receivedSuperLike = null;
                        this.showSuperLikeAnimation = true;
                        
                        // Auto-hide animation after 5 seconds
                        setTimeout(() => {
                            this.closeAnimation();
                        }, 5000);
                    }
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    closeAnimation(): void {
        this.showSuperLikeAnimation = false;
        if (this.notificationType === 'received') {
            this.superLikeNotificationService.clearReceivedNotification();
        } else if (this.notificationType === 'sent') {
            this.superLikeNotificationService.clearSentNotification();
        }
        // Clear notifications after animation closes
        setTimeout(() => {
            this.receivedSuperLike = null;
            this.sentSuperLike = null;
            this.notificationType = null;
        }, 300); // Small delay to allow fade out
    }
}

