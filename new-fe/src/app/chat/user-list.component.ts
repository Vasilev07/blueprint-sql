import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { User } from "./chat.service";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";

@Component({
    selector: "app-user-list",
    standalone: true,
    imports: [CommonModule, AvatarModule, ButtonModule],
    templateUrl: "./user-list.component.html",
    styleUrls: ["./user-list.component.scss"],
})
export class UserListComponent {
    @Input() users: User[] = [];
    @Input() compact: boolean = false;
    @Output() userClick = new EventEmitter<string>();

    onUserClick(userId: string): void {
        this.userClick.emit(userId);
    }

    getStatusIcon(user: User): string {
        return user.isOnline
            ? "pi pi-circle-fill online"
            : "pi pi-circle offline";
    }

    getStatusText(user: User): string {
        return user.isOnline ? "Online" : "Offline";
    }

    getLastSeenText(user: User): string {
        if (user.isOnline) return "";
        if (!user.lastSeen) return "Unknown";

        const now = new Date();
        const diff = now.getTime() - user.lastSeen.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
}
