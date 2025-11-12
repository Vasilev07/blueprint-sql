import { Component, Input, Output, EventEmitter } from "@angular/core";
import { User } from "./chat.service";

@Component({
    selector: "app-friends-list",
    templateUrl: "./friends-list.component.html",
    styleUrls: ["./friends-list.component.scss"],
})
export class FriendsListComponent {
    @Input() friends: User[] = [];
    @Input() compact: boolean = false;
    @Output() friendClick = new EventEmitter<string>();

    onFriendClick(friendId: string): void {
        this.friendClick.emit(friendId);
    }

    getStatusIcon(friend: User): string {
        return friend.isOnline
            ? "pi pi-circle-fill online"
            : "pi pi-circle offline";
    }

    getStatusText(friend: User): string {
        return friend.isOnline ? "Online" : "Offline";
    }

    getLastSeenText(friend: User): string {
        if (friend.isOnline) return "";
        if (!friend.lastSeen) return "Unknown";

        const now = new Date();
        const diff = now.getTime() - friend.lastSeen.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
}
