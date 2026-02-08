import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { MessageService, ConfirmationService } from "primeng/api";
import { StoryService } from "./story.service";
import { ButtonModule } from "primeng/button";
import { FileUploadModule } from "primeng/fileupload";
import { ProgressBarModule } from "primeng/progressbar";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";

@Component({
    selector: "app-story-upload",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        FileUploadModule,
        ProgressBarModule,
        ToastModule,
        ConfirmDialogModule,
    ],
    templateUrl: "./story-upload.component.html",
    styleUrls: ["./story-upload.component.scss"],
})
export class StoryUploadComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    uploadForm: FormGroup;
    isUploading = false;
    uploadProgress = 0;
    selectedFile: File | null = null;
    mediaPreview: string | null = null;
    mediaDuration = 0;
    maxVideoDuration = 60;
    imageStoryDuration = 30; // Default duration for image stories
    isVideo = false;
    isImage = false;

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
            this.isVideo = file.type.startsWith("video/");
            this.isImage = file.type.startsWith("image/");

            if (!this.isVideo && !this.isImage) {
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

            this.selectedFile = file;
            if (this.isVideo) {
                this.createVideoPreview(file);
            } else if (this.isImage) {
                this.createImagePreview(file);
            }
        }
    }

    private createVideoPreview(file: File): void {
        const video = document.createElement("video");
        const url = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
            this.mediaDuration = video.duration;

            if (this.mediaDuration > this.maxVideoDuration) {
                this.messageService.add({
                    severity: "warn",
                    summary: "Video Too Long",
                    detail: `Video duration (${Math.round(this.mediaDuration)}s) exceeds maximum (${this.maxVideoDuration}s)`,
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
                    this.mediaPreview = canvas.toDataURL("image/jpeg");
                }
                URL.revokeObjectURL(url);
            };
        };

        video.src = url;
    }

    private createImagePreview(file: File): void {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.mediaPreview = e.target.result;
            this.mediaDuration = this.imageStoryDuration; // Images display for 30 seconds
        };
        reader.readAsDataURL(file);
    }

    onRemoveFile(): void {
        this.selectedFile = null;
        this.mediaPreview = null;
        this.mediaDuration = 0;
        this.uploadProgress = 0;
        this.isVideo = false;
        this.isImage = false;
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
                summary: "No File Selected",
                detail: "Please select an image or video file",
            });
            return;
        }

        if (this.isVideo && this.mediaDuration > this.maxVideoDuration) {
            this.messageService.add({
                severity: "error",
                summary: "Video Too Long",
                detail: `Please select a video shorter than ${this.maxVideoDuration} seconds`,
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
                        const mediaType = this.isImage ? "Image" : "Video";
                        this.messageService.add({
                            severity: "success",
                            summary: "Upload Successful",
                            detail: `Your ${mediaType.toLowerCase()} story has been uploaded successfully!`,
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
            const mediaType = this.isImage ? "image" : "video";
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
