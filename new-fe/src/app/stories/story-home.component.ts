import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { Story, StoryService } from "./story.service";

export interface UserStoryGroup {
    userId: string;
    userName: string;
    userAvatar: string;
    stories: Story[];
    totalViews: number;
    hasUnviewed: boolean;
    latestStory: Story;
}

@Component({
    selector: "app-story-home",
    templateUrl: "./story-home.component.html",
    styleUrls: ["./story-home.component.scss"],
})
export class StoryHomeComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    stories: Story[] = [];
    groupedStories: UserStoryGroup[] = [];
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
                this.groupedStories = this.groupStoriesByUser(this.stories);
                console.log("Grouped stories:", this.groupedStories);
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

    onUserStoryGroupClick(group: UserStoryGroup): void {
        // Navigate to the first story of this user's group
        const firstStory = group.stories[0];
        console.log("User story group clicked:", group);
        console.log("Navigating to first story:", firstStory.id);

        this.router
            .navigate(["/stories/view", firstStory.id])
            .then((success) => {
                console.log("Navigation success:", success);
            })
            .catch((error) => {
                console.error("Navigation error:", error);
            });
    }

    groupStoriesByUser(stories: Story[]): UserStoryGroup[] {
        const groupMap = new Map<string, UserStoryGroup>();

        console.log('Grouping stories:', stories.map(s => ({ id: s.id, userId: s.userId, userName: s.userName })));

        stories.forEach(story => {
            console.log('Processing story:', story.id, 'userId:', story.userId, 'type:', typeof story.userId);
            
            if (!groupMap.has(story.userId)) {
                console.log('Creating new group for userId:', story.userId);
                groupMap.set(story.userId, {
                    userId: story.userId,
                    userName: story.userName,
                    userAvatar: story.userAvatar,
                    stories: [],
                    totalViews: 0,
                    hasUnviewed: false,
                    latestStory: story
                });
            } else {
                console.log('Adding to existing group for userId:', story.userId);
            }

            const group = groupMap.get(story.userId)!;
            group.stories.push(story);
            group.totalViews += story.views;
            
            if (!story.isViewed) {
                group.hasUnviewed = true;
            }

            // Keep the latest story as the representative
            if (story.createdAt > group.latestStory.createdAt) {
                group.latestStory = story;
            }
        });

        // Sort stories within each group by creation date (newest first)
        groupMap.forEach(group => {
            group.stories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        });

        // Convert map to array and sort by latest story date
        const result = Array.from(groupMap.values()).sort(
            (a, b) => b.latestStory.createdAt.getTime() - a.latestStory.createdAt.getTime()
        );
        
        console.log('Final groups:', result.map(g => ({ userId: g.userId, userName: g.userName, storyCount: g.stories.length })));
        
        return result;
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

    getTotalLikes(group: UserStoryGroup): number {
        return group.stories.reduce((sum, s) => sum + s.likes, 0);
    }
}

