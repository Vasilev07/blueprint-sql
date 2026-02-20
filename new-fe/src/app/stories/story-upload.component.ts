import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { MessageService, ConfirmationService } from "primeng/api";
import { StoryService } from "./story.service";
import { ButtonModule } from "primeng/button";
import { FileUploadModule } from "primeng/fileupload";
import { ProgressBarModule } from "primeng/progressbar";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { TooltipModule } from "primeng/tooltip";

export interface UploadTip {
    id: string;
    icon: string;
    title: string;
    description: string;
}

@Component({
    selector: "app-story-upload",
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        FileUploadModule,
        ProgressBarModule,
        ToastModule,
        ConfirmDialogModule,
        TooltipModule,
    ],
    templateUrl: "./story-upload.component.html",
    styleUrls: ["./story-upload.component.scss"],
})
export class StoryUploadComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly storyService = inject(StoryService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly uploadForm: FormGroup;
    readonly isUploading = signal(false);
    readonly uploadProgress = signal(0);
    readonly selectedFile = signal<File | null>(null);
    readonly mediaPreview = signal<string | null>(null);
    readonly mediaDuration = signal(0);
    readonly isVideo = signal(false);
    readonly isImage = signal(false);

    readonly maxVideoDuration = 60;
    readonly imageStoryDuration = 30;

    readonly uploadTips: UploadTip[] = [
        {
            id: "short",
            icon: "pi pi-clock",
            title: "Keep it Short",
            description: "Stories work best when they're 15-30 seconds long",
        },
        {
            id: "strong",
            icon: "pi pi-eye",
            title: "Start Strong",
            description: "Hook viewers in the first 3 seconds",
        },
        {
            id: "hashtags",
            icon: "pi pi-hashtag",
            title: "Use Hashtags",
            description: "Add relevant hashtags to reach more people",
        },
        {
            id: "creative",
            icon: "pi pi-lightbulb",
            title: "Be Creative",
            description: "Show your unique perspective and style",
        },
    ];

    constructor() {
        this.uploadForm = this.fb.group({});
    }

    onFileSelect(event: { files: File[] }): void {
        const file = event.files[0];
        if (!file) return;

        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (!isVideo && !isImage) {
            this.messageService.add({
                severity: "error",
                summary: "Invalid File",
                detail: "Please select a valid image or video file",
            });
            return;
        }

        if (file.size > 30 * 1024 * 1024) {
            this.messageService.add({
                severity: "error",
                summary: "File Too Large",
                detail: "File size must be less than 30MB",
            });
            return;
        }

        this.isVideo.set(isVideo);
        this.isImage.set(isImage);
        this.selectedFile.set(file);

        if (isVideo) {
            this.createVideoPreview(file);
        } else if (isImage) {
            this.createImagePreview(file);
        }
    }

    private createVideoPreview(file: File): void {
        const video = document.createElement("video");
        const url = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
            const duration = video.duration;
            this.mediaDuration.set(duration);

            if (duration > this.maxVideoDuration) {
                this.messageService.add({
                    severity: "warn",
                    summary: "Video Too Long",
                    detail: `Video duration (${Math.round(duration)}s) exceeds maximum (${this.maxVideoDuration}s)`,
                });
            }

            video.currentTime = 1;
            video.onseeked = () => {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    this.mediaPreview.set(canvas.toDataURL("image/jpeg"));
                }
                URL.revokeObjectURL(url);
            };
        };

        video.src = url;
    }

    private createImagePreview(file: File): void {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const result = e.target?.result;
            this.mediaPreview.set(typeof result === "string" ? result : null);
            this.mediaDuration.set(this.imageStoryDuration);
        };
        reader.readAsDataURL(file);
    }

    onRemoveFile(): void {
        this.selectedFile.set(null);
        this.mediaPreview.set(null);
        this.mediaDuration.set(0);
        this.uploadProgress.set(0);
        this.isVideo.set(false);
        this.isImage.set(false);
    }

    formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    uploadStory(): void {
        const file = this.selectedFile();
        if (!file) {
            this.messageService.add({
                severity: "error",
                summary: "No File Selected",
                detail: "Please select an image or video file",
            });
            return;
        }

        if (this.isVideo() && this.mediaDuration() > this.maxVideoDuration) {
            this.messageService.add({
                severity: "error",
                summary: "Video Too Long",
                detail: `Please select a video shorter than ${this.maxVideoDuration} seconds`,
            });
            return;
        }

        this.isUploading.set(true);
        this.uploadProgress.set(0);

        this.storyService
            .uploadStory(file)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.uploadProgress.set(100);

                    setTimeout(() => {
                        const mediaType = this.isImage() ? "Image" : "Video";
                        this.messageService.add({
                            severity: "success",
                            summary: "Upload Successful",
                            detail: `Your ${mediaType.toLowerCase()} story has been uploaded successfully!`,
                        });

                        this.router.navigate(["/stories"]);
                    }, 500);
                },
                error: (error: { error?: { message?: string } }) => {
                    this.isUploading.set(false);

                    this.messageService.add({
                        severity: "error",
                        summary: "Upload Failed",
                        detail:
                            error.error?.message ||
                            "Failed to upload story. Please try again.",
                    });
                },
            });
    }

    onCancel(): void {
        const file = this.selectedFile();
        if (file) {
            const mediaType = this.isImage() ? "image" : "video";
            this.confirmationService.confirm({
                message: `Are you sure you want to cancel? Your ${mediaType} will not be uploaded.`,
                header: "Confirm Cancellation",
                icon: "pi pi-exclamation-triangle",
                accept: () => {
                    this.router.navigate(["/stories"]);
                },
            });
        } else {
            this.router.navigate(["/stories"]);
        }
    }
}
