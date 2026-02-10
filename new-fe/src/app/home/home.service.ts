import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";

import { AuthService } from "../services/auth.service";
import { WebsocketService } from "../services/websocket.service";
import {
    FriendsService,
    UserService,
} from "src/typescript-api-client/src/api/api";
import { UserDTO } from "src/typescript-api-client/src/model/models";

export interface HomeUser extends UserDTO {
    age?: number; // Mocked for now (will need birthDate field)
    distance?: string; // Mocked for now (needs geolocation calculation)
    isOnline?: boolean;
    isFriend?: boolean;
    // Note: bio, location, interests, isVerified, appearsInSearches, profileViewsCount, superLikesCount
    // are now part of UserDTO from the backend (or will be after API client regeneration)
    superLikesCount?: number;
}

export type FilterType = "all" | "online" | "friends" | "nearby" | "new";
export type SortType = "recent" | "new" | "distance";

export interface AdvancedFilters {
    gender?: string;
    ageMin?: number;
    ageMax?: number;
    interests?: string;
    relationshipStatus?: string;
    verifiedOnly?: boolean;
}

@Injectable({
    providedIn: "root",
})
export class HomeService implements OnDestroy {
    private usersSubject = new BehaviorSubject<HomeUser[]>([]);
    private friendIdsSubject = new BehaviorSubject<number[]>([]);
    private filterSubject = new BehaviorSubject<FilterType>("all");
    private sortSubject = new BehaviorSubject<SortType>("recent");
    private searchSubject = new BehaviorSubject<string>("");
    private advancedFiltersSubject = new BehaviorSubject<AdvancedFilters>({});
    private destroy$ = new Subject<void>();

    public users$ = this.usersSubject.asObservable();
    public filter$ = this.filterSubject.asObservable();
    public sort$ = this.sortSubject.asObservable();
    public search$ = this.searchSubject.asObservable();

