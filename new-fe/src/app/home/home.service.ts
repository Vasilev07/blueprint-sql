import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";

import { AuthService } from "../services/auth.service";
import {
    FriendsService,
    UserService,
} from "src/typescript-api-client/src/api/api";
import { UserDTO } from "src/typescript-api-client/src/model/models";

export interface HomeUser extends UserDTO {
    // Computed/UI fields
    age?: number; // Mocked for now (will need birthDate field)
    bio?: string; // From user profile
    location?: string; // From user profile
    interests?: string[]; // From user profile
    distance?: string; // Mocked for now (needs geolocation calculation)
    isOnline?: boolean;
    isFriend?: boolean;
    verified?: boolean; // Mocked for now (will need verified field)
    appearsInSearches?: boolean; // From user profile
    profileViewsCount?: number; // Real profile views count
}

export type FilterType = "all" | "online" | "friends" | "nearby" | "new";
export type SortType = "recent" | "new" | "distance";

@Injectable({
    providedIn: "root",
})
export class HomeService {
    private usersSubject = new BehaviorSubject<HomeUser[]>([]);
    private friendIdsSubject = new BehaviorSubject<number[]>([]);
    private filterSubject = new BehaviorSubject<FilterType>("all");
    private sortSubject = new BehaviorSubject<SortType>("recent");
    private searchSubject = new BehaviorSubject<string>("");

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
    ) {
        this.initializeData();
    }

    private initializeData(): void {
        this.loadFriends();
    }

    /**
     * Check if user is online based on lastOnline timestamp
     * Consider online if last seen within 5 minutes
     */
    private isUserOnline(lastOnline?: string): boolean {
        if (!lastOnline) return false;

        const lastOnlineDate = new Date(lastOnline);
        const now = new Date();
        const diffInMinutes =
            (now.getTime() - lastOnlineDate.getTime()) / (1000 * 60);

        return diffInMinutes <= 5; // Online if seen in last 5 minutes
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
        // Reload users to reflect friend status changes
        this.resetPagination();
        this.loadUsersPage(1).subscribe();
    }

    private enrichUserData(user: any, friendIds: number[]): HomeUser {
        return {
            ...user,
            age: this.mockAge(), // TODO: Calculate from birthDate when added
            bio: user.bio || null, // Real data from user profile
            location: user.location || null, // Real data from user profile
            interests: user.interests || [], // Real data from user profile
            distance: this.mockDistance(), // TODO: Calculate from location coordinates
            isOnline: this.isUserOnline(user.lastOnline),
            isFriend: friendIds.includes(user.id!),
            verified: Math.random() > 0.7, // TODO: Use real verified field when added
            appearsInSearches: user.appearsInSearches !== false,
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

    private getCurrentUserId(): number {
        const token = localStorage.getItem("id_token");
        if (!token) return 0;

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.id || 0;
        } catch {
            return 0;
        }
    }

    // Public methods for filtering and sorting
    setFilter(filter: FilterType): void {
        this.filterSubject.next(filter);
        // Reset to first page when filter changes
        this.resetPagination();
        this.loadUsersPage(1);
    }

    setSort(sort: SortType): void {
        this.sortSubject.next(sort);
        // Reset to first page when sort changes
        this.resetPagination();
        this.loadUsersPage(1);
    }

    setSearch(search: string): void {
        this.searchSubject.next(search);
        // Reset to first page when search changes
        this.resetPagination();
        this.loadUsersPage(1);
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
    public loadUsersPage(page: number, append: boolean = false): Observable<HomeUser[]> {
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
        const limit = this.paginationStateSubject.value.limit;

        console.log(`loadUsersPage called - Page: ${page}, Limit: ${limit}, Filter: ${currentFilter}, Sort: ${currentSort}, Search: ${currentSearch}`);
        return new Observable((observer) => {
            this.userService.getAll(page, limit, currentFilter, currentSort, currentSearch).subscribe({
                next: (response: any) => {
                    console.log(`loadUsersPage - API response for page ${page}:`, response);
                    
                    const currentUserId = this.getCurrentUserId();
                    const friendIds = this.friendIdsSubject.value;

                    const homeUsers: HomeUser[] = response.users
                        .map((user: any) => this.enrichUserData(user, friendIds));
                    

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
                        this.usersSubject.next([...existingUsers, ...homeUsers]);
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
        console.log('loadNextPage called - current state:', currentState);
        
        if (!currentState.hasMore) {
            console.log('loadNextPage - No more data available');
            return new Observable(observer => {
                observer.next([]);
                observer.complete();
            });
        }

        const nextPage = Number(currentState.currentPage) + 1;
        console.log(`loadNextPage - Loading page ${nextPage}`);
        return this.loadUsersPage(nextPage, true); // Append to existing users
    }

    getFilteredAndSortedUsers(): Observable<HomeUser[]> {
        // This method now just triggers the first page load and returns the observable
        this.resetPagination();
        this.loadUsersPage(1).subscribe();
        return this.users$;
    }

    /**
     * Get paginated users - Now handled by backend
     * This method is deprecated but kept for backwards compatibility
     */
    getPaginatedUsers(allUsers: HomeUser[], page: number, pageSize: number): HomeUser[] {
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
        this.resetPagination();
        this.loadUsersPage(1).subscribe();
    }
}
