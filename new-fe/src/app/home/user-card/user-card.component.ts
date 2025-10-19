import { Component, Input, Output, EventEmitter } from "@angular/core";
import { HomeUser } from "../home.service";
import { Router } from "@angular/router";

@Component({
    selector: "app-user-card",
    templateUrl: "./user-card.component.html",
    styleUrls: ["./user-card.component.scss"],
})
export class UserCardComponent {
    @Input() user!: HomeUser;
    @Output() chatClick = new EventEmitter<HomeUser>();
    @Output() cardClick = new EventEmitter<HomeUser>();

    // SVG data URL for default avatar - no external file needed
    defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

    constructor(private router: Router) {}

    onCardClick(): void {
        this.cardClick.emit(this.user);
        // Navigate to user profile
        this.router.navigate(["/profile", this.user.id]);
    }

    onChatClick(event: Event): void {
        event.stopPropagation(); // Prevent card click
        this.chatClick.emit(this.user);
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

    getProfilePicture(): string {
        return this.user.profilePictureUrl || this.defaultAvatar;
    }

    onImageError(event: Event): void {
        (event.target as HTMLImageElement).src = this.defaultAvatar;
    }
}
