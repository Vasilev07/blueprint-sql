import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of, forkJoin } from "rxjs";
import { tap, map, catchError } from "rxjs/operators";
import {
    StoriesService,
    StoryDTO,
    StoryUploadResponseDTO,
} from "src/typescript-api-client/src";

// Re-export backend types
export type { StoryDTO, StoryUploadResponseDTO };

// UI wrapper around backend DTO
export interface Story {
    // From backend
    id: string; // Converted to string for router
    userId: string; // Converted to string for UI
    userName?: string;
    filePath: string;
    originalFilename: string;
    fileSize: number;
    duration?: number;
    mimeType: string;
    width?: number;
    height?: number;
    thumbnailPath?: string;
    views: number;
    createdAt: string;
    expiresAt: string;
    isProcessed: boolean;

    // UI-specific fields
    userAvatar?: string;
    videoUrl: string;
    thumbnailUrl: string;

    // Future features
    caption?: string;
    tags?: string[];
    likes?: number;
    comments?: number;
    isLiked?: boolean;
    isViewed?: boolean;
}

@Injectable({
    providedIn: "root",
})
export class StoryService {
    private storiesSubject = new BehaviorSubject<Story[]>([]);

    public stories$ = this.storiesSubject.asObservable();

    constructor(private storiesApiService: StoriesService) {
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
                            map((blobUrl) => ({ index, blobUrl })),
                        );
                    }
                    return of({ index, blobUrl: "" });
                });

                // Load all thumbnails in parallel
                if (thumbnailRequests.length > 0) {
                    forkJoin(thumbnailRequests).subscribe((results) => {
                        results.forEach((result) => {
                            if (result.blobUrl) {
                                mappedStories[result.index].thumbnailUrl =
                                    result.blobUrl;
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
        console.log("getStoryById:", {
            storyId,
            found: !!story,
            totalStories: stories.length,
            story,
        });
        return of(story);
    }

    likeStory(_storyId: string): Observable<boolean> {
        // TODO: Implement backend like endpoint
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
            map(() => true),
        );
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
            }),
            map(() => true),
        );
    }

    getExpiredStories(): Story[] {
        const now = new Date();
        return this.storiesSubject.value.filter(
            (story) => new Date(story.expiresAt) < now,
        );
    }

    cleanupExpiredStories(): void {
        const validStories = this.storiesSubject.value.filter(
            (story) => new Date(story.expiresAt) > new Date(),
        );
        this.storiesSubject.next(validStories);
    }

    getVideoBlobUrl(filename: string): Observable<string> {
        return this.storiesApiService.streamVideo(filename, "response").pipe(
            map((response) => {
                const blob = response.body as Blob;
                return URL.createObjectURL(blob);
            }),
            catchError((error) => {
                console.error("Error loading video:", error);
                return of("");
            }),
        );
    }

    getThumbnailBlobUrl(filename: string): Observable<string> {
        return this.storiesApiService.getThumbnail(filename, "response").pipe(
            map((response) => {
                const blob = response.body as Blob;
                return URL.createObjectURL(blob);
            }),
            catchError((error) => {
                console.error("Error loading thumbnail:", error);
                return of("");
            }),
        );
    }

    private mapDTOToStory(dto: StoryDTO): Story {
        const videoFilename = dto.filePath.split("/").pop() || "";
        const thumbnailFilename = dto.thumbnailPath?.split("/").pop();

        return {
            ...dto,
            id: dto.id.toString(),
            userId: dto.userId.toString(),
            userAvatar: "",
            videoUrl: videoFilename,
            thumbnailUrl: thumbnailFilename || "",
            // Future features (not in backend yet)
            likes: 0,
            comments: 0,
            isLiked: false,
            isViewed: false,
        };
    }
}
