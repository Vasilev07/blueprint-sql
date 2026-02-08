import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GiftNotificationService, GiftNotification } from '../../services/gift-notification.service';
import { UserService, WalletService } from 'src/typescript-api-client/src/api/api';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-gift-notification',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './gift-notification.component.html',
    styleUrls: ['./gift-notification.component.scss']
})
export class GiftNotificationComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    showGiftAnimation = false;
    receivedGift: GiftNotification | null = null;

    constructor(
        private giftNotificationService: GiftNotificationService,
        private userService: UserService,
        private walletService: WalletService
    ) {}

    ngOnInit(): void {
        this.giftNotificationService.giftReceived$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    if (notification) {
                        this.receivedGift = notification;
                        this.showGiftAnimation = true;
                        this.loadBalance(); // Reload balance since it changed
                        
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
        this.showGiftAnimation = false;
        this.giftNotificationService.clearNotification();
        // Clear received gift after animation closes
        setTimeout(() => {
            this.receivedGift = null;
        }, 300); // Small delay to allow fade out
    }

    loadBalance(): void {
        // Reload balance to reflect the new gift received
        this.userService.getUser().subscribe({
            next: (user: any) => {
                // Balance updated
            },
            error: (error) => {
                console.error('Error loading balance:', error);
            }
        });
    }
}

