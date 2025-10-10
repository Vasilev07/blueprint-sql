import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of, forkJoin } from "rxjs";
import { tap, map, catchError } from "rxjs/operators";
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

    constructor(
        private storiesApiService: StoriesService
    ) {
        this.loadStories();
    }

    loadStories(): void {
        this.storiesApiService
            .getAllStories()
            .subscribe((stories: StoryDTO[]) => {
                const mappedStories = stories.map((dto) =>
                    this.mapDTOToStory(dto),
                );
                
                // Load thumbnail blob URLs for all stories
                const thumbnailRequests = mappedStories.map((story, index) => {
                    if (story.thumbnailUrl) {
                        const filename = story.thumbnailUrl;
                        return this.getThumbnailBlobUrl(filename).pipe(
                            map(blobUrl => ({ index, blobUrl }))
                        );
                    }
                    return of({ index, blobUrl: '' });
                });
                
                // Load all thumbnails in parallel
                if (thumbnailRequests.length > 0) {
                    forkJoin(thumbnailRequests).subscribe(results => {
                        results.forEach(result => {
                            if (result.blobUrl) {
                                mappedStories[result.index].thumbnailUrl = result.blobUrl;
                            }
                        });
                        this.storiesSubject.next(mappedStories);
                    });
                } else {
                    this.storiesSubject.next(mappedStories);
                }
            });
    }

    getStories(): Observable<Story[]> {
        return this.stories$;
    }

    getStoryById(storyId: string): Observable<Story | undefined> {
        const stories = this.storiesSubject.value;
        const story = stories.find((s) => s.id === storyId);
        console.log('getStoryById:', { storyId, found: !!story, totalStories: stories.length, story });
        return of(story);
    }

    getCommentsByStoryId(storyId: string): Observable<StoryComment[]> {
        return of([]);
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
        const numericId = parseInt(storyId, 10);
        return this.storiesApiService.incrementViews(numericId).pipe(
            tap(() => {
                const stories = this.storiesSubject.value;
                const storyIndex = stories.findIndex((s) => s.id === storyId);
                if (storyIndex !== -1) {
                    const updatedStories = [...stories];
                    updatedStories[storyIndex].views++;
                    updatedStories[storyIndex].isViewed = true;
                    this.storiesSubject.next(updatedStories);
                }
            }),
            map(() => true)
        );
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
        const numericId = parseInt(storyId, 10);
        return this.storiesApiService.deleteStory(numericId).pipe(
            tap(() => {
                const stories = this.storiesSubject.value;
                const updatedStories = stories.filter((s) => s.id !== storyId);
                this.storiesSubject.next(updatedStories);

                const comments = this.commentsSubject.value;
                const updatedComments = comments.filter((c) => c.storyId !== storyId);
                this.commentsSubject.next(updatedComments);
            }),
            map(() => true)
        );
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

    getVideoBlobUrl(filename: string): Observable<string> {
        return this.storiesApiService.streamVideo(filename, 'response').pipe(
            map(response => {
                const blob = response.body as Blob;
                return URL.createObjectURL(blob);
            }),
            catchError(error => {
                console.error('Error loading video:', error);
                return of('');
            })
        );
    }

    getThumbnailBlobUrl(filename: string): Observable<string> {
        return this.storiesApiService.getThumbnail(filename, 'response').pipe(
            map(response => {
                const blob = response.body as Blob;
                return URL.createObjectURL(blob);
            }),
            catchError(error => {
                console.error('Error loading thumbnail:', error);
                return of('');
            })
        );
    }

    private mapDTOToStory(dto: StoryDTO): Story {
        const videoFilename = dto.filePath.split("/").pop() || '';
        const thumbnailFilename = dto.thumbnailPath?.split("/").pop();

        return {
            id: dto.id.toString(),
            userId: dto.userId.toString(),
            userName: dto.userName || "Unknown",
            userAvatar: "",
            videoUrl: videoFilename,
            thumbnailUrl: thumbnailFilename || "",
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
