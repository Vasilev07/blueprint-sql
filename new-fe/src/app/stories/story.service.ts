import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";
import { delay, tap } from "rxjs/operators";
import {
    StoriesService,
    StoryDTO,
    StoryUploadResponseDTO,
} from "src/typescript-api-client/src";

export interface Story {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    videoUrl: string;
    thumbnailUrl: string;
    caption: string;
    duration: number; // in seconds
    views: number;
    likes: number;
    comments: number;
    createdAt: Date;
    expiresAt: Date; // Stories expire after 24 hours
    tags: string[];
    isLiked: boolean;
    isViewed: boolean;
}

export interface StoryComment {
    id: string;
    storyId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    createdAt: Date;
    likes: number;
}

@Injectable({
    providedIn: "root",
})
export class StoryService {
    private storiesSubject = new BehaviorSubject<Story[]>([]);
    private commentsSubject = new BehaviorSubject<StoryComment[]>([]);

    public stories$ = this.storiesSubject.asObservable();
    public comments$ = this.commentsSubject.asObservable();

    constructor(private storiesApiService: StoriesService) {
        this.initializeMockData();
    }

    loadStories(): void {
        this.storiesApiService
            .getAllStories()
            .subscribe((stories: StoryDTO[]) => {
                const mappedStories = stories.map((dto) =>
                    this.mapDTOToStory(dto),
                );
                this.storiesSubject.next(mappedStories);
            });
    }

