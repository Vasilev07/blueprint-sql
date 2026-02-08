import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Message, User } from "./chat.service";
import { AvatarModule } from "primeng/avatar";

@Component({
    selector: "app-recent-messages",
    standalone: true,
    imports: [CommonModule, AvatarModule],
    templateUrl: "./recent-messages.component.html",
    styleUrls: ["./recent-messages.component.scss"],
})
export class RecentMessagesComponent {
    @Input() messages: Message[] = [];
    @Input() users: User[] = []; // Real user data from backend
    @Output() messageClick = new EventEmitter<string>();

    onMessageClick(userId: string): void {
        this.messageClick.emit(userId);
    }

    getMessagePreview(content: string): string {
        return content.length > 50 ? content.substring(0, 50) + "..." : content;
    }

    formatTime(date: Date | undefined): string {
        if (!date) return "";
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    getUserName(userId: string): string {
        const user = this.users.find((u) => String(u.id) === String(userId));
        return user?.name || user?.fullName || user?.email || "Unknown User";
    }

    getUserAvatar(userId: string): string | undefined {
        const user = this.users.find((u) => String(u.id) === String(userId));
        return user?.avatar;
    }

    getUserInitial(userId: string): string {
        const name = this.getUserName(userId);
        return name?.charAt(0)?.toUpperCase() || "?";
    }

    isUserOnline(userId: string): boolean {
        const user = this.users.find((u) => String(u.id) === String(userId));
        return user?.isOnline || false;
    }

    getMessageIcon(message: Message): string {
        switch (message.type) {
            case "image":
                return "pi pi-image";
            case "file":
                return "pi pi-file";
            default:
                return "pi pi-comment";
        }
    }
}
