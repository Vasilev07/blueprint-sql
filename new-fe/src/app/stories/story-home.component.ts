import { Component, DestroyRef, inject, signal, computed } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { Story, StoryService } from "./story.service";
import { UserService } from "src/typescript-api-client/src/api/api";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";

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
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TooltipModule],
    templateUrl: "./story-home.component.html",
    styleUrls: ["./story-home.component.scss"],
})
export class StoryHomeComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);
    private readonly storyService = inject(StoryService);
    private readonly userService = inject(UserService);

    readonly rawStories = signal<Story[]>([]);
    readonly isLoading = signal(false);
    readonly selectedCategory = signal("all");
    readonly searchQuery = signal("");
    readonly currentUserId = signal<number | null>(null);
    readonly profilePictures = signal<Map<string, string>>(new Map());

    readonly filteredStories = computed(() =>
        this.filterStories(this.rawStories()),
    );
    readonly groupedStories = computed(() => {
        const groups = this.groupStoriesByUser(this.filteredStories());
        const pics = this.profilePictures();
        return groups.map((g) => ({
            ...g,
            userAvatar: pics.get(g.userId) ?? g.userAvatar,
        }));
    });

    readonly categories = [
        { label: "All Stories", value: "all" },
        { label: "Trending", value: "trending" },
        { label: "Recent", value: "recent" },
        { label: "Most Liked", value: "most-liked" },
        { label: "Most Viewed", value: "most-viewed" },
    ] as const;

    constructor() {
        this.userService
            .getUser()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (user) => {
                    this.currentUserId.set(user.id ?? null);
                },
                error: (error) => {
                    console.error("Error loading current user:", error);
                },
            });

        this.loadStories();

        const intervalId = setInterval(
            () => this.storyService.cleanupExpiredStories(),
            1000 * 60 * 60,
        );
        this.destroyRef.onDestroy(() => {
            clearInterval(intervalId);
            const map = this.profilePictures();
            map.forEach((url) => URL.revokeObjectURL(url));
            map.clear();
        });
    }

    loadStories(): void {
        this.isLoading.set(true);
        this.storyService
            .getStories()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (stories) => {
                    this.rawStories.set(stories);
                    this.loadProfilePictures();
                    this.isLoading.set(false);
                },
                error: () => this.isLoading.set(false),
            });
    }

    loadProfilePictures(): void {
        const groups = this.groupedStories();
        const uniqueUserIds = new Set(groups.map((g) => g.userId));

        uniqueUserIds.forEach((userIdStr) => {
            const userId = parseInt(userIdStr, 10);
            this.userService
                .getProfilePictureByUserId(userId, "response")
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (response) => {
                        const blob = response.body;
                        if (blob == null) return;
                        const blobUrl = URL.createObjectURL(blob);
                        this.profilePictures.update((m) => {
                            const next = new Map(m);
                            next.set(userIdStr, blobUrl);
                            return next;
                        });
                    },
                    error: (error: { status?: number }) => {
                        if (error.status !== 404) {
                            console.error(
                                `Error loading profile picture for user ${userId}:`,
                                error,
                            );
                        }
                    },
                });
        });
    }

    filterStories(stories: Story[]): Story[] {
        let filtered = [...stories];

        // Apply category filter
        switch (this.selectedCategory()) {
            case "trending":
                filtered = filtered.sort(
                    (a, b) =>
                        (b.likes || 0) + b.views - ((a.likes || 0) + a.views),
                );
                break;
            case "recent":
                filtered = filtered.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                );
                break;
            case "most-liked":
                filtered = filtered.sort(
                    (a, b) => (b.likes || 0) - (a.likes || 0),
                );
                break;
            case "most-viewed":
                filtered = filtered.sort((a, b) => b.views - a.views);
                break;
        }

        // Apply search filter
        if (this.searchQuery().trim()) {
            const query = this.searchQuery().toLowerCase();
            filtered = filtered.filter(
                (story) =>
                    (story.caption?.toLowerCase() || "").includes(query) ||
                    (story.userName?.toLowerCase() || "").includes(query) ||
                    (story.tags || []).some((tag) =>
                        tag.toLowerCase().includes(query),
                    ),
            );
        }

        return filtered;
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
        console.log("User story group clicked:", group);

        // Navigate to the first story of this user's group (including own stories)
        const firstStory = group.stories[0];
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

        stories.forEach((story) => {
            if (story.userId == null || story.userId === "") {
                return;
            }
            if (!groupMap.has(story.userId)) {
                console.log("Creating new group for userId:", story.userId);
                groupMap.set(story.userId, {
                    userId: story.userId,
                    userName: story.userName || "Unknown",
                    userAvatar: story.userAvatar || "",
                    stories: [],
                    totalViews: 0,
                    hasUnviewed: false,
                    latestStory: story,
                });
            } else {
                console.log(
                    "Adding to existing group for userId:",
                    story.userId,
                );
            }

            const group = groupMap.get(story.userId)!;
            group.stories.push(story);
            group.totalViews += story.views;

            if (!story.isViewed) {
                group.hasUnviewed = true;
            }

            // Keep the latest story as the representative
            if (
                new Date(story.createdAt) >
                new Date(group.latestStory?.createdAt || 0)
            ) {
                group.latestStory = story;
            }
        });

        // Sort stories within each group by creation date (newest first)
        groupMap.forEach((group) => {
            group.stories.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            );
        });

        // Convert map to array and sort by latest story date
        const result = Array.from(groupMap.values()).sort(
            (a, b) =>
                new Date(b.latestStory.createdAt).getTime() -
                new Date(a.latestStory.createdAt).getTime(),
        );

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

    formatTime(date: string | Date): string {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
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

    getTimeRemaining(expiresAt: string | Date): string {
        const now = new Date();
        const diff = new Date(expiresAt).getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m left`;
        }
        return `${minutes}m left`;
    }

    getTotalLikes(group: UserStoryGroup): number {
        return group.stories.reduce((sum, s) => sum + (s.likes || 0), 0);
    }

    navigateToUserProfile(group: UserStoryGroup, event: Event): void {
        // Prevent triggering the story card click
        event.stopPropagation();

        if (group.userId) {
            console.log("Navigating to user profile:", group.userId);
            this.router.navigate(["/profile", group.userId]);
        }
    }
}
