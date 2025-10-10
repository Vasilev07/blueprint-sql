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
    constructor(private storyService: StoryService) {}

    @Post("/upload")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Upload a new story video" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                video: {
                    type: "string",
                    format: "binary",
                    description: "Video file (max 30MB, .mp4/.mov/.avi/.webm)",
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: "Story uploaded successfully",
        type: StoryUploadResponseDTO,
    })
    @ApiResponse({
        status: 400,
        description: "Invalid file or validation error",
    })
    @UseInterceptors(FileInterceptor("video"))
    async uploadStory(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any,
    ): Promise<StoryUploadResponseDTO> {
        const userId = this.getUserIdFromRequest(req);
        const story = await this.storyService.uploadStory(file, userId);

        return {
            id: story.id,
            filePath: story.filePath,
            message: "Story uploaded successfully. Processing in background...",
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
    @ApiOperation({ summary: "Stream story video file" })
    @ApiResponse({ status: 200, description: "Returns video stream" })
    @ApiResponse({ status: 404, description: "Video not found" })
    async streamVideo(
        @Param("filename") filename: string,
        @Res() res: Response,
    ): Promise<void> {
        const uploadsDir = process.env.UPLOAD_DIR || "./uploads";
        const filePath = path.join(uploadsDir, "stories", filename);

        if (!fs.existsSync(filePath)) {
            throw new BadRequestException("Video not found");
        }

        const stat = fs.statSync(filePath);
        res.set({
            "Content-Type": "video/mp4",
            "Content-Length": stat.size,
            "Accept-Ranges": "bytes",
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }

    @Get("/thumbnail/:filename")
    @ApiOperation({ summary: "Get story thumbnail" })
    @ApiResponse({ status: 200, description: "Returns thumbnail image" })
    @ApiResponse({ status: 404, description: "Thumbnail not found" })
    async getThumbnail(
        @Param("filename") filename: string,
        @Res() res: Response,
    ): Promise<void> {
        const uploadsDir = process.env.UPLOAD_DIR || "./uploads";
        const filePath = path.join(uploadsDir, "stories", filename);

        if (!fs.existsSync(filePath)) {
            throw new BadRequestException("Thumbnail not found");
        }

        res.set("Content-Type", "image/jpeg");
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }

    private getUserIdFromRequest(req: any): number {
        return req.user.id;
    }
}