    // Pagination state
    private paginationStateSubject = new BehaviorSubject<{
        currentPage: number;
        totalPages: number;
        totalUsers: number;
        hasMore: boolean;
        limit: number;
    }>({
        currentPage: 0,
        totalPages: 0,
        totalUsers: 0,
        hasMore: true,
        limit: 12,
    });
    public paginationState$ = this.paginationStateSubject.asObservable();

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private friendsService: FriendsService,
        private websocketService: WebsocketService,
    ) {
        this.initializeData();
        this.setupSuperLikesCountUpdates();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializeData(): void {
        this.loadFriends();
        this.setupProfileViewsCountUpdates();
    }

    /**
     * Listen for real-time profile views count updates via WebSocket
     * Uses the existing onProfileView event which includes the count when current user views someone's profile
     */
    private setupProfileViewsCountUpdates(): void {
        console.log(
            "[HomeService] Setting up profile views count updates listener",
        );
        this.websocketService
            .onProfileView()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    console.log(
                        "[HomeService] Received profile:view event:",
                        JSON.stringify(notification),
                    );
                    // Update count if this is a count update notification (has userId and profileViewsCount)
                    // This happens when current user views someone else's profile
                    if (
                        notification.userId &&
                        notification.profileViewsCount !== undefined
                    ) {
                        console.log(
                            `[HomeService] Updating profile views count for user ${notification.userId} to ${notification.profileViewsCount}`,
                        );
                        this.updateUserProfileViewsCount(
                            notification.userId,
                            notification.profileViewsCount,
                        );
                    } else {
                        console.log(
                            "[HomeService] Notification doesn't have userId or profileViewsCount, skipping count update. Has userId:",
                            !!notification.userId,
                            "Has profileViewsCount:",
                            notification.profileViewsCount !== undefined,
                        );
                    }
                },
                error: (error) => {
                    console.error(
                        "[HomeService] Error receiving profile view notification:",
                        error,
                    );
                },
            });
        console.log(
            "[HomeService] Profile views count updates listener set up",
        );
    }

    private updateUserProfileViewsCount(
        userId: number,
        newCount: number,
    ): void {
        const currentUsers = this.usersSubject.value;
        console.log(
            `updateUserProfileViewsCount: Updating user ${userId} to count ${newCount}, current users in list: ${currentUsers.length}`,
        );

        const userExists = currentUsers.some((u) => u.id === userId);
        if (!userExists) {
            console.log(
                `updateUserProfileViewsCount: User ${userId} not found in current users list, skipping update`,
            );
            return;
        }

        const updatedUsers = currentUsers.map((user) => {
            if (user.id === userId) {
                console.log(
                    `updateUserProfileViewsCount: Found user ${userId}, updating count from ${user.profileViewsCount} to ${newCount}`,
                );
                return {
                    ...user,
                    profileViewsCount: newCount,
                };
            }
            return user;
        });
        this.usersSubject.next(updatedUsers);
        console.log(
            `updateUserProfileViewsCount: Updated users list, new count for user ${userId}: ${updatedUsers.find((u) => u.id === userId)?.profileViewsCount}`,
        );
    }

    private setupSuperLikesCountUpdates(): void {
        this.websocketService
            .onSuperLikeReceived()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    if (
                        notification.superLikesCount !== undefined &&
                        notification.receiverId
                    ) {
                        this.updateUserSuperLikesCount(
                            notification.receiverId,
                            notification.superLikesCount,
                        );
                    }
                },
                error: (error) => {
                    console.error(
                        "Error receiving super like notification:",
                        error,
                    );
                },
            });

        this.websocketService
            .onSuperLikeSent()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    if (
                        notification.superLikesCount !== undefined &&
                        notification.receiverId
                    ) {
                        this.updateUserSuperLikesCount(
                            notification.receiverId,
                            notification.superLikesCount,
                        );
                    }
                },
                error: (error) => {
                    console.error(
                        "Error receiving super like sent notification:",
                        error,
                    );
                },
            });
    }

    private updateUserSuperLikesCount(userId: number, newCount: number): void {
        const currentUsers = this.usersSubject.value;
        const updatedUsers = currentUsers.map((user) => {
            if (user.id === userId) {
                return {
                    ...user,
                    superLikesCount: newCount,
                };
            }
            return user;
        });
        this.usersSubject.next(updatedUsers);
    }

    private isUserOnline(lastOnline?: string): boolean {
        if (!lastOnline) return false;

        const lastOnlineDate = new Date(lastOnline);
        const now = new Date();
        const diffInMinutes =
            (now.getTime() - lastOnlineDate.getTime()) / (1000 * 60);

        return diffInMinutes <= 5;
    }

    private loadFriends(): void {
        const token = localStorage.getItem("id_token");
        if (token) {
            this.friendsService.defaultHeaders =
                this.friendsService.defaultHeaders.set(
                    "Authorization",
                    `Bearer ${token}`,
                );
        }

        this.friendsService.getAcceptedFriends().subscribe({
            next: (friends: any[]) => {
                const currentEmail = this.authService.getUserEmail();
                const friendIds = friends
                    .map((f: any) => {
                        const other =
                            f.user?.email === currentEmail ? f.friend : f.user;
                        return other?.id;
                    })
                    .filter((id: number) => !!id);

                this.friendIdsSubject.next(friendIds);
                this.updateUserFriendStatus();
            },
            error: (error) => {
                console.error("Error loading friends:", error);
            },
        });
    }

    private updateUserFriendStatus(): void {
        this.paginationStateSubject.next({
            currentPage: 0,
            totalPages: 0,
            totalUsers: 0,
            hasMore: true,
            limit: this.paginationStateSubject.value.limit,
        });
        this.loadUsersPage(1).subscribe();
    }

    private enrichUserData(user: any, friendIds: number[]): HomeUser {
        return {
            ...user,
            age: this.mockAge(), // TODO: Calculate from birthDate when added
            distance: this.mockDistance(), // TODO: Calculate from location coordinates
            isOnline: this.isUserOnline(user.lastOnline),
            isFriend: friendIds.includes(user.id!),
            superLikesCount: user.superLikesCount ?? 0,
        };
    }

    // Mock data generators (TODO: Remove when real data is available)
    private mockAge(): number {
        return Math.floor(Math.random() * (45 - 18 + 1)) + 18; // 18-45
    }

    private mockDistance(): string {
        const distance = Math.floor(Math.random() * 50) + 1; // 1-50 miles
        return `${distance} mile${distance > 1 ? "s" : ""}`;
    }

    setFilter(filter: FilterType): void {
        this.filterSubject.next(filter);

        this.paginationStateSubject.next({
            currentPage: 0,
            totalPages: 0,
            totalUsers: 0,
            hasMore: true,
            limit: this.paginationStateSubject.value.limit,
        });
        this.loadUsersPage(1).subscribe();
    }

    setSort(sort: SortType): void {
        this.sortSubject.next(sort);
        
        this.paginationStateSubject.next({
            currentPage: 0,
            totalPages: 0,
            totalUsers: 0,
            hasMore: true,
            limit: this.paginationStateSubject.value.limit,
        });
        this.loadUsersPage(1).subscribe();
    }

    setSearch(search: string): void {
        this.searchSubject.next(search);
        // Reset pagination state but don't clear users until new data arrives
        this.paginationStateSubject.next({
            currentPage: 0,
            totalPages: 0,
            totalUsers: 0,
            hasMore: true,
            limit: this.paginationStateSubject.value.limit,
        });
        this.loadUsersPage(1).subscribe();
    }

    setAdvancedFilters(filters: AdvancedFilters): void {
        this.advancedFiltersSubject.next(filters);
        // Reset pagination state but don't clear users until new data arrives
        this.paginationStateSubject.next({
            currentPage: 0,
            totalPages: 0,
            totalUsers: 0,
            hasMore: true,
            limit: this.paginationStateSubject.value.limit,
        });
        this.loadUsersPage(1).subscribe();
    }

    private resetPagination(): void {
        this.usersSubject.next([]);
        this.paginationStateSubject.next({
            currentPage: 0,
            totalPages: 0,
            totalUsers: 0,
            hasMore: true,
            limit: 12,
        });
    }

    /**
     * Load users for a specific page (backend pagination)
     * @param page Page number (1-indexed)
     * @param append Whether to append to existing users or replace
     */
    public loadUsersPage(
        page: number,
        append: boolean = false,
    ): Observable<HomeUser[]> {
        const token = localStorage.getItem("id_token");
        if (token) {
            this.userService.defaultHeaders =
                this.userService.defaultHeaders.set(
                    "Authorization",
                    `Bearer ${token}`,
                );
        }

        const currentFilter = this.filterSubject.value;
        const currentSort = this.sortSubject.value;
        const currentSearch = this.searchSubject.value;
        const currentAdvancedFilters = this.advancedFiltersSubject.value;
        const limit = this.paginationStateSubject.value.limit;

        console.log(
            `loadUsersPage called - Page: ${page}, Limit: ${limit}, Filter: ${currentFilter}, Sort: ${currentSort}, Search: ${currentSearch}, Advanced: ${JSON.stringify(currentAdvancedFilters)}`,
        );
        return new Observable((observer) => {
            // Use the generated API client with advanced filters
            this.userService
                .getAll(
                    page,
                    limit,
                    currentFilter,
                    currentSort,
                    currentSearch,
                    currentAdvancedFilters.gender || "",
                    currentAdvancedFilters.ageMin || 0,
                    currentAdvancedFilters.ageMax || 0,
                    currentAdvancedFilters.interests || "",
                    currentAdvancedFilters.relationshipStatus || "",
                    currentAdvancedFilters.verifiedOnly || false,
                )
                .subscribe({
                    next: (response: any) => {
                        console.log(
                            `loadUsersPage - API response for page ${page}:`,
                            response,
                        );

                        const friendIds = this.friendIdsSubject.value;

                        const homeUsers: HomeUser[] = response.users.map(
                            (user: any) => this.enrichUserData(user, friendIds),
                        );

                        // Update pagination state
                        console.log(`Frontend - Updating pagination state:`, {
                            currentPage: response.page,
                            totalPages: response.totalPages,
                            totalUsers: response.totalUsers,
                            hasMore: response.hasMore,
                            limit: response.limit,
                        });

                        this.paginationStateSubject.next({
                            currentPage: response.page,
                            totalPages: response.totalPages,
                            totalUsers: response.totalUsers,
                            hasMore: response.hasMore,
                            limit: response.limit,
                        });

                        // Either append or replace users
                        if (append) {
                            const existingUsers = this.usersSubject.value;
                            this.usersSubject.next([
                                ...existingUsers,
                                ...homeUsers,
                            ]);
                        } else {
                            this.usersSubject.next(homeUsers);
                        }

                        observer.next(homeUsers);
                        observer.complete();
                    },
                    error: (error) => {
                        console.error("Error loading users:", error);
                        observer.error(error);
                    },
                });
        });
    }

    /**
     * Load next page of users (for infinite scroll)
     */
    public loadNextPage(): Observable<HomeUser[]> {
        const currentState = this.paginationStateSubject.value;
        console.log("loadNextPage called - current state:", currentState);

        if (!currentState.hasMore) {
            console.log("loadNextPage - No more data available");
            return new Observable((observer) => {
                observer.next([]);
                observer.complete();
            });
        }

        const nextPage = Number(currentState.currentPage) + 1;
        console.log(`loadNextPage - Loading page ${nextPage}`);
        return this.loadUsersPage(nextPage, true); // Append to existing users
    }

    getFilteredAndSortedUsers(): Observable<HomeUser[]> {
        // Don't clear users immediately - let the new data replace them
        // This prevents the UI from flashing empty state
        this.paginationStateSubject.next({
            currentPage: 0,
            totalPages: 0,
            totalUsers: 0,
            hasMore: true,
            limit: this.paginationStateSubject.value.limit,
        });
        return this.loadUsersPage(1);
    }

    getPaginatedUsers(
        allUsers: HomeUser[],
        page: number,
        pageSize: number,
    ): HomeUser[] {
        const start = page * pageSize;
        const end = start + pageSize;
        return allUsers.slice(start, end);
    }

    getOnlineCount(): Observable<number> {
        return this.users$.pipe(
            map((users) => users.filter((u) => u.isOnline).length),
        );
    }

    refreshData(): void {
        this.loadFriends();
        // Reset pagination state but don't clear users until new data arrives
        this.paginationStateSubject.next({
            currentPage: 0,
            totalPages: 0,
            totalUsers: 0,
            hasMore: true,
            limit: this.paginationStateSubject.value.limit,
        });
        this.loadUsersPage(1).subscribe();
    }
}
