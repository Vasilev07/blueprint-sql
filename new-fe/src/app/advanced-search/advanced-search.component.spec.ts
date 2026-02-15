import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { of, throwError, BehaviorSubject } from "rxjs";
import { HomeService, HomeUser } from "../home/home.service";
import { AdvancedSearchComponent } from "./advanced-search.component";

describe("AdvancedSearchComponent", () => {
    let component: AdvancedSearchComponent;
    let fixture: ComponentFixture<AdvancedSearchComponent>;
    let homeService: jest.Mocked<HomeService>;
    let router: jest.Mocked<Router>;
    let messageService: jest.Mocked<MessageService>;

    const mockUsers: HomeUser[] = [
        {
            id: 1,
            fullName: "John Doe",
            email: "john@example.com",
            gender: "male",
            age: 25,
            city: "New York",
        } as HomeUser,
        {
            id: 2,
            fullName: "Jane Smith",
            email: "jane@example.com",
            gender: "female",
            age: 30,
            city: "Los Angeles",
        } as HomeUser,
        {
            id: 3,
            fullName: "Bob Johnson",
            email: "bob@example.com",
            gender: "male",
            age: 35,
            city: "Chicago",
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
            setFilter: jest.fn(),
            setAdvancedFilters: jest.fn(),
        } as any;

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        } as any;

        await TestBed.configureTestingModule({
            imports: [AdvancedSearchComponent],
            providers: [
                { provide: HomeService, useValue: homeService },
                { provide: Router, useValue: router },
            ],
        })
            .overrideComponent(AdvancedSearchComponent, {
                set: {
                    schemas: [NO_ERRORS_SCHEMA],
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(AdvancedSearchComponent);
        component = fixture.componentInstance;

        // Get the MessageService instance that was injected into the component
        // and spy on its methods so we can verify calls in tests
        const actualMessageService = (component as any)
            .messageService as MessageService;
        jest.spyOn(actualMessageService, "add");
        jest.spyOn(actualMessageService, "clear");
        messageService = actualMessageService as jest.Mocked<MessageService>;
    });

    describe("Component Initialization", () => {
        it("should create the component", () => {
            expect(component).toBeTruthy();
        });

        it("should initialize with default filter values", () => {
            expect(component.filters().gender).toBe("all");
            expect(component.filters().onlineStatus).toBe("all");
            expect(component.filters().relationshipStatus).toBe("all");
            expect(component.filters().interests).toEqual([]);
            expect(component.filters().ageRange).toEqual([18, 65]);
            expect(component.filters().distance).toBe(100);
            expect(component.filters().location).toBe("");
            expect(component.filters().verifiedOnly).toBe(false);
        });

        it("should initialize with default labels", () => {
            expect(component.ageRangeLabel()).toBe("18 - 65 years");
            expect(component.distanceLabel()).toBe("Up to 100 km");
        });

        it("should initialize loading states", () => {
            expect(component.isLoading()).toBe(true);
            expect(component.isLoadingMore()).toBe(false);
            expect(component.hasMoreData()).toBe(true);
        });

        it("should initialize gift dialog state", () => {
            expect(component.showSendGiftDialog()).toBe(false);
            expect(component.selectedUserForGift()).toBeNull();
        });

        it("should load users on initialization", () => {
            fixture.detectChanges();
            expect(homeService.getFilteredAndSortedUsers).toHaveBeenCalled();
        });

        it("should subscribe to users observable", (done) => {
            const usersSubject = new BehaviorSubject<HomeUser[]>(mockUsers);
            homeService.users$ = usersSubject.asObservable();

            // Make getFilteredAndSortedUsers also emit through users$ to simulate real behavior
            homeService.getFilteredAndSortedUsers = jest
                .fn()
                .mockImplementation(() => {
                    Promise.resolve().then(() => usersSubject.next(mockUsers));
                    return of(mockUsers);
                });

            fixture = TestBed.createComponent(AdvancedSearchComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            setTimeout(() => {
                expect(component.users().length).toBe(mockUsers.length);
                expect(component.isLoading()).toBe(false);
                done();
            }, 10);
        });
    });

    describe("Computed Signals", () => {
        it("should compute userCountLabel for single user", () => {
            component.totalUsers.set(1);
            expect(component.userCountLabel()).toBe("1 user found");
        });

        it("should compute userCountLabel for multiple users", () => {
            component.totalUsers.set(50);
            expect(component.userCountLabel()).toBe("50 users found");
        });

        it("should compute isEmptyState correctly", () => {
            component.isLoading.set(false);
            component.users.set([]);
            expect(component.isEmptyState()).toBe(true);

            component.users.set(mockUsers);
            expect(component.isEmptyState()).toBe(false);
        });

        it("should compute hasUsers correctly", () => {
            component.isLoading.set(false);
            component.users.set(mockUsers);
            expect(component.hasUsers()).toBe(true);

            component.users.set([]);
            expect(component.hasUsers()).toBe(false);
        });

        it("should compute showEndOfResults correctly", () => {
            component.isLoading.set(false);
            component.hasMoreData.set(false);
            component.users.set(mockUsers);
            expect(component.showEndOfResults()).toBe(true);

            component.hasMoreData.set(true);
            expect(component.showEndOfResults()).toBe(false);
        });
    });

    describe("Filter Management", () => {
        it("should update single filter", () => {
            component.updateFilter("gender", "male");
            expect(component.filters().gender).toBe("male");
        });

        it("should update multiple filters at once", () => {
            component.updateFilters({
                gender: "female",
                onlineStatus: "online",
            });
            expect(component.filters().gender).toBe("female");
            expect(component.filters().onlineStatus).toBe("online");
        });

        it("should preserve other filters when updating one", () => {
            component.updateFilter("gender", "male");
            component.updateFilter("onlineStatus", "online");

            expect(component.filters().gender).toBe("male");
            expect(component.filters().onlineStatus).toBe("online");
            expect(component.filters().relationshipStatus).toBe("all");
        });

        it("should reset all filters to default values", () => {
            // Change some filters
            component.updateFilters({
                gender: "male",
                onlineStatus: "online",
                ageRange: [25, 40],
                distance: 50,
                verifiedOnly: true,
            });

            // Reset
            component.resetAllFilters();

            expect(component.filters().gender).toBe("all");
            expect(component.filters().onlineStatus).toBe("all");
            expect(component.filters().relationshipStatus).toBe("all");
            expect(component.filters().interests).toEqual([]);
            expect(component.filters().ageRange).toEqual([18, 65]);
            expect(component.filters().distance).toBe(100);
            expect(component.filters().location).toBe("");
            expect(component.filters().verifiedOnly).toBe(false);
        });

        it("should reset labels when resetting filters", () => {
            component.ageRangeLabel.set("25 - 40 years");
            component.distanceLabel.set("Up to 50 km");

            component.resetAllFilters();

            expect(component.ageRangeLabel()).toBe("18 - 65 years");
            expect(component.distanceLabel()).toBe("Up to 100 km");
        });

        it("should show success message when resetting filters", () => {
            fixture.detectChanges(); // Ensure component is initialized
            (messageService.add as jest.Mock).mockClear(); // Clear any previous calls

            component.resetAllFilters();

            expect(messageService.add).toHaveBeenCalledWith({
                severity: "info",
                summary: "Filters Reset",
                detail: "All filters have been reset to default values",
            });
        });
    });

    describe("Apply Filters", () => {
        it("should call homeService with correct backend filter for online status", () => {
            component.updateFilter("onlineStatus", "online");
            component.applyFilters();

            expect(homeService.setFilter).toHaveBeenCalledWith("online");
        });

        it("should call homeService with 'all' for offline status", () => {
            component.updateFilter("onlineStatus", "offline");
            component.applyFilters();

            expect(homeService.setFilter).toHaveBeenCalledWith("all");
        });

        it("should pass gender filter to homeService when not 'all'", () => {
            component.updateFilter("gender", "male");
            component.applyFilters();

            expect(homeService.setAdvancedFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    gender: "male",
                }),
            );
        });

        it("should not pass gender filter when set to 'all'", () => {
            component.updateFilter("gender", "all");
            component.applyFilters();

            expect(homeService.setAdvancedFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    gender: undefined,
                }),
            );
        });

        it("should pass age filters when different from defaults", () => {
            component.updateFilters({ ageRange: [25, 40] });
            component.applyFilters();

            expect(homeService.setAdvancedFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    ageMin: 25,
                    ageMax: 40,
                }),
            );
        });

        it("should not pass age filters when set to defaults", () => {
            component.updateFilters({ ageRange: [18, 65] });
            component.applyFilters();

            expect(homeService.setAdvancedFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    ageMin: undefined,
                    ageMax: undefined,
                }),
            );
        });

        it("should join interests with comma", () => {
            component.updateFilter("interests", ["sports", "music", "travel"]);
            component.applyFilters();

            expect(homeService.setAdvancedFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    interests: "sports,music,travel",
                }),
            );
        });

        it("should not pass empty interests", () => {
            component.updateFilter("interests", []);
            component.applyFilters();

            expect(homeService.setAdvancedFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    interests: undefined,
                }),
            );
        });

        it("should pass relationship status when not 'all'", () => {
            component.updateFilter("relationshipStatus", "single");
            component.applyFilters();

            expect(homeService.setAdvancedFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    relationshipStatus: "single",
                }),
            );
        });

        it("should pass verifiedOnly when true", () => {
            component.updateFilter("verifiedOnly", true);
            component.applyFilters();

            expect(homeService.setAdvancedFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    verifiedOnly: true,
                }),
            );
        });

        it("should set loading state when applying filters", () => {
            component.isLoading.set(false);

            // Spy on isLoading.set to verify it was called with true
            const setLoadingSpy = jest.spyOn(component.isLoading, "set");

            component.applyFilters();

            // Check that setLoading was called with true (even though it may have been set back to false by now)
            expect(setLoadingSpy).toHaveBeenCalledWith(true);
        });

        it("should update users and show success message on successful filter apply", (done) => {
            messageService.add.mockClear(); // Clear any previous calls
            component.applyFilters();

            setTimeout(() => {
                expect(component.users()).toEqual(mockUsers);
                expect(component.isLoading()).toBe(false);
                expect(messageService.add).toHaveBeenCalledWith({
                    severity: "info",
                    summary: "Filters Applied",
                    detail: `Showing ${mockUsers.length} users`,
                    life: 3000,
                });
                done();
            }, 10);
        });

        it("should handle error when applying filters fails", (done) => {
            homeService.getFilteredAndSortedUsers = jest
                .fn()
                .mockReturnValue(throwError(() => new Error("Failed")));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            component.applyFilters();

            setTimeout(() => {
                expect(component.isLoading()).toBe(false);
                expect(consoleSpy).toHaveBeenCalledWith(
                    "Error applying filters:",
                    expect.any(Error),
                );
                consoleSpy.mockRestore();
                done();
            }, 100);
        });
    });

    describe("Age Range Slider", () => {
        it("should update age range and label on slider change", () => {
            const event = {
                values: [25, 40],
            } as any;

            component.onAgeRangeChange(event);

            expect(component.filters().ageRange).toEqual([25, 40]);
            expect(component.ageRangeLabel()).toBe("25 - 40 years");
        });

        it("should apply filters after age range change", () => {
            const applyFiltersSpy = jest.spyOn(component, "applyFilters");
            const event = { values: [20, 50] } as any;

            component.onAgeRangeChange(event);

            expect(applyFiltersSpy).toHaveBeenCalled();
        });

        it("should use current filter values if event.values is undefined", () => {
            component.updateFilters({ ageRange: [22, 45] });
            const event = { values: undefined } as any;

            component.onAgeRangeChange(event);

            expect(component.filters().ageRange).toEqual([22, 45]);
        });
    });

    describe("Distance Slider", () => {
        it("should update distance and label on slider change", () => {
            const event = {
                value: 50,
            } as any;

            component.onDistanceChange(event);

            expect(component.filters().distance).toBe(50);
            expect(component.distanceLabel()).toBe("Up to 50 km");
        });

        it("should apply filters after distance change", () => {
            const applyFiltersSpy = jest.spyOn(component, "applyFilters");
            const event = { value: 200 } as any;

            component.onDistanceChange(event);

            expect(applyFiltersSpy).toHaveBeenCalled();
        });

        it("should use current filter value if event.value is undefined", () => {
            component.updateFilter("distance", 150);
            const event = { value: undefined } as any;

            component.onDistanceChange(event);

            expect(component.filters().distance).toBe(150);
        });
    });

    describe("Filter Change Handler", () => {
        it("should trigger applyFilters on filter change", () => {
            const applyFiltersSpy = jest.spyOn(component, "applyFilters");

            component.onFilterChange();

            expect(applyFiltersSpy).toHaveBeenCalled();
        });
    });

    describe("Navigation", () => {
        it("should navigate to profile on card click", () => {
            const user = mockUsers[0];
            component.onCardClick(user);

            expect(router.navigate).toHaveBeenCalledWith(["/profile", user.id]);
        });

        it("should navigate to chat with query params on chat click", () => {
            const user = mockUsers[1];
            component.onChatClick(user);

            expect(router.navigate).toHaveBeenCalledWith(["/chat"], {
                queryParams: { userId: user.id },
            });
        });

        it("should navigate back to home", () => {
            component.goBack();

            expect(router.navigate).toHaveBeenCalledWith(["/home"]);
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
            messageService.add.mockClear(); // Clear any previous calls
            const user = { fullName: "Test User" } as HomeUser;
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

    describe("Pagination - Load More", () => {
        it("should load more users when conditions are met", () => {
            component.isLoadingMore.set(false);
            component.hasMoreData.set(true);

            // Mock window scroll properties
            Object.defineProperty(window, "scrollY", {
                value: 800,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(window, "innerHeight", {
                value: 600,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 1500,
                writable: true,
                configurable: true,
            });

            // Trigger scroll handler
            (component as any).onWindowScroll();

            expect(homeService.loadNextPage).toHaveBeenCalled();
        });

        it("should not load more if already loading", () => {
            component.isLoadingMore.set(true);
            component.hasMoreData.set(true);

            Object.defineProperty(window, "scrollY", {
                value: 800,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(window, "innerHeight", {
                value: 600,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 1500,
                writable: true,
                configurable: true,
            });

            (component as any).onWindowScroll();

            expect(homeService.loadNextPage).not.toHaveBeenCalled();
        });

        it("should not load more if no more data available", () => {
            component.isLoadingMore.set(false);
            component.hasMoreData.set(false);

            Object.defineProperty(window, "scrollY", {
                value: 800,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(window, "innerHeight", {
                value: 600,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 1500,
                writable: true,
                configurable: true,
            });

            (component as any).onWindowScroll();

            expect(homeService.loadNextPage).not.toHaveBeenCalled();
        });

        it("should not load more if scroll position below threshold", () => {
            component.isLoadingMore.set(false);
            component.hasMoreData.set(true);

            Object.defineProperty(window, "scrollY", {
                value: 100,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(window, "innerHeight", {
                value: 600,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 2000,
                writable: true,
                configurable: true,
            });

            (component as any).onWindowScroll();

            expect(homeService.loadNextPage).not.toHaveBeenCalled();
        });

        it("should set loading state when loading more", (done) => {
            component.isLoadingMore.set(false);
            component.hasMoreData.set(true);

            Object.defineProperty(window, "scrollY", {
                value: 800,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(window, "innerHeight", {
                value: 600,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 1500,
                writable: true,
                configurable: true,
            });

            (component as any).onWindowScroll();

            // Check that loading state was set
            setTimeout(() => {
                expect(component.isLoadingMore()).toBe(false); // Reset after completion
                done();
            }, 100);
        });

        it("should handle error when loading more fails", (done) => {
            messageService.add.mockClear(); // Clear any previous calls
            homeService.loadNextPage = jest
                .fn()
                .mockReturnValue(throwError(() => new Error("Failed")));

            component.isLoadingMore.set(false);
            component.hasMoreData.set(true);

            Object.defineProperty(window, "scrollY", {
                value: 800,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(window, "innerHeight", {
                value: 600,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(document.documentElement, "scrollHeight", {
                value: 1500,
                writable: true,
                configurable: true,
            });

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            (component as any).onWindowScroll();

            setTimeout(() => {
                expect(component.isLoadingMore()).toBe(false);
                expect(messageService.add).toHaveBeenCalledWith({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to load more users",
                });
                expect(consoleSpy).toHaveBeenCalled();
                consoleSpy.mockRestore();
                done();
            }, 10);
        });
    });

    describe("Lifecycle Hooks", () => {
        it("should add scroll event listener on init", () => {
            const addEventListenerSpy = jest.spyOn(window, "addEventListener");

            fixture.detectChanges(); // Triggers ngOnInit

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                "scroll",
                expect.any(Function),
            );

            addEventListenerSpy.mockRestore();
        });

        it("should remove scroll event listener on destroy", () => {
            const removeEventListenerSpy = jest.spyOn(
                window,
                "removeEventListener",
            );

            fixture.detectChanges(); // Triggers ngOnInit
            fixture.destroy(); // Triggers ngOnDestroy

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                "scroll",
                expect.any(Function),
            );

            removeEventListenerSpy.mockRestore();
        });
    });

    describe("Track By Function", () => {
        it("should return user id for trackBy", () => {
            const user = mockUsers[0];
            const result = component.trackByUserId(0, user);

            expect(result).toBe(user.id);
        });
    });

    describe("Filter Options", () => {
        it("should have correct gender options", () => {
            expect(component.genderOptions).toHaveLength(4);
            expect(component.genderOptions[0]).toEqual({
                label: "All Genders",
                value: "all",
            });
            expect(component.genderOptions[1]).toEqual({
                label: "Male",
                value: "male",
            });
            expect(component.genderOptions[2]).toEqual({
                label: "Female",
                value: "female",
            });
            expect(component.genderOptions[3]).toEqual({
                label: "Other",
                value: "other",
            });
        });

        it("should have correct online status options", () => {
            expect(component.onlineStatusOptions).toHaveLength(3);
            expect(component.onlineStatusOptions[0].value).toBe("all");
            expect(component.onlineStatusOptions[1].value).toBe("online");
            expect(component.onlineStatusOptions[2].value).toBe("offline");
        });

        it("should have correct relationship status options", () => {
            expect(component.relationshipStatusOptions).toHaveLength(5);
            expect(component.relationshipStatusOptions[0].value).toBe("all");
            expect(component.relationshipStatusOptions[1].value).toBe("single");
        });

        it("should have correct interests options", () => {
            expect(component.interestsOptions).toHaveLength(11);
            expect(component.interestsOptions[0].value).toBe("all");
            expect(component.interestsOptions).toContainEqual({
                label: "Sports",
                value: "sports",
            });
            expect(component.interestsOptions).toContainEqual({
                label: "Music",
                value: "music",
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle error when loading users fails", (done) => {
            const usersSubject = new BehaviorSubject<HomeUser[]>([]);
            homeService.users$ = usersSubject.asObservable();
            homeService.getFilteredAndSortedUsers = jest
                .fn()
                .mockReturnValue(throwError(() => new Error("Failed")));

            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            fixture = TestBed.createComponent(AdvancedSearchComponent);
            component = fixture.componentInstance;

            // Get the messageService from the new component instance
            const newMessageService = (component as any).messageService;
            const addSpy = jest.spyOn(newMessageService, "add");

            fixture.detectChanges();

            setTimeout(() => {
                expect(component.isLoading()).toBe(false);
                expect(addSpy).toHaveBeenCalledWith({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to load users",
                });
                expect(consoleSpy).toHaveBeenCalled();
                consoleSpy.mockRestore();
                done();
            }, 10);
        });

        it("should set loading to false when users subscription errors", (done) => {
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation();

            const usersSubject = new BehaviorSubject<HomeUser[]>([]);
            homeService.users$ = usersSubject.asObservable();

            fixture = TestBed.createComponent(AdvancedSearchComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            // Emit error
            setTimeout(() => {
                usersSubject.error(new Error("Test error"));
            }, 50);

            setTimeout(() => {
                expect(component.isLoading()).toBe(false);
                consoleSpy.mockRestore();
                done();
            }, 150);
        });
    });

    describe("Pagination State Updates", () => {
        it("should update totalUsers from pagination state", (done) => {
            const paginationSubject = new BehaviorSubject({
                currentPage: 2,
                totalPages: 5,
                totalUsers: 75,
                hasMore: true,
                limit: 12,
            });
            homeService.paginationState$ = paginationSubject.asObservable();

            fixture = TestBed.createComponent(AdvancedSearchComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            setTimeout(() => {
                expect(component.totalUsers()).toBe(75);
                expect(component.hasMoreData()).toBe(true);
                done();
            }, 100);
        });

        it("should clear loading states when page > 0", (done) => {
            const usersSubject = new BehaviorSubject<HomeUser[]>(mockUsers);
            const paginationSubject = new BehaviorSubject({
                currentPage: 2,
                totalPages: 5,
                totalUsers: 50,
                hasMore: true,
                limit: 12,
            });
            homeService.users$ = usersSubject.asObservable();
            homeService.paginationState$ = paginationSubject.asObservable();

            // Make getFilteredAndSortedUsers also emit through users$ to simulate real behavior
            homeService.getFilteredAndSortedUsers = jest
                .fn()
                .mockImplementation(() => {
                    // Emit through users$ subject after a microtask
                    Promise.resolve().then(() => usersSubject.next(mockUsers));
                    return of(mockUsers);
                });

            fixture = TestBed.createComponent(AdvancedSearchComponent);
            component = fixture.componentInstance;
            component.isLoading.set(true);
            component.isLoadingMore.set(true);
            fixture.detectChanges();

            // The pagination subscription and users$ emission should clear loading states
            setTimeout(() => {
                expect(component.isLoading()).toBe(false);
                expect(component.isLoadingMore()).toBe(false);
                done();
            }, 10);
        });
    });

    describe("Complex Filter Scenarios", () => {
        it("should apply multiple filters together", () => {
            component.updateFilters({
                gender: "female",
                onlineStatus: "online",
                ageRange: [25, 35],
                relationshipStatus: "single",
                interests: ["sports", "music"],
                verifiedOnly: true,
            });

            component.applyFilters();

            expect(homeService.setFilter).toHaveBeenCalledWith("online");
            expect(homeService.setAdvancedFilters).toHaveBeenCalledWith({
                gender: "female",
                ageMin: 25,
                ageMax: 35,
                interests: "sports,music",
                relationshipStatus: "single",
                verifiedOnly: true,
            });
        });

        it("should handle partial filter updates", () => {
            // Set initial filters
            component.updateFilters({
                gender: "male",
                onlineStatus: "online",
            });

            // Update only one filter
            component.updateFilter("relationshipStatus", "married");

            expect(component.filters().gender).toBe("male");
            expect(component.filters().onlineStatus).toBe("online");
            expect(component.filters().relationshipStatus).toBe("married");
        });
    });
});
