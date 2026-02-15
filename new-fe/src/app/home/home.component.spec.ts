import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { TooltipModule } from "primeng/tooltip";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { of, throwError, BehaviorSubject } from "rxjs";
import { HomeComponent } from "./home.component";
import { HomeService, HomeUser, FilterType, SortType } from "./home.service";

describe("HomeComponent", () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;
    let homeService: jest.Mocked<HomeService>;
    let router: jest.Mocked<Router>;
    let messageService: jest.Mocked<MessageService>;

    const mockUsers: HomeUser[] = [
        {
            id: 1,
            fullName: "John Doe",
            email: "john@example.com",
        } as HomeUser,
        {
            id: 2,
            fullName: "Jane Smith",
            email: "jane@example.com",
        } as HomeUser,
    ];

    const mockPaginationState = {
        currentPage: 1,
        totalPages: 5,
        totalUsers: 50,
        hasMore: true,
        limit: 12,
    };

    beforeEach(async () => {
        // Create mock observables
        const usersSubject = new BehaviorSubject<HomeUser[]>([]);
        const paginationStateSubject = new BehaviorSubject(mockPaginationState);

        // Create mocks
        homeService = {
            users$: usersSubject.asObservable(),
            paginationState$: paginationStateSubject.asObservable(),
            getFilteredAndSortedUsers: jest.fn().mockReturnValue(of(mockUsers)),
            loadNextPage: jest.fn().mockReturnValue(of(mockUsers)),
            getOnlineCount: jest.fn().mockReturnValue(of(10)),
            setFilter: jest.fn(),
            setSort: jest.fn(),
            setSearch: jest.fn(),
            refreshData: jest.fn(),
        } as any;

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        } as any;

        messageService = {
            add: jest.fn(),
        } as any;

        await TestBed.configureTestingModule({
            imports: [HomeComponent],
            providers: [
                { provide: HomeService, useValue: homeService },
                { provide: Router, useValue: router },
                { provide: MessageService, useValue: messageService },
            ],
        })
            .overrideComponent(HomeComponent, {
                set: {
                    imports: [
                        CommonModule,
                        FormsModule,
                        RouterModule,
                        ButtonModule,
                        SelectModule,
                        TooltipModule,
                        ProgressSpinnerModule,
                        InputTextModule,
                        IconFieldModule,
                        InputIconModule,
                    ],
                    providers: [],
                    schemas: [NO_ERRORS_SCHEMA],
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(HomeComponent);
        component = fixture.componentInstance;
    });

    describe("Component Initialization", () => {
        it("should create the component", () => {
            expect(component).toBeTruthy();
        });

        it("should initialize with default values", () => {
            expect(component.currentFilter()).toBe("all");
            expect(component.currentSort()).toBe("recent");
            expect(component.searchTerm()).toBe("");
            expect(component.isLoading()).toBe(true);
            expect(component.isLoadingMore()).toBe(false);
            expect(component.showSendGiftDialog()).toBe(false);
            expect(component.selectedUserForGift()).toBeNull();
        });

        it("should load users on initialization", () => {
            expect(homeService.getFilteredAndSortedUsers).toHaveBeenCalled();
        });

        it("should subscribe to online count on initialization", () => {
            expect(homeService.getOnlineCount).toHaveBeenCalled();
        });

        it("should initialize filter options", () => {
            expect(component.filterOptions).toHaveLength(5);
            expect(component.filterOptions[0].value).toBe("all");
        });

        it("should initialize sort options", () => {
            expect(component.sortOptions).toHaveLength(3);
            expect(component.sortOptions[0].value).toBe("recent");
        });
    });

    describe("Signals and Computed Values", () => {
        it("should update users signal when service emits", (done) => {
            const usersSubject = new BehaviorSubject<HomeUser[]>(mockUsers);
            homeService.users$ = usersSubject.asObservable();

            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            // Wait for signal to update
            setTimeout(() => {
                expect(component?.users()?.length).toBeGreaterThan(0);
                done();
            }, 100);
        });

        it("should compute totalUsers from paginationState", () => {
            expect(component.totalUsers()).toBe(mockPaginationState.totalUsers);
        });

        it("should compute hasMoreData from paginationState", () => {
            expect(component.hasMoreData()).toBe(mockPaginationState.hasMore);
        });

        it("should update onlineCount when service emits", (done) => {
            homeService.getOnlineCount = jest.fn().mockReturnValue(of(25));

            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;

            setTimeout(() => {
                expect(component.onlineCount()).toBe(25);
                done();
            }, 100);
        });
    });

    describe("Filter Functionality", () => {
        it("should update filter and call service on filter change", () => {
            const filter: FilterType = "online";
            component.onFilterChange(filter);

            expect(component.currentFilter()).toBe(filter);
            expect(homeService.setFilter).toHaveBeenCalledWith(filter);
        });

        it("should handle all filter types", () => {
            const filters: FilterType[] = [
                "all",
                "online",
                "friends",
                "nearby",
                "new",
            ];

            filters.forEach((filter) => {
                component.onFilterChange(filter);
                expect(component.currentFilter()).toBe(filter);
            });
        });

        it("should return correct filter label", () => {
            component.currentFilter.set("online");
            expect(component.getFilterLabel()).toBe("Online");

            component.currentFilter.set("all");
            expect(component.getFilterLabel()).toBe("All");
        });

        it("should return default label for unknown filter", () => {
            component.currentFilter.set("unknown" as FilterType);
            expect(component.getFilterLabel()).toBe("All Users");
        });
    });

    describe("Sort Functionality", () => {
        it("should update sort and call service on sort change", () => {
            const sort: SortType = "new";
            const event = { value: sort };

            component.onSortChange(event);

            expect(component.currentSort()).toBe(sort);
            expect(homeService.setSort).toHaveBeenCalledWith(sort);
        });

        it("should handle all sort types", () => {
            const sorts: SortType[] = ["recent", "new", "distance"];

            sorts.forEach((sort) => {
                component.onSortChange({ value: sort });
                expect(component.currentSort()).toBe(sort);
            });
        });
    });

    describe("Search Functionality", () => {
        it("should update search term and call service on search change", () => {
            component.searchTerm.set("test query");
            component.onSearchChange();

            expect(homeService.setSearch).toHaveBeenCalledWith("test query");
        });

        it("should clear search term and call service", () => {
            component.searchTerm.set("test");
            component.clearSearch();

            expect(component.searchTerm()).toBe("");
            expect(homeService.setSearch).toHaveBeenCalledWith("");
        });
    });

    describe("Navigation", () => {
        it("should navigate to chat on chat click", () => {
            const user = mockUsers[0];
            component.onChatClick(user);

            expect(router.navigate).toHaveBeenCalledWith(["/chat"], {
                queryParams: { userId: user.id },
            });
        });

        it("should navigate to profile on card click", () => {
            const user = mockUsers[0];
            component.onCardClick(user);

            expect(router.navigate).toHaveBeenCalledWith(["/profile", user.id]);
        });

        it("should navigate to advanced search", () => {
            component.goToAdvancedSearch();

            expect(router.navigate).toHaveBeenCalledWith(["/advanced-search"]);
        });
    });

    describe("Gift Dialog", () => {
        it("should open gift dialog with selected user", () => {
            const user = mockUsers[0];
            component.onGiftClick(user);

            expect(component.showSendGiftDialog()).toBe(true);
            expect(component.selectedUserForGift()).toEqual({
                id: user.id,
                fullName: user.fullName,
            });
        });

        it("should show error message when user has no id", () => {
            const user = {} as HomeUser;
            component.onGiftClick(user);

            expect(component.showSendGiftDialog()).toBe(false);
            expect(messageService.add).toHaveBeenCalledWith({
                severity: "error",
                summary: "Error",
                detail: "Unable to send gift. User information not available.",
            });
        });

        it("should clear selected user after gift sent", () => {
            component.selectedUserForGift.set({
                id: 1,
                fullName: "Test User",
            });
            component.onGiftSent({});

            expect(component.selectedUserForGift()).toBeNull();
        });
    });

    describe("Loading More Users", () => {
        it("should load more users when scroll reaches threshold", (done) => {
            component.isLoadingMore.set(false);

            // Update paginationState to have more data
            const paginationStateSubject = new BehaviorSubject({
                ...mockPaginationState,
                hasMore: true,
            });
            homeService.paginationState$ =
                paginationStateSubject.asObservable();

            // Recreate component to pick up new observable
            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            // Wait a bit for signals to initialize, then trigger scroll
            setTimeout(() => {
                const mockElement = {
                    scrollTop: 800,
                    clientHeight: 200,
                    scrollHeight: 1000,
                } as HTMLElement;

                const event = {
                    target: mockElement,
                } as unknown as Event;

                component.onScroll(event);

                setTimeout(() => {
                    expect(homeService.loadNextPage).toHaveBeenCalled();
                    done();
                }, 100);
            }, 100);
        });

        it("should not load more if already loading", () => {
            component.isLoadingMore.set(true);

            const mockElement = {
                scrollTop: 800,
                clientHeight: 200,
                scrollHeight: 1000,
            } as HTMLElement;

            const event = {
                target: mockElement,
            } as unknown as Event;

            component.onScroll(event);

            expect(homeService.loadNextPage).not.toHaveBeenCalled();
        });

        it("should not load more if no more data", () => {
            component.isLoadingMore.set(false);

            // Update paginationState to have no more data
            const paginationStateSubject = new BehaviorSubject({
                ...mockPaginationState,
                hasMore: false,
            });
            homeService.paginationState$ =
                paginationStateSubject.asObservable();

            // Recreate component to pick up new observable
            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const mockElement = {
                scrollTop: 800,
                clientHeight: 200,
                scrollHeight: 1000,
            } as HTMLElement;

            const event = {
                target: mockElement,
            } as unknown as Event;

            component.onScroll(event);

            expect(homeService.loadNextPage).not.toHaveBeenCalled();
        });

        it("should handle error when loading more fails", (done) => {
            homeService.loadNextPage = jest
                .fn()
                .mockReturnValue(throwError(() => new Error("Failed")));
            component.isLoadingMore.set(false);

            // Update paginationState to have more data
            const paginationStateSubject = new BehaviorSubject({
                ...mockPaginationState,
                hasMore: true,
            });
            homeService.paginationState$ =
                paginationStateSubject.asObservable();

            // Recreate component to pick up new observable
            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            setTimeout(() => {
                const mockElement = {
                    scrollTop: 800,
                    clientHeight: 200,
                    scrollHeight: 1000,
                } as HTMLElement;

                const event = {
                    target: mockElement,
                } as unknown as Event;

                component.onScroll(event);

                // Wait for error handling
                setTimeout(() => {
                    expect(component.isLoadingMore()).toBe(false);
                    expect(messageService.add).toHaveBeenCalledWith({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load more users",
                    });
                    done();
                }, 100);
            }, 100);
        });
    });

    describe("Refresh", () => {
        it("should refresh data and show success message", () => {
            component.onRefresh();

            expect(component.isLoading()).toBe(true);
            expect(homeService.refreshData).toHaveBeenCalled();
            expect(messageService.add).toHaveBeenCalledWith({
                severity: "success",
                summary: "Refreshed",
                detail: "User list updated",
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle error when loading users fails", () => {
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            homeService.getFilteredAndSortedUsers = jest
                .fn()
                .mockReturnValue(throwError(() => new Error("Failed")));

            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            expect(component.isLoading()).toBe(false);
            expect(messageService.add).toHaveBeenCalledWith({
                severity: "error",
                summary: "Error",
                detail: "Failed to load users",
            });

            consoleSpy.mockRestore();
        });

        it("should handle error when getting online count fails", () => {
            homeService.getOnlineCount = jest
                .fn()
                .mockReturnValue(throwError(() => new Error("Failed")));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe("Scroll Handling", () => {
        it("should load more users when scroll reaches threshold", (done) => {
            component.isLoadingMore.set(false);

            // Update paginationState to have more data
            const paginationStateSubject = new BehaviorSubject({
                ...mockPaginationState,
                hasMore: true,
            });
            homeService.paginationState$ =
                paginationStateSubject.asObservable();

            // Recreate component to pick up new observable
            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            setTimeout(() => {
                const mockElement = {
                    scrollTop: 800,
                    clientHeight: 200,
                    scrollHeight: 1000,
                } as HTMLElement;

                const event = {
                    target: mockElement,
                } as unknown as Event;

                component.onScroll(event);

                setTimeout(() => {
                    expect(homeService.loadNextPage).toHaveBeenCalled();
                    done();
                }, 100);
            }, 100);
        });

        it("should not load more when scroll is below threshold", () => {
            component.isLoadingMore.set(false);

            const mockElement = {
                scrollTop: 100,
                clientHeight: 200,
                scrollHeight: 1000,
            } as HTMLElement;

            const event = {
                target: mockElement,
            } as unknown as Event;

            component.onScroll(event);

            expect(homeService.loadNextPage).not.toHaveBeenCalled();
        });

        it("should handle window scroll", (done) => {
            component.isLoadingMore.set(false);

            // Update paginationState to have more data
            const paginationStateSubject = new BehaviorSubject({
                ...mockPaginationState,
                hasMore: true,
            });
            homeService.paginationState$ =
                paginationStateSubject.asObservable();

            // Recreate component to pick up new observable
            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            setTimeout(() => {
                // Mock window properties
                Object.defineProperty(window, "scrollY", {
                    value: 800,
                    writable: true,
                });
                Object.defineProperty(window, "innerHeight", {
                    value: 200,
                    writable: true,
                });
                Object.defineProperty(
                    document.documentElement,
                    "scrollHeight",
                    {
                        value: 1000,
                        writable: true,
                    },
                );

                component.onWindowScroll();

                setTimeout(() => {
                    expect(homeService.loadNextPage).toHaveBeenCalled();
                    done();
                }, 100);
            }, 100);
        });
    });

    describe("Track By Function", () => {
        it("should return user id for trackBy", () => {
            const user = mockUsers[0];
            const result = component.trackByUserId(0, user);

            expect(result).toBe(user.id);
        });
    });

    describe("Loading State Management", () => {
        it("should set loading to true when refreshing", () => {
            component.isLoading.set(false);
            component.onRefresh();

            expect(component.isLoading()).toBe(true);
        });

        it("should clear loading state when users are received", (done) => {
            const usersSubject = new BehaviorSubject<HomeUser[]>(mockUsers);
            const paginationSubject = new BehaviorSubject({
                ...mockPaginationState,
                currentPage: 1,
            });

            homeService.users$ = usersSubject.asObservable();
            homeService.paginationState$ = paginationSubject.asObservable();

            fixture = TestBed.createComponent(HomeComponent);
            component = fixture.componentInstance;
            component.isLoading.set(true);
            fixture.detectChanges();

            // Wait for effect to run
            setTimeout(() => {
                expect(component.isLoading()).toBe(false);
                done();
            }, 100);
        });
    });
});
