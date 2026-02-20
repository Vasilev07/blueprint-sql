import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { StoryUploadComponent } from "./story-upload.component";
import { StoryService } from "./story.service";
import { MessageService, ConfirmationService, Confirmation } from "primeng/api";

describe("StoryUploadComponent", () => {
    let component: StoryUploadComponent;
    let fixture: ComponentFixture<StoryUploadComponent>;
    let storyService: jest.Mocked<Pick<StoryService, "uploadStory">>;
    let messageService: MessageService;
    let confirmationService: ConfirmationService;
    let router: jest.Mocked<Router>;

    beforeEach(async () => {
        storyService = {
            uploadStory: jest.fn().mockReturnValue(of({})),
        } as any;

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        } as any;

        await TestBed.configureTestingModule({
            imports: [StoryUploadComponent],
            providers: [
                { provide: StoryService, useValue: storyService },
                MessageService,
                ConfirmationService,
                { provide: Router, useValue: router },
            ],
        }).compileComponents();

        messageService = TestBed.inject(MessageService);
        confirmationService = TestBed.inject(ConfirmationService);
        jest.spyOn(messageService, "add").mockImplementation();
        jest.spyOn(confirmationService, "confirm").mockImplementation(
            (options: Confirmation) => {
                (options.accept as () => void)?.();
                return confirmationService;
            },
        );

        fixture = TestBed.createComponent(StoryUploadComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should have upload form and default signals", () => {
        expect(component.uploadForm).toBeDefined();
        expect(component.selectedFile()).toBeNull();
        expect(component.isUploading()).toBe(false);
        expect(component.uploadProgress()).toBe(0);
        expect(component.mediaPreview()).toBeNull();
        expect(component.mediaDuration()).toBe(0);
        expect(component.isVideo()).toBe(false);
        expect(component.isImage()).toBe(false);
    });

    it("should have upload tips", () => {
        expect(component.uploadTips.length).toBe(4);
        expect(component.uploadTips[0]).toEqual({
            id: "short",
            icon: "pi pi-clock",
            title: "Keep it Short",
            description: "Stories work best when they're 15-30 seconds long",
        });
    });

    describe("onFileSelect", () => {
        it("should show error for invalid file type", () => {
            component.onFileSelect({
                files: [
                    new File(["x"], "doc.pdf", { type: "application/pdf" }),
                ],
            });

            expect(messageService.add).toHaveBeenCalledWith({
                severity: "error",
                summary: "Invalid File",
                detail: "Please select a valid image or video file",
            });
            expect(component.selectedFile()).toBeNull();
        });

        it("should show error when file exceeds 30MB", () => {
            const largeFile = new File(
                [new ArrayBuffer(31 * 1024 * 1024)],
                "big.mp4",
                { type: "video/mp4" },
            );
            component.onFileSelect({ files: [largeFile] });

            expect(messageService.add).toHaveBeenCalledWith({
                severity: "error",
                summary: "File Too Large",
                detail: "File size must be less than 30MB",
            });
            expect(component.selectedFile()).toBeNull();
        });

        it("should set signals for valid image file", () => {
            const file = new File(["image"], "photo.jpg", {
                type: "image/jpeg",
            });

            const readAsDataURL = jest.fn();
            const mockReader = {
                readAsDataURL: readAsDataURL,
                onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
            };
            jest.spyOn(global, "FileReader").mockImplementation(
                () => mockReader as unknown as FileReader,
            );

            component.onFileSelect({ files: [file] });

            expect(component.selectedFile()).toBe(file);
            expect(component.isImage()).toBe(true);
            expect(component.isVideo()).toBe(false);

            expect(readAsDataURL).toHaveBeenCalledWith(file);
            mockReader.onload?.({
                target: { result: "data:image/jpeg;base64,abc" },
            } as ProgressEvent<FileReader>);
            expect(component.mediaPreview()).toBe("data:image/jpeg;base64,abc");
            expect(component.mediaDuration()).toBe(30);
        });

        it("should set signals for valid video file", () => {
            const file = new File(["video"], "clip.mp4", {
                type: "video/mp4",
            });

            const video = {
                duration: 45,
                videoWidth: 640,
                videoHeight: 360,
                currentTime: 0,
                src: "",
                addEventListener: jest.fn(),
                onloadedmetadata: null as (() => void) | null,
                onseeked: null as (() => void) | null,
            };
            const createElementSpy = jest
                .spyOn(document, "createElement")
                .mockImplementation((tagName: string) => {
                    if (tagName === "video") {
                        return video as unknown as HTMLVideoElement;
                    }
                    if (tagName === "canvas") {
                        return {
                            width: 0,
                            height: 0,
                            getContext: () => ({
                                drawImage: jest.fn(),
                            }),
                            toDataURL: () => "data:image/jpeg;base64,thumb",
                        } as unknown as HTMLCanvasElement;
                    }
                    return document.createElement(tagName);
                });

            const createObjectURL = jest
                .fn()
                .mockReturnValue("blob:http://localhost/fake");
            const revokeObjectURL = jest.fn();
            global.URL.createObjectURL = createObjectURL;
            global.URL.revokeObjectURL = revokeObjectURL;

            component.onFileSelect({ files: [file] });

            expect(component.selectedFile()).toBe(file);
            expect(component.isVideo()).toBe(true);
            expect(component.isImage()).toBe(false);

            video.onloadedmetadata?.();
            expect(component.mediaDuration()).toBe(45);

            video.onseeked?.();
            expect(component.mediaPreview()).toBe(
                "data:image/jpeg;base64,thumb",
            );

            createElementSpy.mockRestore();
        });
    });

    describe("onRemoveFile", () => {
        it("should clear all file-related state", () => {
            component.selectedFile.set(
                new File(["x"], "test.jpg", { type: "image/jpeg" }),
            );
            component.mediaPreview.set("data:url");
            component.mediaDuration.set(30);
            component.uploadProgress.set(50);
            component.isImage.set(true);

            component.onRemoveFile();

            expect(component.selectedFile()).toBeNull();
            expect(component.mediaPreview()).toBeNull();
            expect(component.mediaDuration()).toBe(0);
            expect(component.uploadProgress()).toBe(0);
            expect(component.isVideo()).toBe(false);
            expect(component.isImage()).toBe(false);
        });
    });

    describe("formatDuration", () => {
        it("should format seconds as m:ss", () => {
            expect(component.formatDuration(0)).toBe("0:00");
            expect(component.formatDuration(65)).toBe("1:05");
            expect(component.formatDuration(90)).toBe("1:30");
        });
    });

    describe("uploadStory", () => {
        it("should show error when no file selected", () => {
            component.uploadStory();

            expect(messageService.add).toHaveBeenCalledWith({
                severity: "error",
                summary: "No File Selected",
                detail: "Please select an image or video file",
            });
            expect(storyService.uploadStory).not.toHaveBeenCalled();
        });

        it("should show error when video exceeds max duration", () => {
            const file = new File(["x"], "long.mp4", { type: "video/mp4" });
            component.selectedFile.set(file);
            component.isVideo.set(true);
            component.mediaDuration.set(90);

            component.uploadStory();

            expect(messageService.add).toHaveBeenCalledWith({
                severity: "error",
                summary: "Video Too Long",
                detail: "Please select a video shorter than 60 seconds",
            });
            expect(storyService.uploadStory).not.toHaveBeenCalled();
        });

        it("should upload and navigate on success", (done) => {
            const file = new File(["x"], "story.jpg", { type: "image/jpeg" });
            component.selectedFile.set(file);
            component.isImage.set(true);
            component.mediaDuration.set(30);

            jest.useFakeTimers();

            component.uploadStory();

            expect(component.isUploading()).toBe(true);
            expect(storyService.uploadStory).toHaveBeenCalledWith(file);

            fixture.detectChanges();

            expect(component.uploadProgress()).toBe(100);

            jest.advanceTimersByTime(500);

            expect(messageService.add).toHaveBeenCalledWith({
                severity: "success",
                summary: "Upload Successful",
                detail: "Your image story has been uploaded successfully!",
            });
            expect(router.navigate).toHaveBeenCalledWith(["/stories"]);

            jest.useRealTimers();
            done();
        });

        it("should show error and reset isUploading on upload failure", () => {
            storyService.uploadStory.mockReturnValue(
                throwError(() => ({ error: { message: "Server error" } })),
            );
            const file = new File(["x"], "story.jpg", { type: "image/jpeg" });
            component.selectedFile.set(file);
            component.isImage.set(true);

            component.uploadStory();

            expect(component.isUploading()).toBe(false);
            expect(messageService.add).toHaveBeenCalledWith({
                severity: "error",
                summary: "Upload Failed",
                detail: "Server error",
            });
        });

        it("should use generic error message when server does not return message", () => {
            storyService.uploadStory.mockReturnValue(
                throwError(() => new Error("Network error")),
            );
            const file = new File(["x"], "story.jpg", { type: "image/jpeg" });
            component.selectedFile.set(file);
            component.isImage.set(true);

            component.uploadStory();
            fixture.detectChanges();

            expect(messageService.add).toHaveBeenCalledWith({
                severity: "error",
                summary: "Upload Failed",
                detail: "Failed to upload story. Please try again.",
            });
        });
    });

    describe("onCancel", () => {
        it("should navigate to stories when no file selected", () => {
            component.onCancel();
            expect(confirmationService.confirm).not.toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(["/stories"]);
        });

        it("should show confirmation when file is selected and navigate on accept", () => {
            component.selectedFile.set(
                new File(["x"], "test.jpg", { type: "image/jpeg" }),
            );
            component.isImage.set(true);

            component.onCancel();

            expect(confirmationService.confirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    message:
                        "Are you sure you want to cancel? Your image will not be uploaded.",
                    header: "Confirm Cancellation",
                    icon: "pi pi-exclamation-triangle",
                }),
            );
            expect(router.navigate).toHaveBeenCalledWith(["/stories"]);
        });

        it("should use video in message when video is selected", () => {
            component.selectedFile.set(
                new File(["x"], "clip.mp4", { type: "video/mp4" }),
            );
            component.isVideo.set(true);

            component.onCancel();

            expect(confirmationService.confirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    message:
                        "Are you sure you want to cancel? Your video will not be uploaded.",
                }),
            );
        });
    });
});
