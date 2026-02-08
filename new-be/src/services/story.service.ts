import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
    Inject,
    OnModuleInit,
} from "@nestjs/common";
import { EntityManager, LessThan, MoreThan } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { Story } from "../entities/story.entity";
import { StoryDTO } from "../models/story.dto";
import { MapperService } from "@mappers/mapper.service";
import { BaseMapper } from "@mappers/base.mapper";
import * as path from "path";
import * as fs from "fs/promises";
import * as ffmpeg from "fluent-ffmpeg";

/*
 * FUTURE MIGRATION TO DIGITALOCEAN SPACES (S3-compatible):
 *
 * 1. Install: npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
 * 2. Add env vars: DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_ENDPOINT, DO_SPACES_BUCKET
 * 3. Replace fs.writeFile in uploadStory() with S3 upload
 * 4. Replace fs.unlink in deleteStoryFiles() with s3Client.deleteObject()
 * 5. Update filePath to S3 URL format
 */

@Injectable()
export class StoryService implements OnModuleInit {
    private readonly logger = new Logger(StoryService.name);
    private readonly uploadDir: string;
    private readonly storiesDir: string;
    private readonly maxFileSize = 30 * 1024 * 1024;
    private readonly allowedVideoMimeTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
    ];
    private readonly allowedImageMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];
    private readonly imageStoryDuration = 30; // Default duration for image stories in seconds
    private storyMapper: BaseMapper<Story, StoryDTO>;

    constructor(
        private entityManager: EntityManager,
        private configService: ConfigService,
        @Inject(MapperService) private readonly mapperService: MapperService,
    ) {
        this.uploadDir = this.configService.get<string>(
            "UPLOAD_DIR",
            "./uploads",
        );
        this.storiesDir = path.join(this.uploadDir, "stories");
        this.ensureUploadDirectory();
    }

    public onModuleInit(): void {
        this.storyMapper = this.mapperService.getMapper("Story");
    }

    private async ensureUploadDirectory(): Promise<void> {
        try {
            await fs.mkdir(this.storiesDir, { recursive: true });
            this.logger.log(
                `Stories upload directory ready: ${this.storiesDir}`,
            );
        } catch (error) {
            this.logger.error(`Failed to create upload directory: ${error}`);
        }
    }

    private validateStoryFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException("No file provided");
        }

        const allAllowedMimeTypes = [
            ...this.allowedVideoMimeTypes,
            ...this.allowedImageMimeTypes,
        ];

        if (!allAllowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Allowed videos: ${this.allowedVideoMimeTypes.join(", ")}. Allowed images: ${this.allowedImageMimeTypes.join(", ")}`,
            );
        }

        if (file.size > this.maxFileSize) {
            throw new BadRequestException(
                `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`,
            );
        }
    }

    private isVideoFile(mimetype: string): boolean {
        return this.allowedVideoMimeTypes.includes(mimetype);
    }

    private isImageFile(mimetype: string): boolean {
        return this.allowedImageMimeTypes.includes(mimetype);
    }

    private generateFilename(userId: number, originalName: string): string {
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        return `${timestamp}-user${userId}-${Math.random().toString(36).substring(7)}${ext}`;
    }

    private async extractVideoMetadata(
        filePath: string,
    ): Promise<{ duration: number; width: number; height: number }> {
        return new Promise((resolve) => {
            try {
                ffmpeg.ffprobe(filePath, 0, (err, metadata) => {
                    if (err) {
                        this.logger.warn(`FFprobe error: ${err.message}`);
                        return resolve({ duration: 0, width: 0, height: 0 });
                    }

                    const videoStream = metadata.streams.find(
                        (s) => s.codec_type === "video",
                    );
                    if (!videoStream) {
                        return resolve({ duration: 0, width: 0, height: 0 });
                    }

                    resolve({
                        duration: metadata.format.duration || 0,
                        width: videoStream.width || 0,
                        height: videoStream.height || 0,
                    });
                });
            } catch (error) {
                this.logger.warn(`FFmpeg not available: ${error}`);
                resolve({ duration: 0, width: 0, height: 0 });
            }
        });
    }

    private async generateThumbnail(
        videoPath: string,
        thumbnailPath: string,
    ): Promise<void> {
        return new Promise((resolve, _reject) => {
            try {
                ffmpeg(videoPath)
                    .screenshots({
                        timestamps: ["00:00:01"],
                        filename: path.basename(thumbnailPath),
                        folder: path.dirname(thumbnailPath),
                        size: "720x?",
                    })
                    .on("end", () => resolve())
                    .on("error", (err) => {
                        this.logger.warn(
                            `Thumbnail generation failed: ${err.message}`,
                        );
                        resolve();
                    });
            } catch (error) {
                this.logger.warn(`FFmpeg not available: ${error}`);
                resolve();
            }
        });
    }

    private async compressVideo(
        inputPath: string,
        outputPath: string,
    ): Promise<void> {
        return new Promise((resolve, _reject) => {
            try {
                ffmpeg(inputPath)
                    .videoCodec("libx264")
                    .audioCodec("aac")
                    .outputOptions([
                        "-preset medium",
                        "-crf 23",
                        "-maxrate 1.5M",
                        "-bufsize 3M",
                        "-vf scale=-2:720",
                        "-movflags +faststart",
                    ])
                    .output(outputPath)
                    .on("end", () => {
                        this.logger.log(`Video compressed: ${outputPath}`);
                        resolve();
                    })
                    .on("error", (err) => {
                        this.logger.warn(`Compression error: ${err.message}`);
                        reject(err);
                    })
                    .run();
            } catch (error) {
                this.logger.warn(`FFmpeg not available: ${error}`);
                reject(error);
            }
        });
    }

    async uploadStory(
        file: Express.Multer.File,
        userId: number,
    ): Promise<Story> {
        this.validateStoryFile(file);

        const filename = this.generateFilename(userId, file.originalname);
        const filePath = path.join(this.storiesDir, filename);
        const relativeFilePath = path.join("stories", filename);

        try {
            await fs.writeFile(filePath, file.buffer as any);
        } catch (error) {
            this.logger.error(`Failed to write file ${filePath}: ${error}`);
            throw new BadRequestException("Failed to save uploaded file");
        }

        const isVideo = this.isVideoFile(file.mimetype);
        const isImage = this.isImageFile(file.mimetype);

        try {
            let metadata = { duration: 0, width: 0, height: 0 };
            let relativeThumbnailPath: string | null = null;

            if (isVideo) {
                // Extract video metadata
                metadata = await this.extractVideoMetadata(filePath);

                // Generate video thumbnail
                const thumbnailFilename = filename.replace(
                    path.extname(filename),
                    ".jpg",
                );
                const thumbnailPath = path.join(
                    this.storiesDir,
                    thumbnailFilename,
                );
                relativeThumbnailPath = path.join("stories", thumbnailFilename);

                try {
                    await this.generateThumbnail(filePath, thumbnailPath);
                    const exists = await fs
                        .access(thumbnailPath)
                        .then(() => true)
                        .catch(() => false);
                    if (!exists) {
                        relativeThumbnailPath = null;
                    }
                } catch (error) {
                    this.logger.warn(`Thumbnail generation failed: ${error}`);
                    relativeThumbnailPath = null;
                }
            } else if (isImage) {
                // For images, set default duration and use image as its own thumbnail
                metadata.duration = this.imageStoryDuration;
                relativeThumbnailPath = relativeFilePath; // Image is its own thumbnail

                // Try to extract image dimensions using ffprobe (works for images too)
                try {
                    const imgMetadata =
                        await this.extractVideoMetadata(filePath);
                    metadata.width = imgMetadata.width;
                    metadata.height = imgMetadata.height;
                } catch (error) {
                    this.logger.warn(
                        `Could not extract image dimensions: ${error}`,
                    );
                }
            }

            const story = new Story();
            story.userId = userId;
            story.filePath = relativeFilePath;
            story.originalFilename = file.originalname;
            story.fileSize = file.size;
            story.mimeType = file.mimetype;
            story.duration = metadata.duration;
            story.width = metadata.width;
            story.height = metadata.height;
            story.thumbnailPath = relativeThumbnailPath;
            story.createdAt = new Date();
            story.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            story.isProcessed = isImage; // Images are instantly processed, videos need compression

            const savedStory = await this.entityManager.save(story);

            // Only compress videos, not images
            if (isVideo) {
                this.compressVideoAsync(
                    savedStory.id,
                    filePath,
                    filename,
                ).catch((error) => {
                    this.logger.error(
                        `Async compression failed for story ${savedStory.id}: ${error.message}`,
                    );
                });
            }

            return savedStory;
        } catch (error) {
            await fs.unlink(filePath).catch(() => {});
            throw error;
        }
    }

    private async compressVideoAsync(
        storyId: number,
        originalPath: string,
        filename: string,
    ): Promise<void> {
        const compressedFilename = filename.replace(
            path.extname(filename),
            "-compressed.mp4",
        );
        const compressedPath = path.join(this.storiesDir, compressedFilename);
        const relativeCompressedPath = path.join("stories", compressedFilename);

        try {
            await this.compressVideo(originalPath, compressedPath);

            const stats = await fs.stat(compressedPath);
            const originalStats = await fs.stat(originalPath);

            if (stats.size < originalStats.size * 0.8) {
                await fs.unlink(originalPath);

                await this.entityManager.update(Story, storyId, {
                    filePath: relativeCompressedPath,
                    fileSize: stats.size,
                    isProcessed: true,
                });

                this.logger.log(
                    `Story ${storyId} compressed: ${originalStats.size} -> ${stats.size} bytes`,
                );
            } else {
                await fs.unlink(compressedPath);
                await this.entityManager.update(Story, storyId, {
                    isProcessed: true,
                });
            }
        } catch (error) {
            this.logger.error(
                `Compression failed for story ${storyId}: ${error}`,
            );
            await this.entityManager.update(Story, storyId, {
                isProcessed: true,
            });
        }
    }

    async getActiveStories(): Promise<StoryDTO[]> {
        const stories = await this.entityManager.find(Story, {
            where: {
                expiresAt: MoreThan(new Date()),
            },
            order: {
                createdAt: "DESC",
            },
            relations: ["user"],
        });

        return stories.map((story) => this.storyMapper.entityToDTO(story));
    }

    async getStoriesByUser(userId: number): Promise<StoryDTO[]> {
        const stories = await this.entityManager.find(Story, {
            where: {
                userId,
                expiresAt: MoreThan(new Date()),
            },
            order: {
                createdAt: "DESC",
            },
            relations: ["user"],
        });

        return stories.map((story) => this.storyMapper.entityToDTO(story));
    }

    async getStoryById(id: number): Promise<StoryDTO> {
        const story = await this.entityManager.findOne(Story, {
            where: { id },
            relations: ["user"],
        });

        if (!story) {
            throw new NotFoundException(`Story ${id} not found`);
        }

        return this.storyMapper.entityToDTO(story);
    }

    async incrementViews(id: number): Promise<void> {
        await this.entityManager.increment(Story, { id }, "views", 1);
    }

    async deleteStory(id: number, userId: number): Promise<void> {
        const story = await this.entityManager.findOne(Story, {
            where: { id },
        });

        if (!story) {
            throw new NotFoundException(`Story ${id} not found`);
        }

        if (story.userId !== userId) {
            throw new BadRequestException(
                "You can only delete your own stories",
            );
        }

        await this.deleteStoryFiles(story);
        await this.entityManager.delete(Story, id);
    }

    private async deleteStoryFiles(story: Story): Promise<void> {
        const fullPath = path.join(this.uploadDir, story.filePath);

        try {
            await fs.unlink(fullPath);
            this.logger.log(`Deleted file: ${fullPath}`);
        } catch (error) {
            this.logger.warn(`Failed to delete file ${fullPath}: ${error}`);
        }

        if (story.thumbnailPath) {
            const thumbnailFullPath = path.join(
                this.uploadDir,
                story.thumbnailPath,
            );
            try {
                await fs.unlink(thumbnailFullPath);
            } catch (_error) {
                // Ignore
            }
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async deleteExpiredStories(): Promise<void> {
        this.logger.log("Running expired stories cleanup cron job...");

        const expiredStories = await this.entityManager.find(Story, {
            where: {
                expiresAt: LessThan(new Date()),
            },
        });

        if (expiredStories.length === 0) {
            this.logger.log("No expired stories to delete");
            return;
        }

        this.logger.log(`Found ${expiredStories.length} expired stories`);

        for (const story of expiredStories) {
            try {
                await this.deleteStoryFiles(story);
                await this.entityManager.delete(Story, story.id);
                this.logger.log(`Deleted expired story ${story.id}`);
            } catch (error) {
                this.logger.error(
                    `Failed to delete story ${story.id}: ${error}`,
                );
            }
        }

        this.logger.log("Expired stories cleanup completed");
    }
}
