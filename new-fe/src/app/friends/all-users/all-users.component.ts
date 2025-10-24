import { Component, OnInit, OnDestroy } from "@angular/core";
import { MessageService } from "primeng/api";
import {
    UserService,
    FriendsService,
} from "src/typescript-api-client/src/api/api";
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
        this.websocketService
            .onFriendRequestUpdated()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                console.log(
                    "Friend request updated event received - reloading statuses",
                );
                this.loadFriendshipStatuses();
            });

        this.websocketService
            .onFriendListUpdated()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                console.log(
                    "Friend list updated event received - reloading statuses",
                );
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
            this.userService.defaultHeaders =
                this.userService.defaultHeaders.set(
                    "Authorization",
                    authHeader,
                );
            this.friendsService.defaultHeaders =
                this.friendsService.defaultHeaders.set(
                    "Authorization",
                    authHeader,
                );
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
        // Fetch all users with a large limit (no pagination for friends list)
        this.userService
            .getAll(1, 1000, "all", "recent", "", "", 0, 100, "", "", false)
            .subscribe({
                next: async (response: any) => {
                    this.users = response.users || [];
                    await this.loadFriendshipStatuses();
                    this.loading = false;
                },
                error: () => {
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
        console.log("Loading friendship statuses in batch");
        try {
            const statusMap = (await this.friendsService
                .getBatchFriendshipStatuses()
                .toPromise()) as any;

            console.log("Batch statuses received:", statusMap);

            // Clear existing statuses
            this.friendRequests.clear();

            // Set statuses from the batch response
            if (statusMap && typeof statusMap === "object") {
                Object.entries(statusMap).forEach(
                    ([userIdStr, status]: [string, any]) => {
                        const userId = Number(userIdStr);
                        this.friendRequests.set(userId, status ?? "none");
                    },
                );
            }

            console.log(
                "Friendship statuses map after batch load:",
                this.friendRequests,
            );
        } catch (error) {
            console.error("Error loading batch friendship statuses:", error);
        }
    }

    getButtonClass(userId: number): string {
        const status = this.friendRequests.get(userId);
        if (status === "pending") return "p-button-warning";
        if (status === "accepted") return "p-button-success";
        if (status === "blocked") return "p-button-danger";
        if (status === null || status === undefined) return "p-button-primary";
        console.warn(`Unknown friendship status: ${status} for user ${userId}`);
        return "p-button-primary";
    }

    getButtonLabel(userId: number): string {
        const status = this.friendRequests.get(userId);
        if (status === "pending") return "Request Sent";
        if (status === "accepted") return "Friends";
        if (status === "blocked") return "Blocked";
        if (status === null || status === undefined) return "Add Friend";
        console.warn(`Unknown friendship status: ${status} for user ${userId}`);
        return "Add Friend";
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
