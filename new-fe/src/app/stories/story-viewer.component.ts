import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
// import { MessageService } from 'primeng/api';
import { Story, StoryComment, StoriesService } from './stories.service';

@Component({
  selector: 'app-story-viewer',
  templateUrl: './story-viewer.component.html',
  styleUrls: ['./story-viewer.component.scss']
})
export class StoryViewerComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  
  private destroy$ = new Subject<void>();
  
  story: Story | null = null;
  comments: StoryComment[] = [];
  isLoading = true;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  isMuted = false;
  showComments = false;
  newComment = '';
  isLiked = false;
  isFullscreen = false;
  autoPlay = true;
  
  // Story navigation
  allStories: Story[] = [];
  currentStoryIndex = 0;
  
  // Live viewer simulation
  liveViewerCount = 0;
  private viewerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storiesService: StoriesService
    // private messageService: MessageService
  ) {
    console.log('StoryViewerComponent constructor called');
  }

  ngOnInit(): void {
    console.log('StoryViewerComponent ngOnInit called');
    this.loadStories();
    
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('Route params received:', params);
        const storyId = params['storyId'];
        console.log('Story ID from params:', storyId);
        if (storyId) {
          this.loadStory(storyId);
        } else {
          console.log('No story ID found in params');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopLiveViewerSimulation();
  }

  private loadStories(): void {
    this.storiesService.getStories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stories => {
        this.allStories = stories;
      });
  }

  private loadStory(storyId: string): void {
    console.log('Loading story with ID:', storyId);
    this.isLoading = true;
    
    this.storiesService.getStoryById(storyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(story => {
        console.log('Story loaded:', story);
        if (story) {
          this.story = story;
          this.isLiked = story.isLiked;
          this.currentStoryIndex = this.allStories.findIndex(s => s.id === storyId);
          this.loadComments(storyId);
          this.markAsViewed(storyId);
          this.startLiveViewerSimulation();
          
          // Auto-play video after a short delay
          setTimeout(() => {
            console.log('Attempting to play video...');
            if (this.autoPlay && this.videoPlayer?.nativeElement) {
              console.log('Video element found, playing...');
              this.playVideo();
            } else {
              console.log('Video element not found or autoPlay disabled');
            }
          }, 500);
        } else {
          console.log('Story not found');
          // this.messageService.add({
          //   severity: 'error',
          //   summary: 'Live Stream Not Found',
          //   detail: 'The requested live stream could not be found'
          // });
          this.router.navigate(['/live-tv']);
        }
        this.isLoading = false;
      });
  }

  private loadComments(storyId: string): void {
    this.storiesService.getCommentsByStoryId(storyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(comments => {
        this.comments = comments;
      });
  }

  private markAsViewed(storyId: string): void {
    this.storiesService.viewStory(storyId).subscribe();
  }

  // Video Controls
  playVideo(): void {
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.play();
      this.isPlaying = true;
    }
  }

  pauseVideo(): void {
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
      this.isPlaying = false;
    }
  }

  togglePlayPause(): void {
    if (this.isPlaying) {
      this.pauseVideo();
    } else {
      this.playVideo();
    }
  }

  onVideoTimeUpdate(): void {
    if (this.videoPlayer?.nativeElement) {
      this.currentTime = this.videoPlayer.nativeElement.currentTime;
      this.duration = this.videoPlayer.nativeElement.duration;
    }
  }

  onVideoEnded(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    
    // Auto-advance to next story after a delay
    setTimeout(() => {
      this.nextStory();
    }, 2000);
  }

  onVideoError(event: any): void {
    console.error('Video error:', event);
    // this.messageService.add({
    //   severity: 'error',
    //   summary: 'Video Error',
    //   detail: 'Failed to load video. Please try again.'
    // });
  }

  onVideoLoaded(): void {
    console.log('Video loaded successfully');
    if (this.videoPlayer?.nativeElement) {
      this.duration = this.videoPlayer.nativeElement.duration;
      console.log('Video duration:', this.duration);
    }
  }

  seekTo(time: number): void {
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.currentTime = time;
    }
  }

  onProgressBarClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target && this.duration > 0) {
      const rect = target.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      this.seekTo(percentage * this.duration);
    }
  }

  private startLiveViewerSimulation(): void {
    if (this.story) {
      this.liveViewerCount = this.story.views;
      this.viewerInterval = setInterval(() => {
        // Simulate viewer count changes
        const change = Math.floor(Math.random() * 10) - 5; // -5 to +5
        this.liveViewerCount = Math.max(0, this.liveViewerCount + change);
        if (this.story) {
          this.story.views = this.liveViewerCount;
        }
      }, 3000); // Update every 3 seconds
    }
  }

  private stopLiveViewerSimulation(): void {
    if (this.viewerInterval) {
      clearInterval(this.viewerInterval);
      this.viewerInterval = null;
    }
  }

  toggleMute(): void {
    if (this.videoPlayer?.nativeElement) {
      this.isMuted = !this.isMuted;
      this.videoPlayer.nativeElement.muted = this.isMuted;
    }
  }

  onVolumeChange(event: any): void {
    this.volume = event.value / 100;
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.volume = this.volume;
    }
  }

  toggleFullscreen(): void {
    if (this.videoPlayer?.nativeElement) {
      if (!this.isFullscreen) {
        if (this.videoPlayer.nativeElement.requestFullscreen) {
          this.videoPlayer.nativeElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      this.isFullscreen = !this.isFullscreen;
    }
  }

  // Story Navigation
  previousStory(): void {
    if (this.currentStoryIndex > 0) {
      this.currentStoryIndex--;
      const story = this.allStories[this.currentStoryIndex];
      this.router.navigate(['/live-tv/view', story.id]);
    }
  }

  nextStory(): void {
    if (this.currentStoryIndex < this.allStories.length - 1) {
      this.currentStoryIndex++;
      const story = this.allStories[this.currentStoryIndex];
      this.router.navigate(['/live-tv/view', story.id]);
    } else {
      // End of stories, go back to stories list
      this.router.navigate(['/live-tv']);
    }
  }

  // Story Actions
  onLikeStory(): void {
    if (this.story) {
      this.storiesService.likeStory(this.story.id).subscribe(success => {
        if (success) {
          this.isLiked = !this.isLiked;
          if (this.story) {
            this.story.isLiked = this.isLiked;
            this.story.likes += this.isLiked ? 1 : -1;
          }
        }
      });
    }
  }

  onShareStory(): void {
    if (this.story) {
      // Implement share functionality
      if (navigator.share) {
        navigator.share({
          title: this.story.caption,
          text: `Check out this story by ${this.story.userName}`,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
          // this.messageService.add({
          //   severity: 'success',
          //   summary: 'Link Copied',
          //   detail: 'Story link copied to clipboard'
          // });
        });
      }
    }
  }

  onAddComment(): void {
    if (this.newComment.trim() && this.story) {
      this.storiesService.addComment(this.story.id, this.newComment.trim())
        .pipe(takeUntil(this.destroy$))
        .subscribe(comment => {
          this.comments.unshift(comment);
          this.newComment = '';
          
          // Update story comment count
          if (this.story) {
            this.story.comments++;
          }
          
          // this.messageService.add({
          //   severity: 'success',
          //   summary: 'Comment Added',
          //   detail: 'Your comment has been posted'
          // });
        });
    }
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  onGoBack(): void {
    this.router.navigate(['/live-tv']);
  }

  onClose(): void {
    this.router.navigate(['/live-tv']);
  }
} 