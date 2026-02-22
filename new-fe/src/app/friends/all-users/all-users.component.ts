import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MessageService } from "primeng/api";
import {
    UserService,
    FriendsService,
} from "src/typescript-api-client/src/api/api";
import { UserDTO } from "src/typescript-api-client/src/model/models";
import { WebsocketService } from "../../services/websocket.service";
import { ButtonModule } from "primeng/button";
import { AvatarModule } from "primeng/avatar";

@Component({
    selector: "app-all-users",
    standalone: true,
    imports: [ButtonModule, AvatarModule],
    templateUrl: "./all-users.component.html",
    styleUrls: ["./all-users.component.scss"],
})
export class AllUsersComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly userService = inject(UserService);
    private readonly friendsService = inject(FriendsService);
    private readonly messageService = inject(MessageService);
    private readonly websocketService = inject(WebsocketService);

    readonly users = signal<UserDTO[]>([]);
    readonly loading = signal(true);
    readonly friendRequests = signal<Map<number, string>>(new Map());
    readonly currentUserId = signal<number>(0);

    ngOnInit() {
        this.applyAuthHeadersToApiServices();
        this.setCurrentUserIdFromToken();
        this.loadUsers();

        this.websocketService
            .onFriendRequestUpdated()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.loadFriendshipStatuses());

        this.websocketService
            .onFriendListUpdated()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.loadFriendshipStatuses());
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

    private setCurrentUserIdFromToken() {
        const token = localStorage.getItem("id_token");
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                this.currentUserId.set(decoded.id);
            } catch (error) {
                console.error("Error decoding token:", error);
            }
        }
    }

    loadUsers() {
        this.loading.set(true);
        this.userService
            .getAll(1, 1000, "all", "recent", "", "", 0, 100, "", "", false)
            .subscribe({
                next: async (response: any) => {
                    const userList = response.users || [];
                    await this.loadFriendshipStatuses();
                    this.users.set(userList);
                    this.loading.set(false);
                },
                error: () => {
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load users",
                    });
                    this.loading.set(false);
                },
            });
    }

    async loadFriendshipStatuses() {
        try {
            const statusMap = (await this.friendsService
                .getBatchFriendshipStatuses()
                .toPromise()) as Record<string, string> | undefined;

            const next = new Map<number, string>();
            if (statusMap && typeof statusMap === "object") {
                Object.entries(statusMap).forEach(
                    ([userIdStr, status]: [string, string]) => {
                        next.set(Number(userIdStr), status ?? "none");
                    },
                );
            }
            this.friendRequests.set(next);
        } catch (error) {
            console.error("Error loading batch friendship statuses:", error);
        }
    }

    getButtonClass(userId: number): string {
        const status = this.friendRequests().get(userId);
        if (status === "pending") return "p-button-warning";
        if (status === "accepted") return "p-button-success";
        if (status === "blocked") return "p-button-danger";
        if (status === null || status === undefined) return "p-button-primary";
        return "p-button-primary";
    }

    getButtonLabel(userId: number): string {
        const status = this.friendRequests().get(userId);
        if (status === "pending") return "Request Sent";
        if (status === "accepted") return "Friends";
        if (status === "blocked") return "Blocked";
        if (status === null || status === undefined) return "Add Friend";
        return "Add Friend";
    }

    sendFriendRequest(userId: number) {
        if (!userId) return;

        if (userId === this.currentUserId()) {
            this.messageService.add({
                severity: "warn",
                summary: "Invalid Action",
                detail: "Cannot send friend request to yourself",
            });
            return;
        }

        this.friendsService.sendFriendRequest(userId).subscribe({
            next: () => {
                this.friendRequests.update((m) => {
                    const next = new Map(m);
                    next.set(userId, "pending");
                    return next;
                });
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Friend request sent!",
                });
            },
            error: (error) => {
                console.error("Error sending friend request:", error);
                const errorMessage =
                    error?.error?.message ||
                    error?.message ||
                    "Failed to send friend request";
                this.messageService.add({
                    severity: "warn",
                    summary: "Cannot Send Request",
                    detail: errorMessage,
                });
            },
        });
    }
}
