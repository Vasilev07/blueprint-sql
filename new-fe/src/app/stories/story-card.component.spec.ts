import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StoryCardComponent } from "./story-card.component";
import { Story } from "./story.service";

function createMockStory(overrides: Partial<Story> = {}): Story {
    return {
        id: "1",
        userId: "10",
        userName: "Alice",
        filePath: "/path/video.mp4",
        originalFilename: "video.mp4",
        fileSize: 1024,
        mimeType: "video/mp4",
        views: 42,
        createdAt: "2024-01-15T12:00:00Z",
        expiresAt: "2024-01-16T12:00:00Z",
        isProcessed: true,
        videoUrl: "video.mp4",
        thumbnailUrl: "thumb.jpg",
        caption: "Test caption",
        tags: ["fun", "test"],
        likes: 5,
        isLiked: false,
        ...overrides,
    };
}

describe("StoryCardComponent", () => {
    let fixture: ComponentFixture<StoryCardComponent>;
    let component: StoryCardComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StoryCardComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(StoryCardComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should not render card when story input is null", () => {
        fixture.detectChanges();
        const card = fixture.nativeElement.querySelector(".story-card");
        expect(card).toBeNull();
    });

    it("should render card when story input is set", () => {
        const mockStory = createMockStory();
        fixture.componentRef.setInput("story", mockStory);
        fixture.detectChanges();

        const card = fixture.nativeElement.querySelector(".story-card");
        expect(card).toBeTruthy();
        expect(fixture.nativeElement.textContent).toContain("Alice");
        expect(fixture.nativeElement.textContent).toContain("Test caption");
        expect(fixture.nativeElement.textContent).toContain("42");
        expect(fixture.nativeElement.textContent).toContain("5");
    });

    it("should render tags with @for", () => {
        const mockStory = createMockStory({ tags: ["fun", "test"] });
        fixture.componentRef.setInput("story", mockStory);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain("#fun");
        expect(fixture.nativeElement.textContent).toContain("#test");
    });

    it("should not render tags section when tags are empty", () => {
        const mockStory = createMockStory({ tags: [] });
        fixture.componentRef.setInput("story", mockStory);
        fixture.detectChanges();

        const tagsEl = fixture.nativeElement.querySelector(".story-tags");
        expect(tagsEl).toBeNull();
    });

    it("should show action buttons when showActions is true", () => {
        const mockStory = createMockStory();
        fixture.componentRef.setInput("story", mockStory);
        fixture.componentRef.setInput("showActions", true);
        fixture.detectChanges();

        const actions = fixture.nativeElement.querySelector(".story-actions");
        expect(actions).toBeTruthy();
    });

    it("should hide action buttons when showActions is false", () => {
        const mockStory = createMockStory();
        fixture.componentRef.setInput("story", mockStory);
        fixture.componentRef.setInput("showActions", false);
        fixture.detectChanges();

        const actions = fixture.nativeElement.querySelector(".story-actions");
        expect(actions).toBeNull();
    });

    it("should emit storyClick when card is clicked", () => {
        const mockStory = createMockStory({ id: "99" });
        fixture.componentRef.setInput("story", mockStory);
        fixture.detectChanges();

        const emitSpy = jest.fn();
        component.storyClick.subscribe(emitSpy);

        const card = fixture.nativeElement.querySelector(".story-card");
        card?.dispatchEvent(new Event("click"));
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledWith(mockStory);
    });

    it("should emit likeClick when like button is clicked and stop propagation", () => {
        const mockStory = createMockStory({ id: "99" });
        fixture.componentRef.setInput("story", mockStory);
        fixture.detectChanges();

        const emitSpy = jest.fn();
        component.likeClick.subscribe(emitSpy);

        const actions = fixture.nativeElement.querySelector(".story-actions");
        const likeBtn = actions?.querySelector("button");
        const ev = new Event("click", { bubbles: true });
        const stopSpy = jest.spyOn(ev, "stopPropagation");
        likeBtn?.dispatchEvent(ev);
        fixture.detectChanges();

        expect(stopSpy).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith(mockStory);
    });

    it("should not emit storyClick when story is null", () => {
        fixture.detectChanges();
        const emitSpy = jest.fn();
        component.storyClick.subscribe(emitSpy);

        component.onStoryClick();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    describe("formatTime", () => {
        it("should return 'Unknown time' for undefined", () => {
            expect(component.formatTime(undefined)).toBe("Unknown time");
        });

        it("should return 'Just now' for current time", () => {
            expect(component.formatTime(new Date())).toBe("Just now");
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

    describe("formatDuration", () => {
        it("should format seconds as m:ss", () => {
            expect(component.formatDuration(0)).toBe("0:00");
            expect(component.formatDuration(65)).toBe("1:05");
            expect(component.formatDuration(125)).toBe("2:05");
        });
    });

    describe("getTimeRemaining", () => {
        it("should return 'Expired' for undefined", () => {
            expect(component.getTimeRemaining(undefined)).toBe("Expired");
        });

        it("should return 'Expired' for past date", () => {
            const past = new Date();
            past.setHours(past.getHours() - 1);
            expect(component.getTimeRemaining(past)).toBe("Expired");
        });

        it("should return hours and minutes for future date", () => {
            const future = new Date();
            future.setHours(future.getHours() + 2);
            future.setMinutes(future.getMinutes() + 30);
            const result = component.getTimeRemaining(future);
            expect(result).toMatch(/\d+h \d+m left/);
        });
    });
});
