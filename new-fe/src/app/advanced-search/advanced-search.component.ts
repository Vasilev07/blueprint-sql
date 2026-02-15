import {
    Component,
    OnInit,
    OnDestroy,
    inject,
    signal,
    computed,
    DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { HomeService, HomeUser } from "../home/home.service";
import { MessageService } from "primeng/api";
import {
    GiftDialogUser,
    SendGiftDialogComponent,
} from "../shared/send-gift-dialog/send-gift-dialog.component";
import { UserCardComponent } from "../home/user-card/user-card.component";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { MultiSelectModule } from "primeng/multiselect";
import { SliderModule, SliderSlideEndEvent } from "primeng/slider";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { CheckboxModule } from "primeng/checkbox";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

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

const DEFAULT_FILTERS: AdvancedSearchFilters = {
    gender: "all",
    onlineStatus: "all",
    relationshipStatus: "all",
    interests: [],
    ageRange: [18, 65],
    distance: 100,
    location: "",
    verifiedOnly: false,
};

@Component({
    selector: "app-advanced-search",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        SelectModule,
        MultiSelectModule,
        SliderModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        CheckboxModule,
        ProgressSpinnerModule,
        ToastModule,
        TooltipModule,
        UserCardComponent,
        SendGiftDialogComponent,
    ],
    templateUrl: "./advanced-search.component.html",
    styleUrls: ["./advanced-search.component.scss"],
    providers: [MessageService],
})
export class AdvancedSearchComponent implements OnInit, OnDestroy {
    private readonly homeService = inject(HomeService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    // State signals
    readonly users = signal<HomeUser[]>([]);
    readonly totalUsers = signal(0);
    readonly isLoading = signal(true);
    readonly isLoadingMore = signal(false);
    readonly hasMoreData = signal(true);
    readonly showSendGiftDialog = signal(false);
    readonly selectedUserForGift = signal<GiftDialogUser | null>(null);
    readonly filters = signal<AdvancedSearchFilters>({ ...DEFAULT_FILTERS });
    readonly ageRangeLabel = signal("18 - 65 years");
    readonly distanceLabel = signal("Up to 100 km");

    // Computed
    readonly userCountLabel = computed(() => {
        const total = this.totalUsers();
        return `${total} ${total === 1 ? "user" : "users"} found`;
    });

    readonly isEmptyState = computed(
        () => !this.isLoading() && this.users().length === 0,
    );
    readonly hasUsers = computed(
        () => !this.isLoading() && this.users().length > 0,
    );
    readonly showEndOfResults = computed(
        () =>
            !this.isLoading() && !this.hasMoreData() && this.users().length > 0,
    );

    // Filter options (static, no need for signals)
    readonly genderOptions = [
        { label: "All Genders", value: "all" },
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
    ];

    readonly onlineStatusOptions = [
        { label: "All", value: "all" },
        { label: "Online", value: "online" },
        { label: "Offline", value: "offline" },
    ];

    readonly relationshipStatusOptions = [
        { label: "All", value: "all" },
        { label: "Single", value: "single" },
        { label: "In a relationship", value: "in_relationship" },
        { label: "Married", value: "married" },
        { label: "It's complicated", value: "complicated" },
    ];

    readonly interestsOptions = [
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

    ngOnInit(): void {
        this.subscribeToUsers();
        this.subscribeToPaginationState();
        this.loadUsers();
        window.addEventListener("scroll", this.onWindowScroll.bind(this));
    }

    ngOnDestroy(): void {
        window.removeEventListener("scroll", this.onWindowScroll.bind(this));
    }

    private subscribeToUsers(): void {
        this.homeService.users$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (users) => {
                    this.users.set(users);
                    if (users?.length > 0 && this.isLoading()) {
                        this.isLoading.set(false);
                    }
                },
                error: (error) => {
                    console.error("Error loading users:", error);
                    this.isLoading.set(false);
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
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (state) => {
                    this.totalUsers.set(state.totalUsers);
                    this.hasMoreData.set(state.hasMore);
                    if (state.currentPage > 0) {
                        this.isLoading.set(false);
                        this.isLoadingMore.set(false);
                    }
                },
            });
    }

    private loadUsers(): void {
        this.isLoading.set(true);
        this.homeService
            .getFilteredAndSortedUsers()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (users) => {
                    this.users.set(users);
                    if (!users?.length) {
                        this.isLoading.set(false);
                    }
                },
                error: (error) => {
                    console.error("AdvancedSearchComponent - Error:", error);
                    this.isLoading.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load users",
                    });
                },
            });
    }

    updateFilter<K extends keyof AdvancedSearchFilters>(
        key: K,
        value: AdvancedSearchFilters[K],
    ): void {
        this.filters.update((f) => ({ ...f, [key]: value }));
    }

    updateFilters(updates: Partial<AdvancedSearchFilters>): void {
        this.filters.update((f) => ({ ...f, ...updates }));
    }

    applyFilters(): void {
        const f = this.filters();
        let backendFilter = "all";
        if (f.onlineStatus === "online") {
            backendFilter = "online";
        } else if (f.onlineStatus === "offline") {
            backendFilter = "all";
        }

        this.homeService.setFilter(backendFilter as "all" | "online");
        this.homeService.setAdvancedFilters({
            gender: f.gender !== "all" ? f.gender : undefined,
            ageMin: f.ageRange[0] !== 18 ? f.ageRange[0] : undefined,
            ageMax: f.ageRange[1] !== 65 ? f.ageRange[1] : undefined,
            interests: f.interests?.length ? f.interests.join(",") : undefined,
            relationshipStatus:
                f.relationshipStatus !== "all"
                    ? f.relationshipStatus
                    : undefined,
            verifiedOnly: f.verifiedOnly || undefined,
        });

        this.isLoading.set(true);
        this.homeService
            .getFilteredAndSortedUsers()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (users) => {
                    this.users.set(users);
                    this.isLoading.set(false);
                    this.messageService.add({
                        severity: "info",
                        summary: "Filters Applied",
                        detail: `Showing ${users.length} users`,
                        life: 3000,
                    });
                },
                error: (error) => {
                    console.error("Error applying filters:", error);
                    this.isLoading.set(false);
                },
            });
    }

    private loadMoreUsers(): void {
        if (this.isLoadingMore() || !this.hasMoreData()) return;

        this.isLoadingMore.set(true);
        this.homeService
            .loadNextPage()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.isLoadingMore.set(false),
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

    onAgeRangeChange(event: SliderSlideEndEvent): void {
        const values = event.values ?? this.filters().ageRange;
        this.updateFilters({ ageRange: [values[0], values[1]] });
        this.ageRangeLabel.set(`${values[0]} - ${values[1]} years`);
        this.applyFilters();
    }

    onDistanceChange(event: SliderSlideEndEvent): void {
        const value = event.value ?? this.filters().distance;
        this.updateFilter("distance", value);
        this.distanceLabel.set(`Up to ${value} km`);
        this.applyFilters();
    }

    onFilterChange(): void {
        this.applyFilters();
    }

    resetAllFilters(): void {
        this.filters.set({ ...DEFAULT_FILTERS });
        this.ageRangeLabel.set("18 - 65 years");
        this.distanceLabel.set("Up to 100 km");
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

    onGiftSent(_response: unknown): void {
        this.selectedUserForGift.set(null);
    }

    trackByUserId(_index: number, user: HomeUser): number {
        return user.id!;
    }

    goBack(): void {
        this.router.navigate(["/home"]);
    }

    private onWindowScroll(): void {
        const scrollPosition = window.scrollY + window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;

        if (
            scrollPosition >= scrollHeight * 0.8 &&
            this.hasMoreData() &&
            !this.isLoadingMore()
        ) {
            this.loadMoreUsers();
        }
    }
}
