import { Component, OnInit } from "@angular/core";
import { MessageService } from "primeng/api";
import { UserService } from "src/typescript-api-client/src/api/api";
import { FriendsService } from "src/typescript-api-client/src/api/api";
import { UserDTO, FriendDTO } from "src/typescript-api-client/src/model/models";
import { AuthService } from "../services/auth.service";
import { WebsocketService } from "../services/websocket.service";
import { PresenceService } from "../services/presence.service";

@Component({
    selector: "app-friends",
    templateUrl: "./friends.component.html",
    styleUrls: ["./friends.component.scss"],
})
export class FriendsComponent implements OnInit {
    users: UserDTO[] = [];
    loading = true;
    friendRequests: Map<number, string> = new Map(); // Tracks request status per user
    incomingRequests: FriendDTO[] = []; // Incoming friend requests
    myFriends: FriendDTO[] = []; // Accepted friends
    currentUserId: number = 0;
    currentUserEmail: string = "";

    constructor(
        private userService: UserService,
        private friendsService: FriendsService,
        private messageService: MessageService,
        private authService: AuthService,
        private websocketService: WebsocketService,
        public presenceService: PresenceService,
    ) {}

    ngOnInit() {
        this.applyAuthHeadersToApiServices();
        this.getCurrentUserId();
        this.loadUsers();
        this.loadIncomingRequests();
        this.loadMyFriends();

        // Realtime updates
        this.websocketService.onFriendRequestCreated().subscribe(() => {
            this.loadIncomingRequests();
        });
        this.websocketService.onFriendRequestUpdated().subscribe(() => {
            this.loadIncomingRequests();
            this.loadFriendshipStatuses();
        });
        this.websocketService.onFriendListUpdated().subscribe(() => {
            this.loadMyFriends();
            this.loadFriendshipStatuses();
        });
    }

    getCurrentUserId() {
        // Get current user ID from token or user service
        const token = localStorage.getItem("id_token");
        this.currentUserEmail = this.authService.getUserEmail();
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                this.currentUserId = decoded.id;
            } catch (error) {
                console.error("Error decoding token:", error);
            }
        }
    }

    private applyAuthHeadersToApiServices() {
        const token = localStorage.getItem('id_token');
        if (token) {
            const authHeader = `Bearer ${token}`;
            this.userService.defaultHeaders = this.userService.defaultHeaders.set('Authorization', authHeader);
            this.friendsService.defaultHeaders = this.friendsService.defaultHeaders.set('Authorization', authHeader);
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

    getButtonClass(userId: number): string {
        switch (this.friendRequests.get(userId)) {
            case "pending":
                return "p-button-warning";
            case "accepted":
                return "p-button-success";
            case "blocked":
                return "p-button-danger";
            default:
                return "p-button-primary";
        }
    }

    getButtonLabel(userId: number): string {
        switch (this.friendRequests.get(userId)) {
            case "pending":
                return "Request Sent";
            case "accepted":
                return "Friends";
            case "blocked":
                return "Blocked";
            default:
                return "Add Friend";
        }
    }

    async loadFriendshipStatuses() {
        for (const user of this.users) {
            if (user.id) {
                try {
                    const status = await this.friendsService.getFriendshipStatus(user.id).toPromise();
                    this.friendRequests.set(user.id, status ?? "");
                } catch (error) {
                    console.error("Error loading friendship status:", error);
                    this.friendRequests.set(user.id, "");
                }
            }
        }
    }

    sendFriendRequest(userId: number) {
        if (!userId) return;

        // Prevent self-friending
        if (userId === this.currentUserId) {
            this.messageService.add({
                severity: "warn",
                summary: "Invalid Action",
                detail: "Cannot send friend request to yourself",
            });
            return;
        }

        this.friendsService.sendFriendRequest(userId)
            .subscribe({
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

                    // Extract error message from response
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

    loadIncomingRequests() {
        this.friendsService.getIncomingRequests().subscribe({
            next: (requests: any) => {
                this.incomingRequests = requests;
            },
            error: (error) => {
                console.error("Error loading incoming requests:", error);
            },
        });
    }

    loadMyFriends() {
        this.friendsService.getAcceptedFriends().subscribe({
            next: (friends: any) => {
                this.myFriends = friends;
            },
            error: (error) => {
                console.error("Error loading friends:", error);
            },
        });
    }

    acceptFriendRequest(friendId: number) {
        this.friendsService.respondToRequest(friendId)
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Friend request accepted!",
                    });
                    this.loadIncomingRequests();
                    this.loadMyFriends();
                    this.loadFriendshipStatuses(); // Refresh friendship statuses
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
        this.friendsService.respondToRequest(friendId)
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: "info",
                        summary: "Declined",
                        detail: "Friend request declined",
                    });
                    this.loadIncomingRequests();
                    this.loadFriendshipStatuses(); // Refresh friendship statuses
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
