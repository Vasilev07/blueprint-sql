import { Component, signal, DestroyRef, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
    GiftNotificationService,
    GiftNotification,
} from "../../services/gift-notification.service";
import { UserService } from "src/typescript-api-client/src/api/api";

@Component({
    selector: "app-gift-notification",
    standalone: true,
    imports: [CommonModule],
    templateUrl: "./gift-notification.component.html",
    styleUrls: ["./gift-notification.component.scss"],
})
export class GiftNotificationComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
    private giftNotificationService = inject(GiftNotificationService);
    private userService = inject(UserService);

    readonly showGiftAnimation = signal(false);
    readonly receivedGift = signal<GiftNotification | null>(null);

    ngOnInit(): void {
        this.giftNotificationService.giftReceived$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((notification) => {
                if (notification) {
                    this.receivedGift.set(notification);
                    this.showGiftAnimation.set(true);
                    this.loadBalance();

                    setTimeout(() => {
                        this.closeAnimation();
                    }, 5000);
                }
            });
    }

    closeAnimation(): void {
        this.showGiftAnimation.set(false);
        this.giftNotificationService.clearNotification();
        setTimeout(() => {
            this.receivedGift.set(null);
        }, 300);
    }

    loadBalance(): void {
        this.userService.getUser().subscribe({
            next: () => {},
            error: (error) => {
                console.error("Error loading balance:", error);
            },
        });
    }
}
