import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { FriendsService } from "src/typescript-api-client/src/api/api";
import { FriendDTO } from "src/typescript-api-client/src/model/models";
import { WebsocketService } from "../../services/websocket.service";
import { PresenceService } from "../../services/presence.service";
import { AvatarModule } from "primeng/avatar";
import { ProgressSpinnerModule } from "primeng/progressspinner";

@Component({
    selector: "app-my-friends",
    standalone: true,
    imports: [CommonModule, AvatarModule, ProgressSpinnerModule],
    templateUrl: "./my-friends.component.html",
    styleUrls: ["./my-friends.component.scss"],
})
export class MyFriendsComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly friendsService = inject(FriendsService);
    private readonly websocketService = inject(WebsocketService);

    readonly myFriends = signal<FriendDTO[]>([]);
    readonly loading = signal(true);
    readonly currentUserId = signal(0);

    constructor(public presenceService: PresenceService) {
        this.setCurrentUserIdFromToken();
        this.loadMyFriends();

        this.websocketService
            .onFriendListUpdated()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.loadMyFriends());
    }

    private setCurrentUserIdFromToken(): void {
        const token = localStorage.getItem("id_token");
        if (!token) return;
        try {
            const decoded = JSON.parse(atob(token.split(".")[1])) as {
                id?: number;
            };
            if (decoded?.id != null) {
                this.currentUserId.set(decoded.id);
            }
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    }

    loadMyFriends(): void {
        this.loading.set(true);
        this.friendsService.getAcceptedFriends().subscribe({
            next: (friends) => {
                this.myFriends.set(friends);
                this.loading.set(false);
            },
            error: (error) => {
                console.error("Error loading friends:", error);
                this.loading.set(false);
            },
        });
    }

    getFriendDisplayName(friend: FriendDTO): string {
        const id = this.currentUserId();
        if (friend.user && friend.user.id !== id) {
            return `${friend.user.firstname} ${friend.user.lastname}`;
        }
        if (friend.friend && friend.friend.id !== id) {
            return `${friend.friend.firstname} ${friend.friend.lastname}`;
        }
        return "Unknown Friend";
    }

    getFriendInitials(friend: FriendDTO): string {
        const id = this.currentUserId();
        if (friend.user && friend.user.id !== id) {
            const f = friend.user.firstname;
            const l = friend.user.lastname;
            return `${f?.charAt(0) ?? ""}${l?.charAt(0) ?? ""}` || "F";
        }
        if (friend.friend && friend.friend.id !== id) {
            const f = friend.friend.firstname;
            const l = friend.friend.lastname;
            return `${f?.charAt(0) ?? ""}${l?.charAt(0) ?? ""}` || "F";
        }
        return "F";
    }

    getFriendEmail(friend: FriendDTO): string {
        const id = this.currentUserId();
        if (friend.user && friend.user.id !== id)
            return friend.user.email ?? "";
        if (friend.friend && friend.friend.id !== id) {
            return friend.friend.email ?? "";
        }
        return "";
    }
}
