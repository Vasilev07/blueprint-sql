import {
    Component,
    input,
    output,
    signal,
    computed,
    inject,
    ElementRef,
    ViewChild,
    AfterViewInit,
    OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { HomeUser } from "../home.service";
import { Router } from "@angular/router";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    UserService,
    SuperLikeService,
} from "src/typescript-api-client/src/api/api";
import { MessageService } from "primeng/api";
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
export class UserCardComponent implements AfterViewInit, OnDestroy {
    // Input signal - modern Angular way
    user = input.required<HomeUser>();
    
    // Output signals (using output() for events)
    chatClick = output<HomeUser>();
    cardClick = output<HomeUser>();
    giftClick = output<HomeUser>();

    // ViewChild for Intersection Observer
    @ViewChild('cardElement', { static: false }) cardElement!: ElementRef<HTMLElement>;

    // SVG data URL for default avatar
    private readonly defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

    // Signals for component state
    profilePictureBlobUrl = signal<SafeUrl | string>(this.defaultAvatar);
    private profilePictureLoaded = signal(false);
    
    // Convert observable to signal for wallet affordability
    private walletService = inject(WalletService);
    canAffordSuperLike = toSignal(this.walletService.canAffordSuperLike$, {
        initialValue: this.walletService.canAffordSuperLike(),
    });
    
    // Computed signal for super like cost
    superLikeCost = computed(() => this.walletService.getSuperLikeCost());

    // Injected services
    private router = inject(Router);
    private userService = inject(UserService);
    private superLikeService = inject(SuperLikeService);
    private sanitizer = inject(DomSanitizer);
    private messageService = inject(MessageService);
    private elementRef = inject(ElementRef);

    private intersectionObserver?: IntersectionObserver;

    // Computed signals for derived values
    profilePicture = computed(() => this.profilePictureBlobUrl());
    
    superLikeTooltip = computed(() => {
        const canAfford = this.canAffordSuperLike() ?? false;
        const cost = this.superLikeCost();
        if (canAfford) {
            return `Super Like (${cost} tokens)`;
        }
        return `Insufficient balance. Super Like costs ${cost} tokens`;
    });

    userInitials = computed(() => {
        const fullName = this.user().fullName;
        if (!fullName) return "?";
        const names = fullName.split(" ");
        return names
            .map((n) => n.charAt(0))
            .join("")
            .toUpperCase()
            .substring(0, 2);
    });

    ngAfterViewInit(): void {
        // Setup Intersection Observer for lazy loading
        this.setupIntersectionObserver();
    }

    ngOnDestroy(): void {
        // Clean up Intersection Observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }

        // Revoke blob URL to free memory
        const currentUrl = this.profilePictureBlobUrl();
        if (
            currentUrl !== this.defaultAvatar &&
            typeof currentUrl === "string" &&
            currentUrl.startsWith("blob:")
        ) {
            URL.revokeObjectURL(currentUrl);
        }
    }

    private setupIntersectionObserver(): void {
        // Get the card element to observe
        const cardElement = this.cardElement?.nativeElement || 
            this.elementRef.nativeElement.querySelector('.user-card');
        
        if (!cardElement) {
            this.loadProfilePicture();
            return;
        }

        // Use Intersection Observer for efficient lazy loading
        if (typeof IntersectionObserver !== 'undefined') {
            this.createIntersectionObserver(cardElement);
        } else {
            // Fallback for browsers without Intersection Observer support
            this.loadProfilePicture();
        }
    }

    private createIntersectionObserver(element: HTMLElement): void {
        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            const entry = entries[0];
            if (entry?.isIntersecting && !this.profilePictureLoaded()) {
                this.loadProfilePicture();
                this.cleanupObserver();
            }
        };

        this.intersectionObserver = new IntersectionObserver(handleIntersection, {
            rootMargin: '100px', // Start loading 100px before card enters viewport
            threshold: 0.01, // Trigger when even 1% is visible
        });

        this.intersectionObserver.observe(element);
    }

    private cleanupObserver(): void {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = undefined;
        }
    }

    private loadProfilePicture(): void {
        const userId = this.user().id;
        if (!userId) return;
        
        // Prevent duplicate loads
        if (this.profilePictureLoaded()) return;
        
        // Mark as loading to prevent duplicate requests
        this.profilePictureLoaded.set(true);

        this.userService
            .getProfilePictureByUserId(userId)
            .subscribe({
                next: (blob: Blob) => {
                    const objectURL = URL.createObjectURL(blob);
                    this.profilePictureBlobUrl.set(
                        this.sanitizer.bypassSecurityTrustUrl(objectURL)
                    );
                },
                error: () => {
                    // On error, keep default avatar and allow retry
                    this.profilePictureBlobUrl.set(this.defaultAvatar);
                    // Don't reset profilePictureLoaded to allow retry on next intersection
                    // this.profilePictureLoaded.set(false);
                },
            });
    }

    onCardClick(): void {
        this.cardClick.emit(this.user());
        // Navigate to user profile
        this.router.navigate(["/profile", this.user().id]);
    }

    onChatClick(event: Event): void {
        event.stopPropagation(); // Prevent card click
        this.chatClick.emit(this.user());
    }

    onGiftClick(event: Event): void {
        event.stopPropagation(); // Prevent card click
        this.giftClick.emit(this.user());
    }

    onSuperLikeClick(event: Event): void {
        event.stopPropagation();

        const userId = this.user().id;
        if (!userId) return;

        // Frontend validation (first check) - using WalletService
        if (!this.walletService.canAffordSuperLike()) {
            this.messageService.add({
                severity: "warn",
                summary: "Insufficient Balance",
                detail: `Super Like costs ${this.superLikeCost()} tokens. Please add more tokens to your account.`,
            });
            return;
        }

        // Backend will validate again (second check - defensive programming)
        this.superLikeService.sendSuperLike({ receiverId: userId }).subscribe({
            next: (_response: any) => {
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Super Like sent!",
                });
                // Balance will be updated automatically via WebSocket from backend
            },
            error: (err: any) => {
                const errorMsg =
                    err.error?.message || "Failed to send Super Like";
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: errorMsg,
                });
                console.error(err);
            },
        });
    }

    // Keep these methods for template compatibility
    getProfilePicture(): SafeUrl | string {
        return this.profilePicture();
    }

    getUserInitials(): string {
        return this.userInitials();
    }

    getSuperLikeTooltip(): string {
        return this.superLikeTooltip();
    }

    onImageError(_event: Event): void {
        this.profilePictureBlobUrl.set(this.defaultAvatar);
    }
}
