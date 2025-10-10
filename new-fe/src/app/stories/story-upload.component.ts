import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { MessageService, ConfirmationService } from "primeng/api";
import { Story, StoryService } from "./story.service";

@Component({
    selector: "app-story-upload",
    templateUrl: "./story-upload.component.html",
    styleUrls: ["./story-upload.component.scss"],
})
export class StoryUploadComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    uploadForm: FormGroup;
    isUploading = false;
    uploadProgress = 0;
    selectedFile: File | null = null;
    videoPreview: string | null = null;
    videoDuration = 0;
    maxDuration = 60;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private storyService: StoryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
    ) {
        this.uploadForm = this.fb.group({});
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onFileSelect(event: any): void {
        const file = event.files[0];
        if (file) {
            if (!file.type.startsWith("video/")) {
                this.messageService.add({
                    severity: "error",
                    summary: "Invalid File",
                    detail: "Please select a valid video file",
                });
                return;
            }

            if (file.size > 100 * 1024 * 1024) {
                this.messageService.add({
                    severity: "error",
                    summary: "File Too Large",
                    detail: "Video file size must be less than 100MB",
                });
                return;
            }

            this.selectedFile = file;
            this.createVideoPreview(file);
        }
    }

    private createVideoPreview(file: File): void {
        const video = document.createElement("video");
        const url = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
            this.videoDuration = video.duration;

            if (this.videoDuration > this.maxDuration) {
                this.messageService.add({
                    severity: "warn",
                    summary: "Video Too Long",
                    detail: `Video duration (${Math.round(this.videoDuration)}s) exceeds the maximum allowed duration (${this.maxDuration}s)`,
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
                    this.videoPreview = canvas.toDataURL("image/jpeg");
                }
                URL.revokeObjectURL(url);
            };
        };

        video.src = url;
    }

    onRemoveFile(): void {
        this.selectedFile = null;
        this.videoPreview = null;
        this.videoDuration = 0;
        this.uploadProgress = 0;
    }

    formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    async uploadStory(): Promise<void> {
        if (!this.selectedFile) {
            this.messageService.add({
                severity: "error",
                summary: "No Video Selected",
                detail: "Please select a video file",
            });
            return;
        }

        if (this.videoDuration > this.maxDuration) {
            this.messageService.add({
                severity: "error",
                summary: "Video Too Long",
                detail: `Please select a video shorter than ${this.maxDuration} seconds`,
            });
            return;
        }

        this.isUploading = true;
        this.uploadProgress = 0;

        this.storyService
            .uploadStory(this.selectedFile)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.uploadProgress = 100;

                    setTimeout(() => {
                        this.messageService.add({
                            severity: "success",
                            summary: "Upload Successful",
                            detail: "Your story has been uploaded successfully!",
                        });

                        this.router.navigate(["/stories"]);
                    }, 500);
                },
                error: (error) => {
                    this.isUploading = false;

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
        if (this.selectedFile) {
            this.confirmationService.confirm({
                message:
                    "Are you sure you want to cancel? Your video will not be uploaded.",
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
