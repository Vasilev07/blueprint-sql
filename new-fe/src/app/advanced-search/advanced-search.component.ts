import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { HomeService, HomeUser } from "../home/home.service";
import { MessageService } from "primeng/api";

export interface AdvancedSearchFilters {
    gender?: string;
    onlineStatus?: string;
    relationshipStatus?: string;
    interests?: string[];
    ageRange: [number, number];
    distance: number;
    location?: string;
    verifiedOnly: boolean;
}

@Component({
    selector: "app-advanced-search",
    templateUrl: "./advanced-search.component.html",
    styleUrls: ["./advanced-search.component.scss"],
    providers: [MessageService],
})
export class AdvancedSearchComponent implements OnInit, OnDestroy {
    users: HomeUser[] = [];
    filteredUsers: HomeUser[] = [];
    displayedUsers: HomeUser[] = [];
    isLoading: boolean = true;
    isLoadingMore: boolean = false;

    // Infinite scroll
    private currentPage: number = 0;
    private pageSize: number = 12;
    private hasMoreData: boolean = true;

    // Filter options
    genderOptions = [
        { label: "All Genders", value: "all" },
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
    ];

    onlineStatusOptions = [
        { label: "All", value: "all" },
        { label: "Online", value: "online" },
        { label: "Offline", value: "offline" },
    ];

    relationshipStatusOptions = [
        { label: "All", value: "all" },
        { label: "Single", value: "single" },
        { label: "In a relationship", value: "in_relationship" },
        { label: "Married", value: "married" },
        { label: "It's complicated", value: "complicated" },
    ];

    interestsOptions = [
        { label: "All interests", value: "all" },
        { label: "Sports", value: "sports" },
        { label: "Music", value: "music" },
        { label: "Movies", value: "movies" },
        { label: "Travel", value: "travel" },
        { label: "Food", value: "food" },
        { label: "Technology", value: "technology" },
        { label: "Art", value: "art" },
        { label: "Gaming", value: "gaming" },
        { label: "Reading", value: "reading" },
        { label: "Fitness", value: "fitness" },
    ];

    // Filter values
    filters: AdvancedSearchFilters = {
        gender: "all",
        onlineStatus: "all",
        relationshipStatus: "all",
        interests: [],
        ageRange: [18, 65],
        distance: 100,
        location: "",
        verifiedOnly: false,
    };

    // Slider labels
    ageRangeLabel: string = "18 - 65 years";
    distanceLabel: string = "Up to 100 km";

    private destroy$ = new Subject<void>();

    constructor(
        private homeService: HomeService,
        private router: Router,
        private messageService: MessageService,
    ) {}

    ngOnInit(): void {
        this.loadUsers();
        
        // Add scroll event listener
        window.addEventListener('scroll', this.onWindowScroll.bind(this));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        
        // Remove scroll event listener
        window.removeEventListener('scroll', this.onWindowScroll.bind(this));
    }

