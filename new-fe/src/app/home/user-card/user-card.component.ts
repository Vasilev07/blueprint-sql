import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { HomeUser } from "../home.service";
import { Router } from "@angular/router";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { Subject, takeUntil } from "rxjs";
import { UserService, SuperLikeService } from "src/typescript-api-client/src/api/api";
import { MessageService } from "primeng/api";
import { SendSuperLikeRequestDTO } from "src/typescript-api-client/src";
import { WalletService } from "../../services/wallet.service";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";

@Component({
    selector: "app-user-card",
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TooltipModule],
    templateUrl: "./user-card.component.html",
    styleUrls: ["./user-card.component.scss"],
})
export class UserCardComponent implements OnInit, OnDestroy {
    @Input() user!: HomeUser;
    @Output() chatClick = new EventEmitter<HomeUser>();
    @Output() cardClick = new EventEmitter<HomeUser>();
    @Output() giftClick = new EventEmitter<HomeUser>();

    // SVG data URL for default avatar - no external file needed
    defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

    profilePictureBlobUrl: SafeUrl | string = this.defaultAvatar;
    canAffordSuperLike: boolean = false;
    superLikeCost: number = 200;
    private destroy$ = new Subject<void>();

    constructor(
        private router: Router,
        private userService: UserService,
        private superLikeService: SuperLikeService,
        private sanitizer: DomSanitizer,
        private messageService: MessageService,
        private walletService: WalletService
    ) { }

    ngOnInit(): void {
        // Load profile picture with authentication
        if (this.user.id) {
            this.loadProfilePicture();
        }
        // Subscribe to real-time balance updates via WebSocket
        this.subscribeToBalanceUpdates();
    }

    private subscribeToBalanceUpdates(): void {
        // Get initial affordability state
        this.canAffordSuperLike = this.walletService.canAffordSuperLike();
        this.superLikeCost = this.walletService.getSuperLikeCost();

        // Subscribe to real-time affordability updates via WebSocket
        this.walletService.canAffordSuperLike$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (canAfford) => {
                    this.canAffordSuperLike = canAfford;
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        // Revoke blob URL to free memory
        if (this.profilePictureBlobUrl !== this.defaultAvatar &&
            typeof this.profilePictureBlobUrl === 'string' &&
            this.profilePictureBlobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this.profilePictureBlobUrl);
        }
    }

    private loadProfilePicture(): void {
        if (!this.user.id) return;

        this.userService.getProfilePictureByUserId(this.user.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob: Blob) => {
                    const objectURL = URL.createObjectURL(blob);
                    this.profilePictureBlobUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
                },
                error: () => {
                    // On error, keep default avatar
                    this.profilePictureBlobUrl = this.defaultAvatar;
                }
            });
    }

    onCardClick(): void {
        this.cardClick.emit(this.user);
        // Navigate to user profile
        this.router.navigate(["/profile", this.user.id]);
    }

    onChatClick(event: Event): void {
        event.stopPropagation(); // Prevent card click
        this.chatClick.emit(this.user);
    }

    onGiftClick(event: Event): void {
        event.stopPropagation(); // Prevent card click
        this.giftClick.emit(this.user);
    }

    onSuperLikeClick(event: Event): void {
        event.stopPropagation();

        if (!this.user.id) return;

        // Frontend validation (first check) - using WalletService
        if (!this.walletService.canAffordSuperLike()) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Insufficient Balance', 
                detail: `Super Like costs ${this.superLikeCost} tokens. Please add more tokens to your account.` 
            });
            return;
        }

        // Backend will validate again (second check - defensive programming)
        this.superLikeService.sendSuperLike({ receiverId: this.user.id })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Super Like sent!' 
                    });
                    // Balance will be updated automatically via WebSocket from backend
                },
                error: (err: any) => {
                    const errorMsg = err.error?.message || 'Failed to send Super Like';
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: errorMsg 
                    });
                    console.error(err);
                }
            });
    }

    getUserInitials(): string {
        if (!this.user.fullName) return "?";
        const names = this.user.fullName.split(" ");
        return names
            .map((n) => n.charAt(0))
            .join("")
            .toUpperCase()
            .substring(0, 2);
    }

    getProfilePicture(): SafeUrl | string {
        return this.profilePictureBlobUrl;
    }

    onImageError(event: Event): void {
        this.profilePictureBlobUrl = this.defaultAvatar;
    }

    getSuperLikeTooltip(): string {
        if (this.canAffordSuperLike) {
            return `Super Like (${this.superLikeCost} tokens)`;
        }
        return `Insufficient balance. Super Like costs ${this.superLikeCost} tokens`;
    }
}