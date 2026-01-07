import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Put,
    Delete,
    Req,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ForumPostService } from "@services/forum-post.service";
import { ForumPostDTO } from "../../models/forum-post.dto";
import { CreateForumPostDTO } from "../../models/create-forum-post.dto";

@Controller("forum-posts")
@ApiTags("Forum Posts")
export class ForumPostController {
    constructor(private readonly forumPostService: ForumPostService) {}

    @Post()
    @ApiOperation({ summary: "Create a new post in a room" })
    @ApiResponse({
        status: 201,
        description: "Post created successfully",
        type: ForumPostDTO,
    })
    @ApiResponse({ status: 400, description: "Invalid input" })
    @ApiResponse({ status: 403, description: "Not a room member" })
    @ApiResponse({ status: 404, description: "Room not found" })
    async createPost(
        @Body() dto: CreateForumPostDTO,
        @Req() req: any,
    ): Promise<ForumPostDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumPostService.createPost(userId, dto);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get post by ID" })
    @ApiResponse({
        status: 200,
        description: "Post retrieved successfully",
        type: ForumPostDTO,
    })
    @ApiResponse({ status: 404, description: "Post not found" })
    async getPostById(
        @Param("id") id: number,
        @Req() req?: any,
    ): Promise<ForumPostDTO> {
        const userId = req?.userData?.id;
        return this.forumPostService.getPostById(Number(id), userId);
    }

    @Get("room/:roomId")
    @ApiOperation({ summary: "Get all posts in a room" })
    @ApiResponse({
        status: 200,
        description: "Posts retrieved successfully",
        type: [ForumPostDTO],
    })
    @ApiResponse({ status: 404, description: "Room not found" })
    async getPostsByRoom(
        @Param("roomId") roomId: number,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("sortBy") sortBy?: "createdAt" | "commentCount",
        @Req() req?: any,
    ): Promise<ForumPostDTO[]> {
        const userId = req?.userData?.id;
        return this.forumPostService.getPostsByRoom(
            Number(roomId),
            userId,
            {
                limit: limit ? Number(limit) : undefined,
                offset: offset ? Number(offset) : undefined,
                sortBy: sortBy as "createdAt" | "commentCount" | undefined,
            },
        );
    }

    @Put(":id")
    @ApiOperation({ summary: "Update a post (author/moderator/admin only)" })
    @ApiResponse({
        status: 200,
        description: "Post updated successfully",
        type: ForumPostDTO,
    })
    @ApiResponse({ status: 403, description: "No permission" })
    @ApiResponse({ status: 404, description: "Post not found" })
    async updatePost(
        @Param("id") id: number,
        @Body() updates: Partial<CreateForumPostDTO>,
        @Req() req: any,
    ): Promise<ForumPostDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumPostService.updatePost(Number(id), userId, updates);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete a post (author/moderator/admin only)" })
    @ApiResponse({
        status: 200,
        description: "Post deleted successfully",
    })
    @ApiResponse({ status: 403, description: "No permission" })
    @ApiResponse({ status: 404, description: "Post not found" })
    async deletePost(@Param("id") id: number, @Req() req: any): Promise<void> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumPostService.deletePost(Number(id), userId);
    }

    @Post(":id/pin")
    @ApiOperation({ summary: "Pin/unpin a post (moderator/admin only)" })
    @ApiResponse({
        status: 200,
        description: "Post pin status updated",
        type: ForumPostDTO,
    })
    @ApiResponse({ status: 403, description: "Not a moderator or admin" })
    @ApiResponse({ status: 404, description: "Post not found" })
    async pinPost(@Param("id") id: number, @Req() req: any): Promise<ForumPostDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumPostService.pinPost(Number(id), userId);
    }

    @Post(":id/lock")
    @ApiOperation({ summary: "Lock/unlock a post (moderator/admin only)" })
    @ApiResponse({
        status: 200,
        description: "Post lock status updated",
        type: ForumPostDTO,
    })
    @ApiResponse({ status: 403, description: "Not a moderator or admin" })
    @ApiResponse({ status: 404, description: "Post not found" })
    async lockPost(@Param("id") id: number, @Req() req: any): Promise<ForumPostDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumPostService.lockPost(Number(id), userId);
    }
}

