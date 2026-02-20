import {
    Component,
    DestroyRef,
    ElementRef,
    HostListener,
    inject,
    signal,
    viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { Story, StoryService } from "./story.service";
import { ButtonModule } from "primeng/button";
import { ToastModule } from "primeng/toast";

@Component({
    selector: "app-story-viewer",
    standalone: true,
    imports: [ButtonModule, ToastModule],
    templateUrl: "./story-viewer.component.html",
    styleUrls: ["./story-viewer.component.scss"],
})
export class StoryViewerComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly storyService = inject(StoryService);

    readonly videoPlayer = viewChild<ElementRef<HTMLVideoElement>>("videoPlayer");

    readonly story = signal<Story | null>(null);
    readonly videoBlobUrl = signal("");
    readonly thumbnailBlobUrl = signal("");
    readonly isLoading = signal(true);
    readonly isPlaying = signal(false);
    readonly currentTime = signal(0);
    readonly duration = signal(0);
    readonly volume = signal(1);
    readonly isMuted = signal(false);
    readonly isLiked = signal(false);
    readonly isFullscreen = signal(false);
    readonly autoPlay = true;
    readonly isImage = signal(false);
    readonly isVideo = signal(false);

    readonly allStories = signal<Story[]>([]);
    readonly currentStoryIndex = signal(0);
    readonly liveViewerCount = signal(0);
    readonly storyProgress = signal(0);

    private allStoriesOriginal: Story[] = [];
    private viewerInterval: ReturnType<typeof setInterval> | null = null;
    private progressInterval: ReturnType<typeof setInterval> | null = null;
    private imageTimerInterval: ReturnType<typeof setInterval> | null = null;
    private touchStartX = 0;
    private touchStartY = 0;
    private touchEndX = 0;
    private touchEndY = 0;

    constructor() {
        this.storyService
            .getStories()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((stories) => {
                this.allStoriesOriginal = stories;
            });

        this.route.params
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((params) => {
                const storyId = params["storyId"];
                if (storyId) {
                    this.loadStory(storyId);
                }
            });

        this.destroyRef.onDestroy(() => {
            this.stopLiveViewerSimulation();
            this.stopProgressAnimation();
            this.stopImageTimer();
        });
    }

    private getVideoElement(): HTMLVideoElement | null {
        return this.videoPlayer()?.nativeElement ?? null;
    }

    @HostListener("document:keydown.escape", ["$event"])
    onEscapeKey(_event: Event): void {
        this.onClose();
    }

    @HostListener("document:keydown.arrowleft", ["$event"])
    onLeftArrowKey(event: Event): void {
        event.preventDefault();
        this.previousStory();
    }

    @HostListener("document:keydown.arrowright", ["$event"])
    onRightArrowKey(event: Event): void {
        event.preventDefault();
        this.nextStory();
    }

    @HostListener("document:keydown.space", ["$event"])
    onSpaceKey(event: Event): void {
        event.preventDefault();
        this.togglePlayPause();
    }

    private loadStory(storyId: string): void {
        this.isLoading.set(true);

        const prevVideoUrl = this.videoBlobUrl();
        if (prevVideoUrl) {
            URL.revokeObjectURL(prevVideoUrl);
            this.videoBlobUrl.set("");
        }
        const prevThumbUrl = this.thumbnailBlobUrl();
        if (prevThumbUrl) {
            URL.revokeObjectURL(prevThumbUrl);
            this.thumbnailBlobUrl.set("");
        }

        this.storyService
            .getStoryById(storyId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((s) => {
                if (s) {
                    this.story.set(s);
                    this.isLiked.set(s.isLiked ?? false);
                    this.isImage.set(s.mimeType?.startsWith("image/") ?? false);
                    this.isVideo.set(s.mimeType?.startsWith("video/") ?? false);

                    const userStories = this.allStoriesOriginal
                        .filter((x) => x.userId === s.userId)
                        .sort(
                            (a, b) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime(),
                        );
                    this.allStories.set(userStories);
                    const idx = userStories.findIndex((x) => x.id === storyId);
                    this.currentStoryIndex.set(idx >= 0 ? idx : 0);

                    this.markAsViewed(storyId);
                    this.startLiveViewerSimulation();

                    this.storyService
                        .getVideoBlobUrl(s.videoUrl)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe((blobUrl) => {
                            this.videoBlobUrl.set(blobUrl);

                            if (this.isVideo()) {
                                setTimeout(() => {
                                    if (
                                        this.autoPlay &&
                                        this.getVideoElement()
                                    ) {
                                        this.playVideo();
                                    }
                                }, 500);
                            } else if (this.isImage()) {
                                this.duration.set(s.duration ?? 30);
                                this.isPlaying.set(true);
                                this.startImageTimer();
                                this.startProgressAnimation();
                            }
                        });

                    if (s.thumbnailUrl) {
                        this.storyService
                            .getThumbnailBlobUrl(s.thumbnailUrl)
                            .pipe(takeUntilDestroyed(this.destroyRef))
                            .subscribe((blobUrl) => {
                                this.thumbnailBlobUrl.set(blobUrl);
                            });
                    }
                } else {
                    this.router.navigate(["/stories"]);
                }
                this.isLoading.set(false);
            });
    }

    private markAsViewed(storyId: string): void {
        this.storyService.viewStory(storyId).subscribe();
    }

    playVideo(): void {
        const el = this.getVideoElement();
        if (el) {
            el.play();
            this.isPlaying.set(true);
        }
    }

    pauseVideo(): void {
        const el = this.getVideoElement();
        if (el) {
            el.pause();
            this.isPlaying.set(false);
        }
    }

    togglePlayPause(): void {
        if (this.isImage()) {
            this.toggleImagePlayPause();
        } else if (this.isVideo()) {
            if (this.isPlaying()) {
                this.pauseVideo();
            } else {
                this.playVideo();
            }
        }
    }

    onVideoTimeUpdate(): void {
        const el = this.getVideoElement();
        if (el) {
            this.currentTime.set(el.currentTime);
            this.duration.set(el.duration);
        }
    }

    onVideoEnded(): void {
        this.isPlaying.set(false);
        this.currentTime.set(0);
        setTimeout(() => this.nextStory(), 2000);
    }

    onVideoError(_event: unknown): void {
        const el = this.getVideoElement();
        if (el) {
            console.error("Video error:", {
                error: el.error,
                networkState: el.networkState,
                readyState: el.readyState,
            });
        }
    }

    onVideoLoaded(): void {
        const el = this.getVideoElement();
        if (el) {
            this.duration.set(el.duration);
            this.startProgressAnimation();
        }
    }

    seekTo(time: number): void {
        const el = this.getVideoElement();
        if (el) {
            el.currentTime = time;
        }
    }

    onProgressBarClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const dur = this.duration();
        if (target && dur > 0) {
            const rect = target.getBoundingClientRect();
            const percentage = (event.clientX - rect.left) / rect.width;
            this.seekTo(percentage * dur);
        }
    }

    private startLiveViewerSimulation(): void {
        const s = this.story();
        if (s) {
            this.liveViewerCount.set(s.views);
            this.viewerInterval = setInterval(() => {
                const change = Math.floor(Math.random() * 10) - 5;
                this.liveViewerCount.update((c) => Math.max(0, c + change));
                const current = this.story();
                if (current) {
                    current.views = this.liveViewerCount();
                }
            }, 3000);
        }
    }

    private stopLiveViewerSimulation(): void {
        if (this.viewerInterval) {
            clearInterval(this.viewerInterval);
            this.viewerInterval = null;
        }
    }

    toggleMute(): void {
        const el = this.getVideoElement();
        if (el) {
            const next = !this.isMuted();
            this.isMuted.set(next);
            el.muted = next;
        }
    }

    onVolumeChange(event: { value: number }): void {
        const v = event.value / 100;
        this.volume.set(v);
        const el = this.getVideoElement();
        if (el) {
            el.volume = v;
        }
    }

    toggleFullscreen(): void {
        const el = this.getVideoElement();
        if (!el) return;
        if (!this.isFullscreen()) {
            el.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        this.isFullscreen.update((v) => !v);
    }

    previousStory(): void {
        const idx = this.currentStoryIndex();
        const stories = this.allStories();
        if (idx > 0) {
            const story = stories[idx - 1];
            this.router.navigate(["/stories/view", story.id]);
        }
    }

    nextStory(): void {
        const idx = this.currentStoryIndex();
        const stories = this.allStories();
        if (idx < stories.length - 1) {
            const story = stories[idx + 1];
            this.router.navigate(["/stories/view", story.id]);
        } else {
            this.router.navigate(["/stories"]);
        }
    }

    onLikeStory(): void {
        const s = this.story();
        if (s) {
            this.storyService.likeStory(s.id).subscribe((success) => {
                if (success) {
                    this.isLiked.update((v) => !v);
                    const current = this.story();
                    if (current) {
                        current.isLiked = this.isLiked();
                        current.likes =
                            (current.likes ?? 0) + (this.isLiked() ? 1 : -1);
                    }
                }
            });
        }
    }

    onShareStory(): void {
        const s = this.story();
        if (s) {
            if (navigator.share) {
                navigator.share({
                    title: s.caption,
                    text: `Check out this story by ${s.userName}`,
                    url: window.location.href,
                });
            } else {
                navigator.clipboard.writeText(window.location.href);
            }
        }
    }

    formatTime(date: string | Date | number): string {
        if (typeof date === "number") {
            const mins = Math.floor(date / 60);
            const secs = Math.floor(date % 60);
            return `${mins}:${secs.toString().padStart(2, "0")}`;
        }
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

    onGoBack(): void {
        this.router.navigate(["/stories"]);
    }

    navigateToProfile(): void {
        const s = this.story();
        if (s?.userId) {
            this.router.navigate(["/profile", s.userId]);
        }
    }

    onClose(): void {
        this.router.navigate(["/stories"]);
    }

    onTouchStart(event: TouchEvent): void {
        this.touchStartX = event.changedTouches[0].screenX;
        this.touchStartY = event.changedTouches[0].screenY;
    }

    onTouchMove(event: TouchEvent): void {
        this.touchEndX = event.changedTouches[0].screenX;
        this.touchEndY = event.changedTouches[0].screenY;
    }

    onTouchEnd(): void {
        this.handleSwipeGesture();
    }

    private handleSwipeGesture(): void {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const minSwipeDistance = 50;

        if (
            Math.abs(deltaX) > Math.abs(deltaY) &&
            Math.abs(deltaX) > minSwipeDistance
        ) {
            if (deltaX > 0) {
                this.previousStory();
            } else {
                this.nextStory();
            }
        } else if (
            deltaY > minSwipeDistance &&
            Math.abs(deltaY) > Math.abs(deltaX)
        ) {
            this.onClose();
        }
    }

    getProgressWidth(index: number): number {
        const idx = this.currentStoryIndex();
        if (index < idx) return 100;
        if (index === idx) return this.storyProgress();
        return 0;
    }

    private startProgressAnimation(): void {
        this.storyProgress.set(0);
        this.stopProgressAnimation();
        const dur = this.duration();
        if (dur > 0) {
            this.progressInterval = setInterval(() => {
                if (this.isPlaying() && this.duration() > 0) {
                    const progress =
                        (this.currentTime() / this.duration()) * 100;
                    this.storyProgress.set(progress);
                    if (progress >= 100) {
                        this.stopProgressAnimation();
                    }
                }
            }, 100);
        }
    }

    private stopProgressAnimation(): void {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    private startImageTimer(): void {
        this.stopImageTimer();
        this.currentTime.set(0);
        this.imageTimerInterval = setInterval(() => {
            if (this.isPlaying() && this.isImage()) {
                this.currentTime.update((t) => t + 0.1);
                if (this.currentTime() >= this.duration()) {
                    this.stopImageTimer();
                    this.onImageTimerEnd();
                }
            }
        }, 100);
    }

    private stopImageTimer(): void {
        if (this.imageTimerInterval) {
            clearInterval(this.imageTimerInterval);
            this.imageTimerInterval = null;
        }
    }

    private onImageTimerEnd(): void {
        this.isPlaying.set(false);
        this.currentTime.set(0);
        setTimeout(() => this.nextStory(), 500);
    }

    toggleImagePlayPause(): void {
        this.isPlaying.update((v) => !v);
        if (!this.isPlaying()) {
            this.stopImageTimer();
        } else {
            this.startImageTimer();
        }
    }
}
