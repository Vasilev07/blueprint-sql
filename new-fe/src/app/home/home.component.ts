import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { HomeService, HomeUser, FilterType, SortType } from "./home.service";
import { MessageService } from "primeng/api";

@Component({
    selector: "app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    providers: [MessageService],
})
export class HomeComponent implements OnInit, OnDestroy {
    users: HomeUser[] = [];
    allUsers: HomeUser[] = [];
    displayedUsers: HomeUser[] = [];
    totalUsers: number = 0;
    onlineCount: number = 0;
    currentFilter: FilterType = "all";
    currentSort: SortType = "recent";
    searchTerm: string = "";
    isLoading: boolean = true;
    isLoadingMore: boolean = false;

    // Infinite scroll
    private currentPage: number = 0;
    private pageSize: number = 12;
    private hasMoreData: boolean = true;

    filterOptions = [
        { label: "All", value: "all" as FilterType, icon: "pi pi-users" },
        {
            label: "Nearby",
            value: "nearby" as FilterType,
            icon: "pi pi-map-marker",
        },
        {
            label: "Online",
            value: "online" as FilterType,
            icon: "pi pi-circle-fill",
        },
        {
            label: "New",
            value: "new" as FilterType,
            icon: "pi pi-star",
        },
        {
            label: "Earners",
            value: "friends" as FilterType,
            icon: "pi pi-dollar",
        },
    ];

    sortOptions = [
        { label: "Recently Active", value: "recent" as SortType },
        { label: "New Users", value: "new" as SortType },
        { label: "By Distance", value: "distance" as SortType },
    ];

    private destroy$ = new Subject<void>();

    constructor(
        private homeService: HomeService,
        private router: Router,
        private messageService: MessageService,
    ) {}

    ngOnInit(): void {
        this.loadUsers();
        this.subscribeToOnlineCount();

        // Add scroll event listener
        window.addEventListener("scroll", this.onWindowScroll.bind(this));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        // Remove scroll event listener
        window.removeEventListener("scroll", this.onWindowScroll.bind(this));
    }

    private loadUsers(): void {
        this.isLoading = true;

        this.homeService
            .getFilteredAndSortedUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (users) => {
                    this.allUsers = users;
                    this.totalUsers = users.length;
                    this.currentPage = 0;
                    this.hasMoreData = users.length > this.pageSize;
                    this.loadInitialPage();
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

    private loadInitialPage(): void {
        this.displayedUsers = this.homeService.getPaginatedUsers(
            this.allUsers,
            0,
            this.pageSize,
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
                this.allUsers,
                this.currentPage,
                this.pageSize,
            );

            if (newUsers.length > 0) {
                this.displayedUsers = [...this.displayedUsers, ...newUsers];
                this.hasMoreData =
                    this.displayedUsers.length < this.allUsers.length;
            } else {
                this.hasMoreData = false;
            }

            this.isLoadingMore = false;
        }, 300);
    }

    private subscribeToOnlineCount(): void {
        this.homeService
            .getOnlineCount()
            .pipe(takeUntil(this.destroy$))
            .subscribe((count) => {
                this.onlineCount = count;
            });
    }

    onFilterChange(filter: FilterType): void {
        this.currentFilter = filter;
        this.homeService.setFilter(filter);
        this.currentPage = 0;
    }

    onSortChange(event: any): void {
        this.currentSort = event.value;
        this.homeService.setSort(event.value);
    }

    onSearchChange(): void {
        this.homeService.setSearch(this.searchTerm);
    }

    clearSearch(): void {
        this.searchTerm = "";
        this.homeService.setSearch("");
    }

    onChatClick(user: HomeUser): void {
        // Navigate to chat with this user
        this.router.navigate(["/chat"], {
            queryParams: { userId: user.id },
        });
    }

    onCardClick(user: HomeUser): void {
        // Navigate to user profile
        this.router.navigate(["/profile", user.id]);
    }

    onRefresh(): void {
        this.isLoading = true;
        this.homeService.refreshData();

        this.messageService.add({
            severity: "success",
            summary: "Refreshed",
            detail: "User list updated",
        });
    }

    getFilterLabel(): string {
        const option = this.filterOptions.find(
            (o) => o.value === this.currentFilter,
        );
        return option?.label || "All Users";
    }

    trackByUserId(index: number, user: HomeUser): number {
        return user.id!;
    }

    goToAdvancedSearch(): void {
        this.router.navigate(["/advanced-search"]);
    }

    onScroll(event: Event): void {
        const element = event.target as HTMLElement;
        const scrollPosition = element.scrollTop + element.clientHeight;
        const scrollHeight = element.scrollHeight;

        // Load more when user scrolls to 80% of the content
        if (
            scrollPosition >= scrollHeight * 0.8 &&
            this.hasMoreData &&
            !this.isLoadingMore
        ) {
            this.loadMoreUsers();
        }
    }

    onWindowScroll(): void {
        const scrollPosition = window.scrollY + window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;

        // Load more when user scrolls to 80% of the content
        if (
            scrollPosition >= scrollHeight * 0.8 &&
            this.hasMoreData &&
            !this.isLoadingMore
        ) {
            this.loadMoreUsers();
        }
    }
}
