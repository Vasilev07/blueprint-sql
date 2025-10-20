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
    totalUsers: number = 0;
    isLoading: boolean = true;
    isLoadingMore: boolean = false;
    hasMoreData: boolean = true;

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
        this.subscribeToUsers();
        this.subscribeToPaginationState();
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

    private subscribeToUsers(): void {
        this.homeService.users$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (users) => {
                    this.users = users;
                },
                error: (error) => {
                    console.error("Error loading users:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load users",
                    });
                },
            });
    }

    private subscribeToPaginationState(): void {
        this.homeService.paginationState$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (state) => {
                    this.totalUsers = state.totalUsers;
                    this.hasMoreData = state.hasMore;
                    this.isLoading = false;
                    this.isLoadingMore = false;
                },
            });
    }

    private loadUsers(): void {
        this.isLoading = true;
        this.homeService.getFilteredAndSortedUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe();
    }

    applyFilters(): void {
        // Note: For now, advanced filters are commented out
        // TODO: Implement these filters on the backend for better performance
        // Currently using backend pagination with basic filters (online, new, search)
        
        // Trigger reload from backend when filters change
        this.isLoading = true;
        this.homeService.getFilteredAndSortedUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe();
    }

    private loadMoreUsers(): void {
        if (this.isLoadingMore || !this.hasMoreData) {
            return;
        }

        this.isLoadingMore = true;

        this.homeService.loadNextPage()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.isLoadingMore = false;
                },
                error: (error) => {
                    console.error("Error loading more users:", error);
                    this.isLoadingMore = false;
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load more users",
                    });
                },
            });
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

