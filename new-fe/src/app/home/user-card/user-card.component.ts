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
    user = input.required<HomeUser>();

    chatClick = output<HomeUser>();
    cardClick = output<HomeUser>();
    giftClick = output<HomeUser>();

    @ViewChild("cardElement", { static: false })
    cardElement!: ElementRef<HTMLElement>;

    private readonly defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

    profilePictureBlobUrl = signal<SafeUrl | string>(this.defaultAvatar);
    private profilePictureLoaded = signal(false);

    private walletService = inject(WalletService);
    canAffordSuperLike = toSignal(this.walletService.canAffordSuperLike$, {
        initialValue: this.walletService.canAffordSuperLike(),
    });

    superLikeCost = computed(() => this.walletService.getSuperLikeCost());

    private router = inject(Router);
    private userService = inject(UserService);
    private superLikeService = inject(SuperLikeService);
    private sanitizer = inject(DomSanitizer);
    private messageService = inject(MessageService);
    private elementRef = inject(ElementRef);

    private intersectionObserver?: IntersectionObserver;

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
        this.setupIntersectionObserver();
    }

    ngOnDestroy(): void {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }

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
        const cardElement =
            this.cardElement?.nativeElement ||
            this.elementRef.nativeElement.querySelector(".user-card");

        if (!cardElement) {
            this.loadProfilePicture();
            return;
        }

        if (typeof IntersectionObserver !== "undefined") {
            this.createIntersectionObserver(cardElement);
        } else {
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

        this.intersectionObserver = new IntersectionObserver(
            handleIntersection,
            {
                rootMargin: "100px",
                threshold: 0.01,
            },
        );

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

        if (this.profilePictureLoaded()) return;

        this.profilePictureLoaded.set(true);

        this.userService.getProfilePictureByUserId(userId).subscribe({
            next: (blob: Blob) => {
                const objectURL = URL.createObjectURL(blob);
                this.profilePictureBlobUrl.set(
                    this.sanitizer.bypassSecurityTrustUrl(objectURL),
                );
            },
            error: () => {
                this.profilePictureBlobUrl.set(this.defaultAvatar);
            },
        });
    }

    onCardClick(): void {
        this.cardClick.emit(this.user());
        this.router.navigate(["/profile", this.user().id]);
    }

    onChatClick(event: Event): void {
        event.stopPropagation(); // Prevent card click
        this.chatClick.emit(this.user());
    }

    onGiftClick(event: Event): void {
        event.stopPropagation();
        this.giftClick.emit(this.user());
    }

    onSuperLikeClick(event: Event): void {
        event.stopPropagation();

        const userId = this.user().id;
        if (!userId) return;

        if (!this.walletService.canAffordSuperLike()) {
            this.messageService.add({
                severity: "warn",
                summary: "Insufficient Balance",
                detail: `Super Like costs ${this.superLikeCost()} tokens. Please add more tokens to your account.`,
            });
            return;
        }

        this.superLikeService.sendSuperLike({ receiverId: userId }).subscribe({
            next: (_response: any) => {
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Super Like sent!",
                });
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
