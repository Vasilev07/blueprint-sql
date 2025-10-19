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
    totalUsers: number = 0;
    onlineCount: number = 0;
    currentFilter: FilterType = "all";
    currentSort: SortType = "recent";
    isLoading: boolean = true;

    filterOptions = [
        { label: "All Users", value: "all" as FilterType, icon: "pi pi-users" },
        {
            label: "Online",
            value: "online" as FilterType,
            icon: "pi pi-circle-fill",
        },
        {
            label: "Friends",
            value: "friends" as FilterType,
            icon: "pi pi-user-plus",
        },
        {
            label: "Nearby",
            value: "nearby" as FilterType,
            icon: "pi pi-map-marker",
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
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadUsers(): void {
        this.isLoading = true;

        this.homeService
            .getFilteredAndSortedUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (users) => {
                    this.users = users;
                    this.totalUsers = users.length;
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
    }

    onSortChange(event: any): void {
        this.currentSort = event.value;
        this.homeService.setSort(event.value);
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
}
