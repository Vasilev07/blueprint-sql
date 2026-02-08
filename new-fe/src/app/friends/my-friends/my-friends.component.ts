import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FriendsService } from "src/typescript-api-client/src/api/api";
import { FriendDTO } from "src/typescript-api-client/src/model/models";
import { WebsocketService } from "../../services/websocket.service";
import { PresenceService } from "../../services/presence.service";
import { Subject, takeUntil } from "rxjs";
import { AvatarModule } from "primeng/avatar";

@Component({
    selector: "app-my-friends",
    standalone: true,
    imports: [CommonModule, AvatarModule],
    templateUrl: "./my-friends.component.html",
    styleUrls: ["./my-friends.component.scss"],
})
export class MyFriendsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    myFriends: FriendDTO[] = [];
    currentUserId: number = 0;

    constructor(
        private friendsService: FriendsService,
        private websocketService: WebsocketService,
        public presenceService: PresenceService,
    ) {}

    ngOnInit() {
        this.getCurrentUserId();
        this.loadMyFriends();

        // Listen for friend list updates
        this.websocketService
            .onFriendListUpdated()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.loadMyFriends();
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getCurrentUserId() {
        const token = localStorage.getItem("id_token");
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                this.currentUserId = decoded.id;
            } catch (error) {
                console.error("Error decoding token:", error);
            }
        }
    }

    loadMyFriends() {
        this.friendsService.getAcceptedFriends().subscribe({
            next: (friends) => {
                this.myFriends = friends;
            },
            error: (error) => {
                console.error("Error loading friends:", error);
            },
        });
    }

    getFriendDisplayName(friend: any): string {
        if (friend.user && friend.user.id !== this.currentUserId) {
            return `${friend.user.firstname} ${friend.user.lastname}`;
        } else if (friend.friend && friend.friend.id !== this.currentUserId) {
            return `${friend.friend.firstname} ${friend.friend.lastname}`;
        }
        return "Unknown Friend";
    }

    getFriendInitials(friend: any): string {
        if (friend.user && friend.user.id !== this.currentUserId) {
            return `${friend.user.firstname?.charAt(0)}${friend.user.lastname?.charAt(0)}`;
        } else if (friend.friend && friend.friend.id !== this.currentUserId) {
            return `${friend.friend.firstname?.charAt(0)}${friend.friend.lastname?.charAt(0)}`;
        }
        return "F";
    }

    getFriendEmail(friend: any): string {
        if (friend.user && friend.user.id !== this.currentUserId) {
            return friend.user.email;
        } else if (friend.friend && friend.friend.id !== this.currentUserId) {
            return friend.friend.email;
        }
        return "";
    }
}