    private loadUsers(): void {
        this.isLoading = true;

        this.homeService
            .getFilteredAndSortedUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (users) => {
                    this.users = users;
                    this.applyFilters();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error("Error loading users:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load users",
                    });
                    this.isLoading = false;
                },
            });
    }

    applyFilters(): void {
        let filtered = [...this.users];

        // Gender filter
        if (this.filters.gender && this.filters.gender !== "all") {
            filtered = filtered.filter(
                (u) =>
                    u.gender?.toLowerCase() === this.filters.gender?.toLowerCase(),
            );
        }

        // Online status filter
        if (this.filters.onlineStatus && this.filters.onlineStatus !== "all") {
            const isOnline = this.filters.onlineStatus === "online";
            filtered = filtered.filter((u) => u.isOnline === isOnline);
        }

        // Relationship status filter (mock for now)
        // TODO: Add relationshipStatus field to user model

        // Interests filter
        if (this.filters.interests && this.filters.interests.length > 0 && !this.filters.interests.includes("all")) {
            filtered = filtered.filter((u) => {
                if (!u.interests || u.interests.length === 0) return false;
                return this.filters.interests!.some((interest) =>
                    u.interests!.some((userInterest) =>
                        userInterest.toLowerCase().includes(interest.toLowerCase()),
                    ),
                );
            });
        }

        // Age range filter
        if (this.filters.ageRange) {
            filtered = filtered.filter((u) => {
                if (!u.age) return true; // Include users without age
                return (
                    u.age >= this.filters.ageRange[0] &&
                    u.age <= this.filters.ageRange[1]
                );
            });
        }

        // Distance filter (mock for now - would need geolocation)
        // TODO: Implement real distance calculation

        // Location filter
        if (this.filters.location && this.filters.location.trim().length > 0) {
            const locationLower = this.filters.location.toLowerCase().trim();
            filtered = filtered.filter(
                (u) =>
                    u.location?.toLowerCase().includes(locationLower) ||
                    u.city?.toLowerCase().includes(locationLower),
            );
        }

        // Verified only filter
        if (this.filters.verifiedOnly) {
            filtered = filtered.filter((u) => u.verified === true);
        }

        this.filteredUsers = filtered;
        this.currentPage = 0; // Reset to first page when filters change
        this.hasMoreData = filtered.length > this.pageSize;
        this.loadInitialPage();
    }

    private loadInitialPage(): void {
        this.displayedUsers = this.homeService.getPaginatedUsers(
            this.filteredUsers,
            0,
            this.pageSize
        );
        this.currentPage = 0;
    }

    private loadMoreUsers(): void {
        if (this.isLoadingMore || !this.hasMoreData) {
            return;
        }

        this.isLoadingMore = true;
        this.currentPage++;

        // Simulate async loading with slight delay for better UX
        setTimeout(() => {
            const newUsers = this.homeService.getPaginatedUsers(
                this.filteredUsers,
                this.currentPage,
                this.pageSize
            );

            if (newUsers.length > 0) {
                this.displayedUsers = [...this.displayedUsers, ...newUsers];
                this.hasMoreData = this.displayedUsers.length < this.filteredUsers.length;
            } else {
                this.hasMoreData = false;
            }

            this.isLoadingMore = false;
        }, 300);
    }

    onAgeRangeChange(event: any): void {
        this.filters.ageRange = event.values;
        this.ageRangeLabel = `${event.values[0]} - ${event.values[1]} years`;
        this.applyFilters();
    }

    onDistanceChange(event: any): void {
        this.filters.distance = event.value;
        this.distanceLabel = `Up to ${event.value} km`;
        this.applyFilters();
    }

    onFilterChange(): void {
        this.applyFilters();
    }

    resetAllFilters(): void {
        this.filters = {
            gender: "all",
            onlineStatus: "all",
            relationshipStatus: "all",
            interests: [],
            ageRange: [18, 65],
            distance: 100,
            location: "",
            verifiedOnly: false,
        };
        this.ageRangeLabel = "18 - 65 years";
        this.distanceLabel = "Up to 100 km";
        this.applyFilters();

        this.messageService.add({
            severity: "info",
            summary: "Filters Reset",
            detail: "All filters have been reset to default values",
        });
    }

    onCardClick(user: HomeUser): void {
        this.router.navigate(["/profile", user.id]);
    }

    onChatClick(user: HomeUser): void {
        this.router.navigate(["/chat"], {
            queryParams: { userId: user.id },
        });
    }

    trackByUserId(index: number, user: HomeUser): number {
        return user.id!;
    }

    goBack(): void {
        this.router.navigate(["/home"]);
    }

    onWindowScroll(): void {
        const scrollPosition = window.scrollY + window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;
        
        // Load more when user scrolls to 80% of the content
        if (scrollPosition >= scrollHeight * 0.8 && this.hasMoreData && !this.isLoadingMore) {
            this.loadMoreUsers();
        }
    }
}

