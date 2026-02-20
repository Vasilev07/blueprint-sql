import { Component, input, output } from "@angular/core";
import { Story } from "./story.service";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { AvatarModule } from "primeng/avatar";

@Component({
    selector: "app-story-card",
    standalone: true,
    imports: [ButtonModule, TooltipModule, AvatarModule],
    templateUrl: "./story-card.component.html",
    styleUrls: ["./story-card.component.scss"],
})
export class StoryCardComponent {
    readonly story = input<Story | null>(null);
    readonly showActions = input<boolean>(true);
    readonly storyClick = output<Story>();
    readonly likeClick = output<Story>();
    readonly shareClick = output<Story>();
    readonly moreClick = output<Story>();

    onStoryClick(): void {
        const story = this.story();
        if (story) {
            this.storyClick.emit(story);
        }
    }

    onLikeClick(event: Event): void {
        event.stopPropagation();
        if (this.story() != null) {
            this.likeClick.emit(this.story()!);
        }
    }

    onShareClick(event: Event): void {
        event.stopPropagation();
        if (this.story() != null) {
            this.shareClick.emit(this.story()!);
        }
    }

    onMoreClick(event: Event): void {
        event.stopPropagation();
        if (this.story() != null) {
            this.moreClick.emit(this.story()!);
        }
    }

    formatTime(date: string | Date | undefined): string {
        if (!date) return "Unknown time";
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
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    getTimeRemaining(expiresAt: string | Date | undefined): string {
        if (!expiresAt) return "Expired";
        const now = new Date();
        const diff = new Date(expiresAt).getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (diff < 0) return "Expired";
        if (hours > 0) {
            return `${hours}h ${minutes}m left`;
        }
        return `${minutes}m left`;
    }
}
