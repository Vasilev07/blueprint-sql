import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UploadedFile,
    UseInterceptors,
    Req,
    Res,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiConsumes,
    ApiBody,
} from "@nestjs/swagger";
import { StoryService } from "../../services/story.service";
import { StoryDTO } from "../../models/story.dto";
import { StoryUploadResponseDTO } from "../../models/story-upload-response.dto";
import { Response } from "express";
import { Public } from "../../decorators/public.decorator";
import * as path from "path";
import * as fs from "fs";

@Controller("/stories")
@ApiTags("Stories")
export class StoryController {
    constructor(
        private storyService: StoryService,
        private configService: ConfigService,
    ) {}

    @Post("/upload")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Upload a new story (image or video)" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                video: {
                    type: "string",
                    format: "binary",
                    description:
                        "Image or Video file (max 30MB). Videos: .mp4/.mov/.avi/.webm. Images: .jpg/.jpeg/.png/.webp. Images display for 30 seconds.",
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description:
            "Story uploaded successfully. Videos process in background, images are instant.",
        type: StoryUploadResponseDTO,
    })
    @ApiResponse({
        status: 400,
        description: "Invalid file type or validation error",
    })
    @UseInterceptors(FileInterceptor("video"))
    async uploadStory(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any,
    ): Promise<StoryUploadResponseDTO> {
        const userId = this.getUserIdFromRequest(req);
        const story = await this.storyService.uploadStory(file, userId);

        const isImage = story.mimeType.startsWith("image/");
        const message = isImage
            ? "Image story uploaded successfully!"
            : "Video story uploaded successfully. Processing in background...";

        return {
            id: story.id,
            filePath: story.filePath,
            message,
        };
    }

    @Get("/")
    @ApiOperation({ summary: "Get all active stories" })
    @ApiResponse({
        status: 200,
        description: "Returns all active stories (not expired)",
        type: [StoryDTO],
    })
    async getAllStories(): Promise<StoryDTO[]> {
        return this.storyService.getActiveStories();
    }

    @Get("/user/:userId")
    @ApiOperation({ summary: "Get stories by user ID" })
    @ApiResponse({
        status: 200,
        description: "Returns user's active stories",
        type: [StoryDTO],
    })
    async getStoriesByUser(
        @Param("userId") userId: number,
    ): Promise<StoryDTO[]> {
        return this.storyService.getStoriesByUser(userId);
    }

    @Get("/:id")
    @ApiOperation({ summary: "Get story by ID" })
    @ApiResponse({
        status: 200,
        description: "Returns story details",
        type: StoryDTO,
    })
    @ApiResponse({ status: 404, description: "Story not found" })
    async getStoryById(@Param("id") id: number): Promise<StoryDTO> {
        return this.storyService.getStoryById(id);
    }

    @Post("/:id/view")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Increment story view count" })
    @ApiResponse({ status: 200, description: "View count incremented" })
    async incrementViews(
        @Param("id") id: number,
    ): Promise<{ message: string }> {
        await this.storyService.incrementViews(id);
        return { message: "View count incremented" };
    }

    @Delete("/:id")
    @ApiOperation({ summary: "Delete a story" })
    @ApiResponse({ status: 200, description: "Story deleted successfully" })
    @ApiResponse({
        status: 400,
        description: "Cannot delete other users' stories",
    })
    @ApiResponse({ status: 404, description: "Story not found" })
    async deleteStory(
        @Param("id") id: number,
        @Req() req: any,
    ): Promise<{ message: string }> {
        const userId = this.getUserIdFromRequest(req);
        await this.storyService.deleteStory(id, userId);
        return { message: "Story deleted successfully" };
    }

    @Get("/video/:filename")
    @ApiOperation({ summary: "Stream story media file (image or video)" })
    @ApiResponse({
        status: 200,
        description: "Returns media stream (image or video)",
        content: {
            "video/mp4": { schema: { type: "string", format: "binary" } },
            "video/webm": { schema: { type: "string", format: "binary" } },
            "video/quicktime": { schema: { type: "string", format: "binary" } },
            "image/jpeg": { schema: { type: "string", format: "binary" } },
            "image/png": { schema: { type: "string", format: "binary" } },
            "image/webp": { schema: { type: "string", format: "binary" } },
        },
    })
    @ApiResponse({ status: 404, description: "Media file not found" })
    async streamVideo(
        @Param("filename") filename: string,
        @Res() res: Response,
    ): Promise<void> {
        const uploadsDir = this.configService.get<string>(
            "UPLOAD_DIR",
            "./uploads",
        );
        const filePath = path.join(uploadsDir, "stories", filename);

        console.log("Story media request:", {
            filename,
            filePath,
            exists: fs.existsSync(filePath),
        });

        if (!fs.existsSync(filePath)) {
            res.status(404).send("Media file not found");
            return;
        }

        const stat = fs.statSync(filePath);
        res.set({
            "Content-Type": this.getMimeTypeFromExtension(filename),
            "Content-Length": stat.size,
            "Accept-Ranges": "bytes",
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }

    @Get("/thumbnail/:filename")
    @ApiOperation({ summary: "Get story thumbnail" })
    @ApiResponse({
        status: 200,
        description: "Returns thumbnail image",
        content: {
            "image/jpeg": {
                schema: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "Thumbnail not found" })
    async getThumbnail(
        @Param("filename") filename: string,
        @Res() res: Response,
    ): Promise<void> {
        const uploadsDir = this.configService.get<string>(
            "UPLOAD_DIR",
            "./uploads",
        );
        const filePath = path.join(uploadsDir, "stories", filename);

        console.log("Thumbnail request:", {
            filename,
            filePath,
            exists: fs.existsSync(filePath),
        });

        if (!fs.existsSync(filePath)) {
            res.status(404).send("Thumbnail not found");
            return;
        }

        res.set("Content-Type", "image/jpeg");
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }

    private getUserIdFromRequest(req: any): number {
        return req.userData.id;
    }

    private getMimeTypeFromExtension(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            // Video types
            ".mp4": "video/mp4",
            ".mov": "video/quicktime",
            ".avi": "video/x-msvideo",
            ".webm": "video/webm",
            // Image types
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        };
        return mimeTypes[ext] || "application/octet-stream";
    }
}
