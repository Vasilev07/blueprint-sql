import { Component, OnInit, OnDestroy } from "@angular/core";
import { MessageService } from "primeng/api";
import { UserService, FriendsService } from "src/typescript-api-client/src/api/api";
import { UserDTO } from "src/typescript-api-client/src/model/models";
import { AuthService } from "../../services/auth.service";
import { WebsocketService } from "../../services/websocket.service";
import { Subject, takeUntil } from "rxjs";

@Component({
    selector: "app-all-users",
    templateUrl: "./all-users.component.html",
    styleUrls: ["./all-users.component.scss"],
})
export class AllUsersComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    users: UserDTO[] = [];
    loading = true;
    friendRequests: Map<number, string> = new Map();
    currentUserId: number = 0;

    constructor(
        private userService: UserService,
        private friendsService: FriendsService,
        private messageService: MessageService,
        private authService: AuthService,
        private websocketService: WebsocketService,
    ) {}

    ngOnInit() {
        this.applyAuthHeadersToApiServices();
        this.getCurrentUserId();
        this.loadUsers();

        // Listen for friendship changes and reload statuses
        this.websocketService.onFriendRequestUpdated()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.loadFriendshipStatuses();
            });
        
        this.websocketService.onFriendListUpdated()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.loadFriendshipStatuses();
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private applyAuthHeadersToApiServices() {
        const token = localStorage.getItem("id_token");
        if (token) {
            const authHeader = `Bearer ${token}`;
            this.userService.defaultHeaders = this.userService.defaultHeaders.set("Authorization", authHeader);
            this.friendsService.defaultHeaders = this.friendsService.defaultHeaders.set("Authorization", authHeader);
        }
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

    loadUsers() {
        this.loading = true;
        this.userService.getAll().subscribe({
            next: async (users) => {
                this.users = users;
                await this.loadFriendshipStatuses();
                this.loading = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to load users",
                });
                this.loading = false;
            },
        });
    }

    async loadFriendshipStatuses() {
        console.log('Loading friendship statuses for', this.users.length, 'users');
        for (const user of this.users) {
            if (user.id && user.id !== this.currentUserId) {
                try {
                    const status = await this.friendsService.getFriendshipStatus(user.id).toPromise();
                    console.log(`Status for user ${user.id} (${user.fullName}):`, status);
                    this.friendRequests.set(user.id, status ?? "none");
                } catch (error) {
                    console.error(`Error loading friendship status for user ${user.id}:`, error);
                    this.friendRequests.set(user.id, "none");
                }
            }
        }
        console.log('Friendship statuses map:', this.friendRequests);
    }

    getButtonClass(userId: number): string {
        const status = this.friendRequests.get(userId);
        switch (status) {
            case "pending":
                return "p-button-warning";
            case "accepted":
                return "p-button-success";
            case "blocked":
                return "p-button-danger";
            case "none":
            case null:
            case undefined:
            case "":
                return "p-button-primary";
            default:
                console.warn(`Unknown friendship status: ${status}`);
                return "p-button-primary";
        }
    }

    getButtonLabel(userId: number): string {
        const status = this.friendRequests.get(userId);
        switch (status) {
            case "pending":
                return "Request Sent";
            case "accepted":
                return "Friends";
            case "blocked":
                return "Blocked";
                case "none":
            case null:
            case undefined:
            case "":
                return "Add Friend";
            default:
                console.warn(`Unknown friendship status: ${status}`);
                return "Add Friend";
        }
    }

    sendFriendRequest(userId: number) {
        if (!userId) return;

        if (userId === this.currentUserId) {
            this.messageService.add({
                severity: "warn",
                summary: "Invalid Action",
                detail: "Cannot send friend request to yourself",
            });
            return;
        }

        this.friendsService.sendFriendRequest(userId).subscribe({
            next: () => {
                this.friendRequests.set(userId, "pending");
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Friend request sent!",
                });
            },
            error: (error) => {
                console.error("Error sending friend request:", error);
                let errorMessage = "Failed to send friend request";
                if (error.error && error.error.message) {
                    errorMessage = error.error.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                this.messageService.add({
                    severity: "warn",
                    summary: "Cannot Send Request",
                    detail: errorMessage,
                });
            },
        });
    }
}

