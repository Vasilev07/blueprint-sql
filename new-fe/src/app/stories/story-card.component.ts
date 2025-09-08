import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Story } from './stories.service';

@Component({
  selector: 'app-story-card',
  templateUrl: './story-card.component.html',
  styleUrls: ['./story-card.component.scss']
})
export class StoryCardComponent {
  @Input() story: Story | null = null;
  @Input() showActions = true;
  @Output() storyClick = new EventEmitter<Story>();
  @Output() likeClick = new EventEmitter<Story>();
  @Output() shareClick = new EventEmitter<Story>();
  @Output() moreClick = new EventEmitter<Story>();

  onStoryClick(): void {
    if (this.story) {
      this.storyClick.emit(this.story);
    }
  }

  onLikeClick(event: Event): void {
    event.stopPropagation();
    if (this.story) {
      this.likeClick.emit(this.story);
    }
  }

  onShareClick(event: Event): void {
    event.stopPropagation();
    if (this.story) {
      this.shareClick.emit(this.story);
    }
  }

  onMoreClick(event: Event): void {
    event.stopPropagation();
    if (this.story) {
      this.moreClick.emit(this.story);
    }
  }

  formatTime(date: Date | undefined): string {
    if (!date) return 'Unknown time';
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

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getTimeRemaining(expiresAt: Date | undefined): string {
    if (!expiresAt) return 'Expired';
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return 'Expired';
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  }

  getCurrentDate(): Date {
    return new Date();
  }
} 