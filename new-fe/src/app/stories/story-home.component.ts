import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { Story, StoryService } from "./story.service";

@Component({
    selector: "app-story-home",
    templateUrl: "./story-home.component.html",
    styleUrls: ["./story-home.component.scss"],
})
export class StoryHomeComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    stories: Story[] = [];
    isLoading = false;
    selectedCategory = "all";
    searchQuery = "";

    categories = [
        { label: "All Stories", value: "all" },
        { label: "Trending", value: "trending" },
        { label: "Recent", value: "recent" },
        { label: "Most Liked", value: "most-liked" },
        { label: "Most Viewed", value: "most-viewed" },
    ];

    constructor(
        private router: Router,
        private storyService: StoryService,
    ) {}

    ngOnInit(): void {
        this.loadStories();

        // Cleanup expired stories every hour
        setInterval(
            () => {
                this.storyService.cleanupExpiredStories();
            },
            1000 * 60 * 60,
        );
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadStories(): void {
        this.isLoading = true;
        this.storyService
            .getStories()
            .pipe(takeUntil(this.destroy$))
            .subscribe((stories) => {
                console.log("Stories loaded:", stories);
                this.stories = this.filterStories(stories);
                console.log("Filtered stories:", this.stories);
                this.isLoading = false;
            });
    }

    filterStories(stories: Story[]): Story[] {
        let filtered = [...stories];

        // Apply category filter
        switch (this.selectedCategory) {
            case "trending":
                filtered = filtered.sort(
                    (a, b) => b.likes + b.comments - (a.likes + a.comments),
                );
                break;
            case "recent":
                filtered = filtered.sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                );
                break;
            case "most-liked":
                filtered = filtered.sort((a, b) => b.likes - a.likes);
                break;
            case "most-viewed":
                filtered = filtered.sort((a, b) => b.views - a.views);
                break;
        }

        // Apply search filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (story) =>
                    story.caption.toLowerCase().includes(query) ||
                    story.userName.toLowerCase().includes(query) ||
                    story.tags.some((tag) => tag.toLowerCase().includes(query)),
            );
        }

        return filtered;
    }

    onCategoryChange(): void {
        this.loadStories();
    }

    onSearch(): void {
        this.loadStories();
    }

    onStoryClick(story: Story): void {
        console.log("Story clicked:", story);
        console.log("Navigating to:", `/stories/view/${story.id}`);

        this.router
            .navigate(["/stories/view", story.id])
            .then((success) => {
                console.log("Navigation success:", success);
            })
            .catch((error) => {
                console.error("Navigation error:", error);
            });
    }

    onUploadClick(): void {
        this.router.navigate(["/stories/upload"]);
    }

    testNavigation(): void {
        console.log("Testing navigation...");
        this.router.navigate(["/stories/view", "1"]);
    }

    onLikeStory(story: Story, event: Event): void {
        event.stopPropagation();
        this.storyService.likeStory(story.id).subscribe();
    }

    onShareStory(story: Story, event: Event): void {
        event.stopPropagation();
        // Implement share functionality
        console.log("Sharing story:", story.id);
    }

    onMoreOptions(story: Story, event: Event): void {
        event.stopPropagation();
        // Implement more options menu
        console.log("More options for story:", story.id);
    }

    formatTime(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    getTimeRemaining(expiresAt: Date): string {
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m left`;
        }
        return `${minutes}m left`;
    }
}