    private initializeMockData() {
        const mockStories: Story[] = [
            {
                id: "1",
                userId: "2",
                userName: "Jane Smith",
                userAvatar:
                    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
                videoUrl:
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
                caption:
                    "Amazing sunset at the beach! 🌅 #sunset #beach #nature",
                duration: 15,
                views: 1247,
                likes: 89,
                comments: 12,
                createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23.5), // 23.5 hours left
                tags: ["sunset", "beach", "nature"],
                isLiked: false,
                isViewed: false,
            },
            {
                id: "2",
                userId: "3",
                userName: "Mike Johnson",
                userAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                videoUrl:
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
                caption:
                    "Morning workout routine 💪 #fitness #workout #motivation",
                duration: 20,
                views: 892,
                likes: 67,
                comments: 8,
                createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23.25), // 23.25 hours left
                tags: ["fitness", "workout", "motivation"],
                isLiked: true,
                isViewed: true,
            },
            {
                id: "3",
                userId: "4",
                userName: "Sarah Wilson",
                userAvatar:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
                videoUrl:
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=600&fit=crop",
                caption:
                    "Cooking my favorite pasta recipe 🍝 #cooking #food #pasta",
                duration: 25,
                views: 1567,
                likes: 134,
                comments: 23,
                createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23), // 23 hours left
                tags: ["cooking", "food", "pasta"],
                isLiked: false,
                isViewed: false,
            },
            {
                id: "4",
                userId: "5",
                userName: "David Brown",
                userAvatar:
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
                videoUrl:
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop",
                caption:
                    "Hiking in the mountains 🏔️ #hiking #mountains #adventure",
                duration: 18,
                views: 2034,
                likes: 156,
                comments: 31,
                createdAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22.5), // 22.5 hours left
                tags: ["hiking", "mountains", "adventure"],
                isLiked: true,
                isViewed: true,
            },
            {
                id: "5",
                userId: "6",
                userName: "Emily Davis",
                userAvatar:
                    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
                videoUrl:
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                thumbnailUrl:
                    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop",
                caption: "Dance practice session 💃 #dance #practice #art",
                duration: 22,
                views: 1789,
                likes: 98,
                comments: 15,
                createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22), // 22 hours left
                tags: ["dance", "practice", "art"],
                isLiked: false,
                isViewed: false,
            },
        ];

        const mockComments: StoryComment[] = [
            {
                id: "1",
                storyId: "1",
                userId: "3",
                userName: "Mike Johnson",
                userAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                content: "Beautiful sunset! Where is this?",
                createdAt: new Date(Date.now() - 1000 * 60 * 25),
                likes: 3,
            },
            {
                id: "2",
                storyId: "1",
                userId: "4",
                userName: "Sarah Wilson",
                userAvatar:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
                content: "Love the colors! 🌅",
                createdAt: new Date(Date.now() - 1000 * 60 * 20),
                likes: 5,
            },
            {
                id: "3",
                storyId: "2",
                userId: "1",
                userName: "You",
                userAvatar:
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                content: "Great workout! Keep it up! 💪",
                createdAt: new Date(Date.now() - 1000 * 60 * 40),
                likes: 2,
            },
        ];

        this.storiesSubject.next(mockStories);
        this.commentsSubject.next(mockComments);
    }

    getStories(): Observable<Story[]> {
        return this.stories$.pipe(delay(500)); // Simulate API delay
    }

    getStoryById(storyId: string): Observable<Story | undefined> {
        const stories = this.storiesSubject.value;
        const story = stories.find((s) => s.id === storyId);
        return of(story).pipe(delay(300));
    }

    getCommentsByStoryId(storyId: string): Observable<StoryComment[]> {
        const comments = this.commentsSubject.value;
        const storyComments = comments.filter((c) => c.storyId === storyId);
        return of(storyComments).pipe(delay(200));
    }

    likeStory(storyId: string): Observable<boolean> {
        const stories = this.storiesSubject.value;
        const storyIndex = stories.findIndex((s) => s.id === storyId);

        if (storyIndex !== -1) {
            const updatedStories = [...stories];
            const story = updatedStories[storyIndex];

            if (story.isLiked) {
                story.likes--;
                story.isLiked = false;
            } else {
                story.likes++;
                story.isLiked = true;
            }

            this.storiesSubject.next(updatedStories);
            return of(true);
        }

        return of(false);
    }

    viewStory(storyId: string): Observable<boolean> {
        const stories = this.storiesSubject.value;
        const storyIndex = stories.findIndex((s) => s.id === storyId);

        if (storyIndex !== -1) {
            const updatedStories = [...stories];
            const story = updatedStories[storyIndex];

            if (!story.isViewed) {
                story.views++;
                story.isViewed = true;
                this.storiesSubject.next(updatedStories);
            }

            return of(true);
        }

        return of(false);
    }

    addComment(storyId: string, content: string): Observable<StoryComment> {
        const newComment: StoryComment = {
            id: Date.now().toString(),
            storyId,
            userId: "1", // Current user
            userName: "You",
            userAvatar:
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
            content,
            createdAt: new Date(),
            likes: 0,
        };

        const comments = this.commentsSubject.value;
        const updatedComments = [...comments, newComment];
        this.commentsSubject.next(updatedComments);

        // Update story comment count
        const stories = this.storiesSubject.value;
        const storyIndex = stories.findIndex((s) => s.id === storyId);
        if (storyIndex !== -1) {
            const updatedStories = [...stories];
            updatedStories[storyIndex].comments++;
            this.storiesSubject.next(updatedStories);
        }

        return of(newComment);
    }

    uploadStory(videoFile: File): Observable<StoryUploadResponseDTO> {
        return this.storiesApiService
            .uploadStory(videoFile)
            .pipe(tap(() => this.loadStories()));
    }

    deleteStory(storyId: string): Observable<boolean> {
        const stories = this.storiesSubject.value;
        const updatedStories = stories.filter((s) => s.id !== storyId);
        this.storiesSubject.next(updatedStories);

        // Remove related comments
        const comments = this.commentsSubject.value;
        const updatedComments = comments.filter((c) => c.storyId !== storyId);
        this.commentsSubject.next(updatedComments);

        return of(true);
    }

    getExpiredStories(): Story[] {
        const now = new Date();
        return this.storiesSubject.value.filter(
            (story) => story.expiresAt < now,
        );
    }

    cleanupExpiredStories(): void {
        const validStories = this.storiesSubject.value.filter(
            (story) => story.expiresAt > new Date(),
        );
        this.storiesSubject.next(validStories);
    }

    private mapDTOToStory(dto: StoryDTO): Story {
        const videoFilename = dto.filePath.split("/").pop();
        const thumbnailFilename = dto.thumbnailPath?.split("/").pop();

        return {
            id: dto.id.toString(),
            userId: dto.userId.toString(),
            userName: dto.userName || "Unknown",
            userAvatar: "",
            videoUrl: `${this.storiesApiService.configuration.basePath}/stories/video/${videoFilename}`,
            thumbnailUrl: thumbnailFilename
                ? `${this.storiesApiService.configuration.basePath}/stories/thumbnail/${thumbnailFilename}`
                : "",
            caption: "",
            duration: dto.duration || 0,
            views: dto.views,
            likes: 0,
            comments: 0,
            createdAt: new Date(dto.createdAt),
            expiresAt: new Date(dto.expiresAt),
            tags: [],
            isLiked: false,
            isViewed: false,
        };
    }
}
