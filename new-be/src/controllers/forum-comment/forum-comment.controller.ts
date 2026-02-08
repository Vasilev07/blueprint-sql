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
import { ForumCommentService } from "@services/forum-comment.service";
import { ForumCommentDTO } from "../../models/forum-comment.dto";
import { CreateForumCommentDTO } from "../../models/create-forum-comment.dto";
import { VoteForumCommentDTO } from "../../models/vote-forum-comment.dto";

@Controller("forum-comments")
@ApiTags("Forum Comments")
export class ForumCommentController {
    constructor(private readonly forumCommentService: ForumCommentService) {}

    @Post()
    @ApiOperation({ summary: "Create a new comment on a post" })
    @ApiResponse({
        status: 201,
        description: "Comment created successfully",
        type: ForumCommentDTO,
    })
    @ApiResponse({ status: 400, description: "Invalid input or post locked" })
    @ApiResponse({ status: 403, description: "Not a room member" })
    @ApiResponse({ status: 404, description: "Post not found" })
    async createComment(
        @Body() dto: CreateForumCommentDTO,
        @Req() req: any,
    ): Promise<ForumCommentDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumCommentService.createComment(userId, dto);
    }

    @Get("post/:postId")
    @ApiOperation({ summary: "Get all comments for a post" })
    @ApiResponse({
        status: 200,
        description: "Comments retrieved successfully",
        type: [ForumCommentDTO],
    })
    @ApiResponse({ status: 404, description: "Post not found" })
    async getCommentsByPost(
        @Param("postId") postId: number,
        @Query("limit") limit?: number,
        @Query("offset") offset?: number,
        @Query("maxDepth") maxDepth?: number,
        @Req() req?: any,
    ): Promise<ForumCommentDTO[]> {
        const userId = req?.userData?.id;
        return this.forumCommentService.getCommentsByPost(
            Number(postId),
            userId,
            {
                limit: limit ? Number(limit) : undefined,
                offset: offset ? Number(offset) : undefined,
                maxDepth: maxDepth ? Number(maxDepth) : undefined,
            },
        );
    }

    @Get(":id/replies")
    @ApiOperation({ summary: "Get replies to a comment" })
    @ApiResponse({
        status: 200,
        description: "Replies retrieved successfully",
        type: [ForumCommentDTO],
    })
    @ApiResponse({ status: 404, description: "Comment not found" })
    async getCommentReplies(
        @Param("id") id: number,
        @Req() req?: any,
    ): Promise<ForumCommentDTO[]> {
        const userId = req?.userData?.id;
        return this.forumCommentService.getCommentReplies(Number(id), userId);
    }

    @Post(":id/vote")
    @ApiOperation({
        summary:
            "Vote on a comment (upvote or downvote). Toggle off if already voted.",
    })
    @ApiResponse({
        status: 200,
        description: "Vote processed successfully",
        type: ForumCommentDTO,
    })
    @ApiResponse({ status: 400, description: "Invalid vote type" })
    @ApiResponse({ status: 403, description: "Not a room member" })
    @ApiResponse({ status: 404, description: "Comment not found" })
    async voteComment(
        @Param("id") id: number,
        @Body() dto: VoteForumCommentDTO,
        @Req() req: any,
    ): Promise<ForumCommentDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumCommentService.voteComment(Number(id), userId, dto);
    }

    @Put(":id")
    @ApiOperation({ summary: "Update a comment (author/moderator/admin only)" })
    @ApiResponse({
        status: 200,
        description: "Comment updated successfully",
        type: ForumCommentDTO,
    })
    @ApiResponse({ status: 403, description: "No permission" })
    @ApiResponse({ status: 404, description: "Comment not found" })
    async updateComment(
        @Param("id") id: number,
        @Body() body: { content: string },
        @Req() req: any,
    ): Promise<ForumCommentDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumCommentService.updateComment(
            Number(id),
            userId,
            body.content,
        );
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete a comment (author/moderator/admin only)" })
    @ApiResponse({
        status: 200,
        description: "Comment deleted successfully",
    })
    @ApiResponse({ status: 403, description: "No permission" })
    @ApiResponse({ status: 404, description: "Comment not found" })
    async deleteComment(
        @Param("id") id: number,
        @Req() req: any,
    ): Promise<void> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumCommentService.deleteComment(Number(id), userId);
    }
}
