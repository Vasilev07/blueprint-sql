import {
    Component,
    OnInit,
    OnDestroy,
    Output,
    EventEmitter,
} from "@angular/core";
import { MessageService } from "primeng/api";
import { FriendsService } from "src/typescript-api-client/src/api/api";
import { FriendDTO } from "src/typescript-api-client/src/model/models";
import { WebsocketService } from "../../services/websocket.service";
import { PresenceService } from "../../services/presence.service";
import { Subject, takeUntil } from "rxjs";
import { switchMap } from "rxjs/operators";

@Component({
    selector: "app-friend-requests",
    templateUrl: "./friend-requests.component.html",
    styleUrls: ["./friend-requests.component.scss"],
})
export class FriendRequestsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    incomingRequests: FriendDTO[] = [];

    @Output() requestCountChange = new EventEmitter<number>();

    constructor(
        private friendsService: FriendsService,
        private messageService: MessageService,
        private websocketService: WebsocketService,
        public presenceService: PresenceService,
    ) {}

    ngOnInit() {
        this.applyAuthHeaders();
        this.loadIncomingRequests();

        // Listen for new friend requests
        this.websocketService
            .onFriendRequestCreated()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.loadIncomingRequests();
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
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
        this.friendsService.getIncomingRequests().subscribe({
            next: (requests) => {
                this.incomingRequests = requests;
                this.requestCountChange.emit(requests.length);
            },
            error: (error) => {
                console.error("Error loading incoming requests:", error);
                this.requestCountChange.emit(0);
            },
        });
    }

    acceptFriendRequest(friendId: number) {
        this.friendsService
            .respondToRequest(friendId, { status: "accepted" } as any)
            .pipe(switchMap(() => this.friendsService.getIncomingRequests()))
            .subscribe({
                next: (incoming) => {
                    this.incomingRequests = incoming;
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
                    this.incomingRequests = incoming;
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

    getUserFullName(user: any): string {
        if (user && user.firstname && user.lastname) {
            return `${user.firstname} ${user.lastname}`;
        }
        return "Unknown User";
    }

    getUserInitials(user: any): string {
        if (user && user.firstname && user.lastname) {
            return `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`;
        }
        return "U";
    }
}
