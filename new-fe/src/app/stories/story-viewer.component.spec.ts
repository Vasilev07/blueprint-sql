import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { MessageService } from "primeng/api";
import { StoryViewerComponent } from "./story-viewer.component";
import { Story, StoryService } from "./story.service";

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
        likes: 0,
        isViewed: false,
        ...overrides,
    };
}

describe("StoryViewerComponent", () => {
    let component: StoryViewerComponent;
    let fixture: ComponentFixture<StoryViewerComponent>;
    let storyService: jest.Mocked<
        Pick<
            StoryService,
            | "getStories"
            | "getStoryById"
            | "getVideoBlobUrl"
            | "getThumbnailBlobUrl"
            | "viewStory"
            | "likeStory"
        >
    >;
    let router: jest.Mocked<Router>;
    let paramsSubject: Subject<{ storyId?: string }>;

    const mockStory = createMockStory({
        id: "1",
        userId: "10",
        userName: "Alice",
        mimeType: "video/mp4",
        videoUrl: "video.mp4",
        thumbnailUrl: "thumb.jpg",
    });

    beforeEach(async () => {
        paramsSubject = new Subject<{ storyId?: string }>();

        storyService = {
            getStories: jest.fn().mockReturnValue(of([mockStory])),
            getStoryById: jest.fn().mockReturnValue(of(mockStory)),
            getVideoBlobUrl: jest.fn().mockReturnValue(of("blob:video")),
            getThumbnailBlobUrl: jest.fn().mockReturnValue(of("blob:thumb")),
            viewStory: jest.fn().mockReturnValue(of(true)),
            likeStory: jest.fn().mockReturnValue(of(false)),
        } as any;

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        } as any;

        await TestBed.configureTestingModule({
            imports: [StoryViewerComponent],
            providers: [
                { provide: StoryService, useValue: storyService },
                {
                    provide: ActivatedRoute,
                    useValue: { params: paramsSubject.asObservable() },
                },
                { provide: Router, useValue: router },
                MessageService,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(StoryViewerComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should show loading until story is loaded", () => {
        expect(component.isLoading()).toBe(true);
        paramsSubject.next({ storyId: "1" });
        fixture.detectChanges();
        expect(component.isLoading()).toBe(false);
        expect(component.story()).toEqual(mockStory);
    });

    it("should load story when route params emit storyId", () => {
        paramsSubject.next({ storyId: "1" });
        fixture.detectChanges();

        expect(storyService.getStoryById).toHaveBeenCalledWith("1");
        expect(component.story()).toEqual(mockStory);
        expect(component.isVideo()).toBe(true);
        expect(component.allStories().length).toBe(1);
        expect(component.currentStoryIndex()).toBe(0);
    });

    it("should navigate to /stories when story not found", () => {
        storyService.getStoryById.mockReturnValue(of(undefined));
        paramsSubject.next({ storyId: "999" });
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith(["/stories"]);
    });

    it("should call viewStory when story is loaded", () => {
        paramsSubject.next({ storyId: "1" });
        fixture.detectChanges();

        expect(storyService.viewStory).toHaveBeenCalledWith("1");
    });

    it("onClose should navigate to /stories", () => {
        component.onClose();
        expect(router.navigate).toHaveBeenCalledWith(["/stories"]);
    });

    it("onGoBack should navigate to /stories", () => {
        component.onGoBack();
        expect(router.navigate).toHaveBeenCalledWith(["/stories"]);
    });

    it("navigateToProfile should navigate to profile with userId when story exists", () => {
        component.story.set(mockStory);
        component.navigateToProfile();
        expect(router.navigate).toHaveBeenCalledWith(["/profile", "10"]);
    });

    it("navigateToProfile should not navigate when story has no userId", () => {
        component.story.set(createMockStory({ userId: "" }));
        component.navigateToProfile();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it("previousStory should navigate to previous story when not at first", () => {
        component.allStories.set([
            createMockStory({ id: "1" }),
            createMockStory({ id: "2" }),
        ]);
        component.currentStoryIndex.set(1);
        component.previousStory();
        expect(router.navigate).toHaveBeenCalledWith(["/stories/view", "1"]);
    });

    it("nextStory should navigate to next story when not at last", () => {
        component.allStories.set([
            createMockStory({ id: "1" }),
            createMockStory({ id: "2" }),
        ]);
        component.currentStoryIndex.set(0);
        component.nextStory();
        expect(router.navigate).toHaveBeenCalledWith(["/stories/view", "2"]);
    });

    it("nextStory should navigate to /stories when at last story", () => {
        component.allStories.set([createMockStory({ id: "1" })]);
        component.currentStoryIndex.set(0);
        component.nextStory();
        expect(router.navigate).toHaveBeenCalledWith(["/stories"]);
    });

    describe("formatTime", () => {
        it("should format number as m:ss (duration)", () => {
            expect(component.formatTime(0)).toBe("0:00");
            expect(component.formatTime(65)).toBe("1:05");
            expect(component.formatTime(90)).toBe("1:30");
        });

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

    describe("getProgressWidth", () => {
        it("should return 100 for completed (index < current)", () => {
            component.currentStoryIndex.set(2);
            component.storyProgress.set(50);
            expect(component.getProgressWidth(0)).toBe(100);
            expect(component.getProgressWidth(1)).toBe(100);
        });

        it("should return storyProgress for active index", () => {
            component.currentStoryIndex.set(1);
            component.storyProgress.set(45);
            expect(component.getProgressWidth(1)).toBe(45);
        });

        it("should return 0 for not started (index > current)", () => {
            component.currentStoryIndex.set(0);
            expect(component.getProgressWidth(1)).toBe(0);
            expect(component.getProgressWidth(2)).toBe(0);
        });
    });

    it("onLikeStory should call storyService.likeStory", () => {
        component.story.set(mockStory);
        component.onLikeStory();
        expect(storyService.likeStory).toHaveBeenCalledWith("1");
    });

    it("should set isImage when story mimeType is image", () => {
        const imageStory = createMockStory({
            id: "2",
            mimeType: "image/jpeg",
        });
        storyService.getStoryById.mockReturnValue(of(imageStory));
        paramsSubject.next({ storyId: "2" });
        fixture.detectChanges();

        expect(component.isImage()).toBe(true);
        expect(component.isVideo()).toBe(false);
    });
});
