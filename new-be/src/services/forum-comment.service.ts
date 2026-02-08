import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { ForumComment } from "../entities/forum-comment.entity";
import { ForumPost } from "../entities/forum-post.entity";
import { ForumRoomMember } from "../entities/forum-room-member.entity";
import { ForumCommentVote } from "../entities/forum-comment-vote.entity";
import { ForumCommentDTO } from "../models/forum-comment.dto";
import { CreateForumCommentDTO } from "../models/create-forum-comment.dto";
import { VoteForumCommentDTO } from "../models/vote-forum-comment.dto";
import { MapperService } from "@mappers/mapper.service";
import { ForumRoomService } from "./forum-room.service";

@Injectable()
export class ForumCommentService {
    constructor(
        @InjectRepository(ForumComment)
        private forumCommentRepo: Repository<ForumComment>,
        @InjectRepository(ForumPost)
        private forumPostRepo: Repository<ForumPost>,
        @InjectRepository(ForumRoomMember)
        private forumRoomMemberRepo: Repository<ForumRoomMember>,
        @InjectRepository(ForumCommentVote)
        private forumCommentVoteRepo: Repository<ForumCommentVote>,
        private mapperService: MapperService,
        private forumRoomService: ForumRoomService,
    ) {}

    async createComment(
        userId: number,
        dto: CreateForumCommentDTO,
    ): Promise<ForumCommentDTO> {
        // Verify post exists
        const post = await this.forumPostRepo.findOne({
            where: { id: dto.postId },
            relations: ["room"],
        });

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        // Verify post is not locked
        if (post.isLocked) {
            throw new BadRequestException(
                "Post is locked and cannot be commented on",
            );
        }

        // Verify user is room member
        const member = await this.forumRoomService.checkUserIsMember(
            post.roomId,
            userId,
        );
        if (!member) {
            throw new ForbiddenException(
                "You must be a member of the room to comment",
            );
        }

        let parentComment: ForumComment | null = null;
        let depth = 0;

        // If parentCommentId provided, verify it exists and calculate depth
        if (dto.parentCommentId) {
            parentComment = await this.forumCommentRepo.findOne({
                where: { id: dto.parentCommentId, postId: dto.postId },
            });

            if (!parentComment) {
                throw new NotFoundException("Parent comment not found");
            }

            // Calculate depth (parent depth + 1)
            depth = parentComment.depth + 1;

            // Limit nesting depth (optional: prevent infinite nesting)
            if (depth > 5) {
                throw new BadRequestException(
                    "Maximum comment depth reached (5 levels)",
                );
            }
        }

        // Create comment in transaction
        const comment = await this.forumCommentRepo.manager.transaction(
            async (trx) => {
                const comment = await trx.getRepository(ForumComment).save(
                    trx.getRepository(ForumComment).create({
                        postId: dto.postId,
                        parentCommentId: dto.parentCommentId || null,
                        authorId: userId,
                        content: dto.content,
                        type: dto.type || "text",
                        depth: depth,
                        status: "active",
                    }),
                );

                // Increment replyCount on parent comment if exists
                if (parentComment) {
                    await trx
                        .getRepository(ForumComment)
                        .increment(
                            { id: dto.parentCommentId! },
                            "replyCount",
                            1,
                        );
                }

                // Increment commentCount on post (only for top-level comments)
                if (!dto.parentCommentId) {
                    await trx
                        .getRepository(ForumPost)
                        .increment({ id: dto.postId }, "commentCount", 1);
                }

                // Reset unread counts for other room members
                await trx
                    .getRepository(ForumRoomMember)
                    .createQueryBuilder()
                    .update(ForumRoomMember)
                    .set({ unreadCount: () => "unreadCount + 1" })
                    .where("roomId = :roomId", { roomId: post.roomId })
                    .andWhere("userId != :userId", { userId })
                    .andWhere("status = :status", { status: "joined" })
                    .execute();

                return comment;
            },
        );

        const commentDto = this.mapperService.entityToDTO<
            ForumComment,
            ForumCommentDTO
        >("ForumComment", comment);
        // New comments don't have user votes yet
        commentDto.userVote = null;
        return commentDto;
    }

