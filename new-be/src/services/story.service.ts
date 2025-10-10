import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { EntityManager, LessThan, MoreThan } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { Story } from "../entities/story.entity";
import { StoryDTO } from "../models/story.dto";
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
export class StoryService {
    private readonly logger = new Logger(StoryService.name);
    private readonly uploadDir: string;
    private readonly storiesDir: string;
    private readonly maxFileSize = 30 * 1024 * 1024;
    private readonly allowedMimeTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
    ];

    constructor(
        private entityManager: EntityManager,
        private configService: ConfigService,
    ) {
        this.uploadDir = this.configService.get<string>(
            "UPLOAD_DIR",
            "./uploads",
        );
        this.storiesDir = path.join(this.uploadDir, "stories");
        this.ensureUploadDirectory();
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

    private validateVideoFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException("No video file provided");
        }

        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Allowed: ${this.allowedMimeTypes.join(", ")}`,
            );
        }

        if (file.size > this.maxFileSize) {
            throw new BadRequestException(
                `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`,
            );
        }
    }

    private generateFilename(userId: number, originalName: string): string {
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        return `${timestamp}-user${userId}-${Math.random().toString(36).substring(7)}${ext}`;
    }

    private async extractVideoMetadata(
        filePath: string,
    ): Promise<{ duration: number; width: number; height: number }> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    this.logger.error(`FFprobe error: ${err.message}`);
                    return reject(err);
                }

                const videoStream = metadata.streams.find(
                    (s) => s.codec_type === "video",
                );
                if (!videoStream) {
                    return reject(new Error("No video stream found"));
                }

                resolve({
                    duration: metadata.format.duration || 0,
                    width: videoStream.width || 0,
                    height: videoStream.height || 0,
                });
            });
        });
    }

    private async generateThumbnail(
        videoPath: string,
        thumbnailPath: string,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: ["00:00:01"],
                    filename: path.basename(thumbnailPath),
                    folder: path.dirname(thumbnailPath),
                    size: "720x?",
                })
                .on("end", () => resolve())
                .on("error", (err) => reject(err));
        });
    }

    private async compressVideo(
        inputPath: string,
        outputPath: string,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
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
                    this.logger.error(`Compression error: ${err.message}`);
                    reject(err);
                })
                .run();
        });
    }

    async uploadStory(
        file: Express.Multer.File,
        userId: number,
    ): Promise<Story> {
        this.validateVideoFile(file);

        const filename = this.generateFilename(userId, file.originalname);
        const filePath = path.join(this.storiesDir, filename);
        const relativeFilePath = path.join("stories", filename);

        await fs.writeFile(filePath, file.buffer);

        try {
            const metadata = await this.extractVideoMetadata(filePath);

            const thumbnailFilename = filename.replace(
                path.extname(filename),
                ".jpg",
            );
            const thumbnailPath = path.join(this.storiesDir, thumbnailFilename);
            const relativeThumbnailPath = path.join(
                "stories",
                thumbnailFilename,
            );

            try {
                await this.generateThumbnail(filePath, thumbnailPath);
            } catch (error) {
                this.logger.warn(`Thumbnail generation failed: ${error}`);
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
            story.isProcessed = false;

            const savedStory = await this.entityManager.save(story);

            this.compressVideoAsync(savedStory.id, filePath, filename).catch(
                (error) => {
                    this.logger.error(
                        `Async compression failed for story ${savedStory.id}: ${error.message}`,
                    );
                },
            );

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

        return stories.map((story) => this.mapToDTO(story));
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

        return stories.map((story) => this.mapToDTO(story));
    }

    async getStoryById(id: number): Promise<StoryDTO> {
        const story = await this.entityManager.findOne(Story, {
            where: { id },
            relations: ["user"],
        });

        if (!story) {
            throw new NotFoundException(`Story ${id} not found`);
        }

        return this.mapToDTO(story);
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
            } catch (error) {
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

    private mapToDTO(story: Story): StoryDTO {
        return {
            id: story.id,
            userId: story.userId,
            userName: story.user
                ? `${story.user.firstname} ${story.user.lastname}`
                : undefined,
            filePath: story.filePath,
            originalFilename: story.originalFilename,
            fileSize: story.fileSize,
            duration: story.duration,
            mimeType: story.mimeType,
            width: story.width,
            height: story.height,
            thumbnailPath: story.thumbnailPath,
            views: story.views,
            createdAt: story.createdAt,
            expiresAt: story.expiresAt,
            isProcessed: story.isProcessed,
        };
    }
}
