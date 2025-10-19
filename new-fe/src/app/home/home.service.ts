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

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private friendsService: FriendsService,
    ) {
        this.initializeData();
    }

    private initializeData(): void {
        this.loadUsers();
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

    private loadUsers(): void {
        const token = localStorage.getItem("id_token");
        if (token) {
            this.userService.defaultHeaders =
                this.userService.defaultHeaders.set(
                    "Authorization",
                    `Bearer ${token}`,
                );
        }

        this.userService.getAll().subscribe({
            next: (users: UserDTO[]) => {
                const currentUserId = this.getCurrentUserId();
                const friendIds = this.friendIdsSubject.value;

                const homeUsers: HomeUser[] = users
                    .filter((u) => u.id !== currentUserId) // Exclude current user
                    .map((user) => this.enrichUserData(user, friendIds));

                this.usersSubject.next(homeUsers);
            },
            error: (error) => {
                console.error("Error loading users:", error);
            },
        });
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
        this.loadUsers();
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
    }

    setSort(sort: SortType): void {
        this.sortSubject.next(sort);
    }

    setSearch(search: string): void {
        this.searchSubject.next(search);
    }

    getFilteredAndSortedUsers(): Observable<HomeUser[]> {
        return combineLatest([this.users$, this.filter$, this.sort$, this.search$]).pipe(
            map(([users, filter, sort, search]) => {
                let filtered = [...users];

                // Apply search filter
                if (search && search.trim().length > 0) {
                    const searchLower = search.toLowerCase().trim();
                    filtered = filtered.filter((u) =>
                        u.fullName?.toLowerCase().includes(searchLower) ||
                        u.email?.toLowerCase().includes(searchLower) ||
                        u.bio?.toLowerCase().includes(searchLower) ||
                        u.location?.toLowerCase().includes(searchLower) ||
                        u.city?.toLowerCase().includes(searchLower) ||
                        u.interests?.some(i => i.toLowerCase().includes(searchLower))
                    );
                }

                // Apply filters
                switch (filter) {
                    case "online":
                        filtered = filtered.filter((u) => u.isOnline);
                        break;
                    case "friends":
                        filtered = filtered.filter((u) => u.isFriend);
                        break;
                    case "nearby":
                        // Mock: just show some users
                        filtered = filtered.slice(
                            0,
                            Math.floor(users.length / 2),
                        );
                        break;
                    case "new":
                        // Show newest users (highest IDs)
                        filtered.sort((a, b) => b.id! - a.id!);
                        filtered = filtered.slice(0, 20);
                        break;
                }

                // Apply sorting
                switch (sort) {
                    case "recent":
                        filtered.sort((a, b) => {
                            // Mock: random for now
                            return Math.random() - 0.5;
                        });
                        break;
                    case "new":
                        filtered.sort((a, b) => b.id! - a.id!); // Higher ID = newer
                        break;
                    case "distance":
                        filtered.sort((a, b) => {
                            const distA = parseInt(a.distance || "999");
                            const distB = parseInt(b.distance || "999");
                            return distA - distB;
                        });
                        break;
                }

                return filtered;
            }),
        );
    }

    getOnlineCount(): Observable<number> {
        return this.users$.pipe(
            map((users) => users.filter((u) => u.isOnline).length),
        );
    }

    refreshData(): void {
        this.loadUsers();
        this.loadFriends();
    }
}