    async getCommentsByPost(
        postId: number,
        userId?: number,
        options?: {
            limit?: number;
            offset?: number;
            maxDepth?: number;
        },
    ): Promise<ForumCommentDTO[]> {
        // Verify post exists
        const post = await this.forumPostRepo.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        // Check room permissions
        if (userId) {
            await this.forumRoomService.getRoomById(post.roomId, userId);
        }

        const queryBuilder = this.forumCommentRepo
            .createQueryBuilder("comment")
            .where("comment.postId = :postId", { postId });

        // Filter by status (hide deleted/hidden for non-admins)
        if (userId) {
            const hasAdminPermission =
                await this.forumRoomService.hasPermission(
                    post.roomId,
                    userId,
                    "admin",
                );
            if (!hasAdminPermission) {
                queryBuilder.andWhere("comment.status = :status", {
                    status: "active",
                });
            }
        } else {
            queryBuilder.andWhere("comment.status = :status", {
                status: "active",
            });
        }

        // Apply maxDepth limit if provided (0 = top-level only, undefined/null = all depths)
        if (options?.maxDepth !== undefined && options.maxDepth !== null) {
            queryBuilder.andWhere("comment.depth <= :maxDepth", {
                maxDepth: options.maxDepth,
            });
        } else if (options?.maxDepth === 0) {
            // If maxDepth is 0, only load top-level comments
            queryBuilder.andWhere("comment.parentCommentId IS NULL");
        }

        // Order by depth first (to show top-level before replies), then by creation time
        queryBuilder
            .orderBy("comment.depth", "ASC")
            .addOrderBy("comment.createdAt", "ASC");

        // Pagination (optional, usually load all comments)
        if (options?.limit) {
            queryBuilder.limit(options.limit);
        }
        if (options?.offset) {
            queryBuilder.offset(options.offset);
        }

        const comments = await queryBuilder.getMany();

        // Get user votes if userId provided
        let userVotesMap: Map<number, "upvote" | "downvote"> | null = null;
        if (userId && comments.length > 0) {
            const commentIds = comments.map((c) => c.id);
            const votes = await this.forumCommentVoteRepo.find({
                where: {
                    commentId: In(commentIds),
                    userId: userId,
                },
            });
            userVotesMap = new Map();
            votes.forEach((vote) => {
                userVotesMap!.set(
                    vote.commentId,
                    vote.voteType as "upvote" | "downvote",
                );
            });
        }

        // Map to DTOs with user vote information
        return comments.map((comment) => {
            const dto = this.mapperService.entityToDTO<
                ForumComment,
                ForumCommentDTO
            >("ForumComment", comment);
            if (userId && userVotesMap) {
                dto.userVote = userVotesMap.get(comment.id) ?? null;
            }
            return dto;
        });
    }

    async getCommentReplies(
        commentId: number,
        userId?: number,
    ): Promise<ForumCommentDTO[]> {
        // Verify parent comment exists
        const parentComment = await this.forumCommentRepo.findOne({
            where: { id: commentId },
            relations: ["post", "post.room"],
        });

        if (!parentComment) {
            throw new NotFoundException("Comment not found");
        }

        // Check room permissions
        if (userId) {
            await this.forumRoomService.getRoomById(
                parentComment.post.roomId,
                userId,
            );
        }

        const queryBuilder = this.forumCommentRepo
            .createQueryBuilder("comment")
            .where("comment.parentCommentId = :commentId", { commentId });

        // Filter by status
        if (userId) {
            const hasAdminPermission =
                await this.forumRoomService.hasPermission(
                    parentComment.post.roomId,
                    userId,
                    "admin",
                );
            if (!hasAdminPermission) {
                queryBuilder.andWhere("comment.status = :status", {
                    status: "active",
                });
            }
        } else {
            queryBuilder.andWhere("comment.status = :status", {
                status: "active",
            });
        }

        queryBuilder.orderBy("comment.createdAt", "ASC");

        const replies = await queryBuilder.getMany();

        // Get user votes if userId provided
        let userVotesMap: Map<number, "upvote" | "downvote"> | null = null;
        if (userId && replies.length > 0) {
            const replyIds = replies.map((r) => r.id);
            const votes = await this.forumCommentVoteRepo.find({
                where: {
                    commentId: In(replyIds),
                    userId: userId,
                },
            });
            userVotesMap = new Map();
            votes.forEach((vote) => {
                userVotesMap!.set(
                    vote.commentId,
                    vote.voteType as "upvote" | "downvote",
                );
            });
        }

        // Map to DTOs with user vote information
        return replies.map((reply) => {
            const dto = this.mapperService.entityToDTO<
                ForumComment,
                ForumCommentDTO
            >("ForumComment", reply);
            if (userId && userVotesMap) {
                dto.userVote = userVotesMap.get(reply.id) ?? null;
            }
            return dto;
        });
    }

    async updateComment(
        commentId: number,
        userId: number,
        content: string,
    ): Promise<ForumCommentDTO> {
        const comment = await this.forumCommentRepo.findOne({
            where: { id: commentId },
            relations: ["post"],
        });

        if (!comment) {
            throw new NotFoundException("Comment not found");
        }

        // Check permissions: author only, or moderator/admin
        const isAuthor = comment.authorId === userId;
        const hasModeratorPermission =
            await this.forumRoomService.hasPermission(
                comment.post.roomId,
                userId,
                "moderator",
            );

        if (!isAuthor && !hasModeratorPermission) {
            throw new ForbiddenException(
                "Only comment author, moderators, or admins can update comments",
            );
        }

        // Update comment
        comment.content = content;
        const updated = await this.forumCommentRepo.save(comment);

        // Get user's vote status if userId provided
        let userVote: "upvote" | "downvote" | null = null;
        if (userId) {
            const vote = await this.forumCommentVoteRepo.findOne({
                where: {
                    commentId: commentId,
                    userId: userId,
                },
            });
            userVote = (vote?.voteType as "upvote" | "downvote" | null) ?? null;
        }

        const commentDto = this.mapperService.entityToDTO<
            ForumComment,
            ForumCommentDTO
        >("ForumComment", updated);
        commentDto.userVote = userId ? userVote : undefined;
        return commentDto;
    }

