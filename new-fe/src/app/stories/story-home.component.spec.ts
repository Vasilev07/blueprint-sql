import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, Subject, throwError } from "rxjs";
import { StoryHomeComponent, UserStoryGroup } from "./story-home.component";
import { Story, StoryService } from "./story.service";
import { UserService } from "src/typescript-api-client/src/api/api";

function createMockStory(overrides: Partial<Story> = {}): Story {
    return {
        id: "1",
        userId: "10",
        userName: "Alice",
        filePath: "/path/video.mp4",
        originalFilename: "video.mp4",
        fileSize: 1024,
        mimeType: "video/mp4",
        views: 5,
        createdAt: "2024-01-15T12:00:00Z",
        expiresAt: "2024-01-16T12:00:00Z",
        isProcessed: true,
        videoUrl: "video.mp4",
        thumbnailUrl: "thumb.jpg",
        likes: 2,
        isViewed: false,
        ...overrides,
    };
}

describe("StoryHomeComponent", () => {
    let component: StoryHomeComponent;
    let fixture: ComponentFixture<StoryHomeComponent>;
    let storyService: jest.Mocked<
        Pick<StoryService, "getStories" | "cleanupExpiredStories" | "likeStory">
    >;
    let userService: jest.Mocked<
        Pick<UserService, "getUser" | "getProfilePictureByUserId">
    >;
    let router: jest.Mocked<Router>;

    const mockStories: Story[] = [
        createMockStory({
            id: "1",
            userId: "10",
            userName: "Alice",
            views: 10,
            createdAt: "2024-01-15T10:00:00Z",
        }),
        createMockStory({
            id: "2",
            userId: "10",
            userName: "Alice",
            views: 5,
            createdAt: "2024-01-15T11:00:00Z",
        }),
        createMockStory({
            id: "3",
            userId: "20",
            userName: "Bob",
            views: 3,
            createdAt: "2024-01-15T09:00:00Z",
        }),
    ];

    beforeEach(async () => {
        storyService = {
            getStories: jest.fn().mockReturnValue(of(mockStories)),
            cleanupExpiredStories: jest.fn(),
            likeStory: jest.fn().mockReturnValue(of(false)),
        } as any;

        userService = {
            getUser: jest.fn().mockReturnValue(of({ id: 1, username: "me" })),
            getProfilePictureByUserId: jest.fn().mockReturnValue(
                of({
                    body: new Blob(),
                    status: 200,
                    headers: {} as any,
                    ok: true,
                }),
            ),
        } as any;

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        } as any;

        await TestBed.configureTestingModule({
            imports: [StoryHomeComponent],
            providers: [
                { provide: StoryService, useValue: storyService },
                { provide: UserService, useValue: userService },
                { provide: Router, useValue: router },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(StoryHomeComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should load current user and stories on init", () => {
        fixture.detectChanges();

        expect(userService.getUser).toHaveBeenCalled();
        expect(storyService.getStories).toHaveBeenCalled();
        expect(component.currentUserId()).toBe(1);
        expect(component.rawStories()).toEqual(mockStories);
        expect(component.isLoading()).toBe(false);
    });

    it("should set loading to true then false when loading stories", () => {
        const storiesSubject = new Subject<Story[]>();
        storyService.getStories.mockReturnValue(storiesSubject.asObservable());

        fixture = TestBed.createComponent(StoryHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.isLoading()).toBe(true);

        storiesSubject.next(mockStories);
        storiesSubject.complete();

        expect(component.isLoading()).toBe(false);
        expect(component.rawStories()).toEqual(mockStories);
    });

    it("should set loading to false on stories error", () => {
        storyService.getStories.mockReturnValue(
            throwError(() => new Error("Failed")),
        );

        fixture = TestBed.createComponent(StoryHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.isLoading()).toBe(false);
    });

    it("should compute groupedStories from rawStories", () => {
        fixture.detectChanges();

        const groups = component.groupedStories();
        expect(groups.length).toBe(2);
        const aliceGroup = groups.find((g) => g.userId === "10");
        const bobGroup = groups.find((g) => g.userId === "20");
        expect(aliceGroup?.stories.length).toBe(2);
        expect(aliceGroup?.userName).toBe("Alice");
        expect(aliceGroup?.totalViews).toBe(15);
        expect(bobGroup?.stories.length).toBe(1);
        expect(bobGroup?.userName).toBe("Bob");
    });

    it("should filter by selectedCategory (recent)", () => {
        component.rawStories.set(mockStories);
        component.selectedCategory.set("recent");
        fixture.detectChanges();

        const filtered = component.filteredStories();
        expect(filtered.length).toBe(3);
        expect(filtered[0].id).toBe("2");
        expect(filtered[1].id).toBe("1");
        expect(filtered[2].id).toBe("3");
    });

    it("should filter by searchQuery", () => {
        component.rawStories.set(mockStories);
        component.searchQuery.set("alice");
        fixture.detectChanges();

        const filtered = component.filteredStories();
        expect(filtered.length).toBe(2);
        expect(
            filtered.every((s) => s.userName?.toLowerCase().includes("alice")),
        ).toBe(true);
    });

    it("should have categories", () => {
        expect(component.categories.length).toBe(5);
        expect(component.categories[0]).toEqual({
            label: "All Stories",
            value: "all",
        });
    });

    describe("formatTime", () => {
        it("should return 'Just now' for very recent date", () => {
            const now = new Date();
            expect(component.formatTime(now)).toBe("Just now");
        });

        it("should return minutes ago", () => {
            const d = new Date();
            d.setMinutes(d.getMinutes() - 30);
            expect(component.formatTime(d)).toBe("30m ago");
        });

        it("should return hours ago", () => {
            const d = new Date();
            d.setHours(d.getHours() - 2);
            expect(component.formatTime(d)).toBe("2h ago");
        });

        it("should return days ago", () => {
            const d = new Date();
            d.setDate(d.getDate() - 3);
            expect(component.formatTime(d)).toBe("3d ago");
        });
    });

    describe("getTotalLikes", () => {
        it("should sum likes of all stories in group", () => {
            const group: UserStoryGroup = {
                userId: "10",
                userName: "Alice",
                userAvatar: "",
                stories: [
                    createMockStory({ likes: 3 }),
                    createMockStory({ likes: 7 }),
                ],
                totalViews: 0,
                hasUnviewed: false,
                latestStory: createMockStory(),
            };
            expect(component.getTotalLikes(group)).toBe(10);
        });

        it("should treat undefined likes as 0", () => {
            const group: UserStoryGroup = {
                userId: "10",
                userName: "Alice",
                userAvatar: "",
                stories: [createMockStory({ likes: undefined })],
                totalViews: 0,
                hasUnviewed: false,
                latestStory: createMockStory(),
            };
            expect(component.getTotalLikes(group)).toBe(0);
        });
    });

    it("onUploadClick should navigate to upload", () => {
        component.onUploadClick();
        expect(router.navigate).toHaveBeenCalledWith(["/stories/upload"]);
    });

    it("onUserStoryGroupClick should navigate to first story of group", () => {
        const group: UserStoryGroup = {
            userId: "10",
            userName: "Alice",
            userAvatar: "",
            stories: [
                createMockStory({ id: "first" }),
                createMockStory({ id: "second" }),
            ],
            totalViews: 0,
            hasUnviewed: false,
            latestStory: createMockStory({ id: "first" }),
        };
        component.onUserStoryGroupClick(group);
        expect(router.navigate).toHaveBeenCalledWith([
            "/stories/view",
            "first",
        ]);
    });

    it("navigateToUserProfile should navigate to profile and stop propagation", () => {
        const ev = new Event("click");
        jest.spyOn(ev, "stopPropagation");
        const group: UserStoryGroup = {
            userId: "42",
            userName: "User",
            userAvatar: "",
            stories: [],
            totalViews: 0,
            hasUnviewed: false,
            latestStory: createMockStory(),
        };
        component.navigateToUserProfile(group, ev);
        expect(ev.stopPropagation).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(["/profile", "42"]);
    });

    it("navigateToUserProfile should not navigate when userId is empty", () => {
        const group: UserStoryGroup = {
            userId: "",
            userName: "User",
            userAvatar: "",
            stories: [],
            totalViews: 0,
            hasUnviewed: false,
            latestStory: createMockStory(),
        };
        component.navigateToUserProfile(group, new Event("click"));
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it("onLikeStory should call storyService.likeStory and stop propagation", () => {
        const ev = new Event("click");
        jest.spyOn(ev, "stopPropagation");
        const story = createMockStory({ id: "99" });
        component.onLikeStory(story, ev);
        expect(ev.stopPropagation).toHaveBeenCalled();
        expect(storyService.likeStory).toHaveBeenCalledWith("99");
    });
});
