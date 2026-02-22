import { Component, DestroyRef, inject, output, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { MessageService } from "primeng/api";
import { FriendsService } from "src/typescript-api-client/src/api/api";
import { FriendDTO } from "src/typescript-api-client/src/model/models";
import { WebsocketService } from "../../services/websocket.service";
import { PresenceService } from "../../services/presence.service";
import { switchMap } from "rxjs/operators";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from "primeng/progressspinner";

@Component({
    selector: "app-friend-requests",
    standalone: true,
    imports: [CommonModule, AvatarModule, ButtonModule, ProgressSpinnerModule],
    templateUrl: "./friend-requests.component.html",
    styleUrls: ["./friend-requests.component.scss"],
})
export class FriendRequestsComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly friendsService = inject(FriendsService);
    private readonly messageService = inject(MessageService);
    private readonly websocketService = inject(WebsocketService);

    readonly incomingRequests = signal<FriendDTO[]>([]);
    readonly loading = signal(true);
    readonly requestCountChange = output<number>();

    constructor(public presenceService: PresenceService) {
        this.applyAuthHeaders();
        this.loadIncomingRequests();

        this.websocketService
            .onFriendRequestCreated()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.loadIncomingRequests();
            });
    }

    private applyAuthHeaders() {
        const token = localStorage.getItem("id_token");
        if (token) {
            const authHeader = `Bearer ${token}`;
            this.friendsService.defaultHeaders =
                this.friendsService.defaultHeaders.set(
                    "Authorization",
                    authHeader,
                );
        }
    }

    loadIncomingRequests() {
        this.loading.set(true);
        this.friendsService.getIncomingRequests().subscribe({
            next: (requests) => {
                this.incomingRequests.set(requests);
                this.requestCountChange.emit(requests.length);
                this.loading.set(false);
            },
            error: (error) => {
                console.error("Error loading incoming requests:", error);
                this.requestCountChange.emit(0);
                this.loading.set(false);
            },
        });
    }

    acceptFriendRequest(friendId: number) {
        this.friendsService
            .respondToRequest(friendId, { status: "accepted" } as any)
            .pipe(switchMap(() => this.friendsService.getIncomingRequests()))
            .subscribe({
                next: (incoming) => {
                    this.incomingRequests.set(incoming);
                    this.requestCountChange.emit(incoming.length);
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Friend request accepted!",
                    });
                },
                error: (error) => {
                    console.error("Error accepting friend request:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to accept friend request",
                    });
                },
            });
    }

    declineFriendRequest(friendId: number) {
        this.friendsService
            .respondToRequest(friendId, { status: "blocked" } as any)
            .pipe(switchMap(() => this.friendsService.getIncomingRequests()))
            .subscribe({
                next: (incoming) => {
                    this.incomingRequests.set(incoming);
                    this.requestCountChange.emit(incoming.length);
                    this.messageService.add({
                        severity: "info",
                        summary: "Declined",
                        detail: "Friend request declined",
                    });
                },
                error: (error) => {
                    console.error("Error declining friend request:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to decline friend request",
                    });
                },
            });
    }

    getUserFullName(
        user: { firstname?: string; lastname?: string } | null | undefined,
    ): string {
        if (user?.firstname && user?.lastname) {
            return `${user.firstname} ${user.lastname}`;
        }
        return "Unknown User";
    }

    getUserInitials(
        user: { firstname?: string; lastname?: string } | null | undefined,
    ): string {
        if (user?.firstname && user?.lastname) {
            return `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`;
        }
        return "U";
    }
}