    async deleteComment(commentId: number, userId: number): Promise<void> {
        const comment = await this.forumCommentRepo.findOne({
            where: { id: commentId },
            relations: ["post"],
        });

        if (!comment) {
            throw new NotFoundException("Comment not found");
        }

        // Check permissions: author, moderator, or admin
        const isAuthor = comment.authorId === userId;
        const hasModeratorPermission =
            await this.forumRoomService.hasPermission(
                comment.post.roomId,
                userId,
                "moderator",
            );

        if (!isAuthor && !hasModeratorPermission) {
            throw new ForbiddenException(
                "Only comment author, moderators, or admins can delete comments",
            );
        }

        // Soft delete in transaction
        await this.forumCommentRepo.manager.transaction(async (trx) => {
            // Soft delete comment
            await trx
                .getRepository(ForumComment)
                .update({ id: commentId }, { status: "deleted" });

            // Decrement replyCount on parent comment if exists
            if (comment.parentCommentId) {
                await trx
                    .getRepository(ForumComment)
                    .decrement(
                        { id: comment.parentCommentId },
                        "replyCount",
                        1,
                    );
            }

            // Decrement commentCount on post (only for top-level comments)
            if (!comment.parentCommentId) {
                await trx
                    .getRepository(ForumPost)
                    .decrement({ id: comment.postId }, "commentCount", 1);
            }
        });
    }

    async voteComment(
        commentId: number,
        userId: number,
        dto: VoteForumCommentDTO,
    ): Promise<ForumCommentDTO> {
        // Verify comment exists and get post for permission checks
        const comment = await this.forumCommentRepo.findOne({
            where: { id: commentId },
            relations: ["post"],
        });

        if (!comment) {
            throw new NotFoundException("Comment not found");
        }

        // Verify user is room member
        const member = await this.forumRoomService.checkUserIsMember(
            comment.post.roomId,
            userId,
        );
        if (!member) {
            throw new ForbiddenException(
                "You must be a member of the room to vote on comments",
            );
        }

        // Check if user already voted on this comment
        const existingVote = await this.forumCommentVoteRepo.findOne({
            where: {
                commentId: commentId,
                userId: userId,
            },
        });

        return await this.forumCommentRepo.manager.transaction(async (trx) => {
            if (existingVote) {
                // User already voted - handle vote change or removal
                if (existingVote.voteType === dto.voteType) {
                    // Same vote type - remove vote (toggle off)
                    await trx
                        .getRepository(ForumCommentVote)
                        .remove(existingVote);

                    // Update counts
                    if (dto.voteType === "upvote") {
                        await trx
                            .getRepository(ForumComment)
                            .decrement({ id: commentId }, "upvoteCount", 1);
                    } else {
                        await trx
                            .getRepository(ForumComment)
                            .decrement({ id: commentId }, "downvoteCount", 1);
                    }
                } else {
                    // Different vote type - change vote
                    const oldVoteType = existingVote.voteType;
                    existingVote.voteType = dto.voteType;
                    await trx
                        .getRepository(ForumCommentVote)
                        .save(existingVote);

                    // Update counts: decrement old, increment new
                    if (oldVoteType === "upvote") {
                        await trx
                            .getRepository(ForumComment)
                            .decrement({ id: commentId }, "upvoteCount", 1);
                        await trx
                            .getRepository(ForumComment)
                            .increment({ id: commentId }, "downvoteCount", 1);
                    } else {
                        await trx
                            .getRepository(ForumComment)
                            .decrement({ id: commentId }, "downvoteCount", 1);
                        await trx
                            .getRepository(ForumComment)
                            .increment({ id: commentId }, "upvoteCount", 1);
                    }
                }
            } else {
                // New vote - create vote record
                const vote = trx.getRepository(ForumCommentVote).create({
                    commentId: commentId,
                    userId: userId,
                    voteType: dto.voteType,
                });
                await trx.getRepository(ForumCommentVote).save(vote);

                // Update counts
                if (dto.voteType === "upvote") {
                    await trx
                        .getRepository(ForumComment)
                        .increment({ id: commentId }, "upvoteCount", 1);
                } else {
                    await trx
                        .getRepository(ForumComment)
                        .increment({ id: commentId }, "downvoteCount", 1);
                }
            }

            // Reload comment with updated counts
            const updatedComment = await trx
                .getRepository(ForumComment)
                .findOne({
                    where: { id: commentId },
                });

            // Get user's vote status
            const userVote = await trx.getRepository(ForumCommentVote).findOne({
                where: {
                    commentId: commentId,
                    userId: userId,
                },
            });

            const commentDto = this.mapperService.entityToDTO<
                ForumComment,
                ForumCommentDTO
            >("ForumComment", updatedComment!);
            commentDto.userVote =
                (userVote?.voteType as "upvote" | "downvote" | null) ?? null;
            return commentDto;
        });
    }
}
