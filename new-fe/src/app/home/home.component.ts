import {
    Component,
    signal,
    computed,
    effect,
    HostListener,
    inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { TooltipModule } from "primeng/tooltip";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { SharedComponentsModule } from "../shared/components.module";
import { toSignal } from "@angular/core/rxjs-interop";
import { HomeService, HomeUser, FilterType, SortType } from "./home.service";
import { MessageService } from "primeng/api";
import { GiftDialogUser } from "../shared/send-gift-dialog/send-gift-dialog.component";

@Component({
    selector: "app-home",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        SelectModule,
        TooltipModule,
        ProgressSpinnerModule,
        ToastModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        SharedComponentsModule,
    ],
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    providers: [MessageService],
})
export class HomeComponent {
    private homeService = inject(HomeService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    // Convert observables to signals
    users = toSignal(this.homeService.users$, { initialValue: [] });
    paginationState = toSignal(this.homeService.paginationState$, {
        initialValue: {
            currentPage: 0,
            totalPages: 0,
            totalUsers: 0,
            hasMore: true,
            limit: 12,
        },
    });

    // Computed signals
    totalUsers = computed(() => this.paginationState()?.totalUsers ?? 0);
    hasMoreData = computed(() => this.paginationState()?.hasMore ?? true);

    // Local state signals
    currentFilter = signal<FilterType>("all");
    currentSort = signal<SortType>("recent");
    searchTerm = signal<string>("");
    isLoading = signal<boolean>(true);
    isLoadingMore = signal<boolean>(false);
    onlineCount = signal<number>(0);

    // Gift dialog properties
    showSendGiftDialog = signal<boolean>(false);
    selectedUserForGift = signal<GiftDialogUser | null>(null);

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

    constructor() {
        // Load users on initialization
        this.loadUsers();

        // Subscribe to online count
        this.subscribeToOnlineCount();

        // Effects for managing loading state
        effect(() => {
            const users = this.users();
            const paginationState = this.paginationState();

            console.log("HomeComponent - Users updated:", users?.length);

            // Clear loading state when we receive users data
            if (users && users.length > 0 && this.isLoading()) {
                console.log(
                    "HomeComponent - Clearing loading state after receiving users",
                );
                this.isLoading.set(false);
            }

            // Only set loading to false when we have actual data (currentPage > 0)
            if (paginationState?.currentPage ?? 0 > 0) {
                this.isLoading.set(false);
                this.isLoadingMore.set(false);
            }
        });
    }

    private subscribeToOnlineCount(): void {
        this.homeService.getOnlineCount().subscribe({
            next: (count) => {
                this.onlineCount.set(count);
            },
            error: (error) => {
                console.error("Error loading online count:", error);
            },
        });
    }

    private loadUsers(): void {
        this.isLoading.set(true);
        console.log("HomeComponent - Loading users...");
        this.homeService.getFilteredAndSortedUsers().subscribe({
            next: (users) => {
                console.log(
                    "HomeComponent - getFilteredAndSortedUsers returned:",
                    users.length,
                );
                // Data will be updated via users signal
                // Loading state will be cleared in effect when data arrives
            },
            error: (error) => {
                console.error("HomeComponent - Error in loadUsers:", error);
                this.isLoading.set(false);
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to load users",
                });
            },
        });
    }

    private loadMoreUsers(): void {
        const isLoadingMore = this.isLoadingMore();
        const hasMoreData = this.hasMoreData();

        console.log(
            `loadMoreUsers called - isLoadingMore: ${isLoadingMore}, hasMoreData: ${hasMoreData}`,
        );

        if (isLoadingMore || !hasMoreData) {
            console.log(
                "loadMoreUsers - Skipping because isLoadingMore or no more data",
            );
            return;
        }

        console.log("loadMoreUsers - Starting to load next page");
        this.isLoadingMore.set(true);

        this.homeService.loadNextPage().subscribe({
            next: () => {
                console.log("loadMoreUsers - Next page loaded successfully");
                this.isLoadingMore.set(false);
            },
            error: (error) => {
                console.error("Error loading more users:", error);
                this.isLoadingMore.set(false);
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to load more users",
                });
            },
        });
    }

    onFilterChange(filter: FilterType): void {
        this.currentFilter.set(filter);
        this.homeService.setFilter(filter);
    }

    onSortChange(event: any): void {
        this.currentSort.set(event.value);
        this.homeService.setSort(event.value);
    }

    onSearchChange(): void {
        this.homeService.setSearch(this.searchTerm());
    }

    clearSearch(): void {
        this.searchTerm.set("");
        this.homeService.setSearch("");
    }

    onChatClick(user: HomeUser): void {
        // Navigate to chat with this user
        this.router.navigate(["/chat"], {
            queryParams: { userId: user.id },
        });
    }

    onGiftClick(user: HomeUser): void {
        if (!user?.id) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to send gift. User information not available.",
            });
            return;
        }

        this.selectedUserForGift.set({
            id: user.id,
            fullName: user.fullName,
        });
        this.showSendGiftDialog.set(true);
    }

    onGiftSent(_response: any): void {
        // Gift was sent successfully, dialog is already closed
        this.selectedUserForGift.set(null);
    }

    onCardClick(user: HomeUser): void {
        // Navigate to user profile
        this.router.navigate(["/profile", user.id]);
    }

    onRefresh(): void {
        this.isLoading.set(true);
        this.homeService.refreshData();

        this.messageService.add({
            severity: "success",
            summary: "Refreshed",
            detail: "User list updated",
        });
    }

    getFilterLabel(): string {
        const option = this.filterOptions.find(
            (o) => o.value === this.currentFilter(),
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
        const threshold = scrollHeight * 0.8;
        const hasMoreData = this.hasMoreData();
        const isLoadingMore = this.isLoadingMore();

        console.log(
            `Scroll Debug - Position: ${scrollPosition}, Height: ${scrollHeight}, Threshold: ${threshold}, HasMore: ${hasMoreData}, Loading: ${isLoadingMore}`,
        );

        if (scrollPosition >= threshold && hasMoreData && !isLoadingMore) {
            console.log("Scroll - Loading more users");
            this.loadMoreUsers();
        }
    }

    @HostListener("window:scroll", [])
    onWindowScroll(): void {
        const scrollPosition = window.scrollY + window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;
        const threshold = scrollHeight * 0.8;
        const hasMoreData = this.hasMoreData();
        const isLoadingMore = this.isLoadingMore();

        // Load more when user scrolls to 80% of the content
        if (scrollPosition >= threshold && hasMoreData && !isLoadingMore) {
            this.loadMoreUsers();
        }
    }
}
