import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from "@angular/core";
import { HomeUser } from "../home.service";
import { Router } from "@angular/router";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { Subject, takeUntil } from "rxjs";
import { UserService, SuperLikeService } from "src/typescript-api-client/src/api/api";
import { MessageService } from "primeng/api";
import { SendSuperLikeRequestDTO } from "src/typescript-api-client/src";

@Component({
    selector: "app-user-card",
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
    private destroy$ = new Subject<void>();

    constructor(
        private router: Router,
        private userService: UserService,
        private superLikeService: SuperLikeService,
        private sanitizer: DomSanitizer,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        // Load profile picture with authentication
        if (this.user.id) {
            this.loadProfilePicture();
        }
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
        console.log('this.user.id', this.user.id);

        if (!this.user.id) return;

        // Type assertion needed until backend regenerates TypeScript client with DTO support
        // Once regenerated, this will be: this.superLikeService.sendSuperLike({ receiverId: this.user.id })
        console.log('this.user.id', this.user.id);
        
        this.superLikeService.sendSuperLike({ receiverId: this.user.id })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Super Like sent!' });
                },
                error: (err: any) => {
                    const errorMsg = err.error?.message || 'Failed to send Super Like';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
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
}