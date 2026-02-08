import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ForumPost } from "../entities/forum-post.entity";
import { ForumRoom } from "../entities/forum-room.entity";
import { ForumRoomMember } from "../entities/forum-room-member.entity";
import { ForumPostDTO } from "../models/forum-post.dto";
import { CreateForumPostDTO } from "../models/create-forum-post.dto";
import { MapperService } from "@mappers/mapper.service";
import { ForumRoomService } from "./forum-room.service";

@Injectable()
export class ForumPostService {
    constructor(
        @InjectRepository(ForumPost)
        private forumPostRepo: Repository<ForumPost>,
        @InjectRepository(ForumRoom)
        private forumRoomRepo: Repository<ForumRoom>,
        @InjectRepository(ForumRoomMember)
        private forumRoomMemberRepo: Repository<ForumRoomMember>,
        private mapperService: MapperService,
        private forumRoomService: ForumRoomService,
    ) {}

    async createPost(
        userId: number,
        dto: CreateForumPostDTO,
    ): Promise<ForumPostDTO> {
        // Verify room exists and user is member
        const member = await this.forumRoomService.checkUserIsMember(
            dto.roomId,
            userId,
        );
        if (!member) {
            throw new ForbiddenException(
                "You must be a member of the room to create posts",
            );
        }

        // Verify room is active
        const room = await this.forumRoomRepo.findOne({
            where: { id: dto.roomId },
        });
        if (!room || room.status !== "active") {
            throw new BadRequestException("Room is not active");
        }

        // Create post
        const post = await this.forumPostRepo.save(
            this.forumPostRepo.create({
                roomId: dto.roomId,
                authorId: userId,
                title: dto.title,
                content: dto.content,
                type: dto.type || "text",
                status: "active",
            }),
        );

        // Reset unread counts for other members (increment their unreadCount)
        await this.forumRoomMemberRepo
            .createQueryBuilder()
            .update(ForumRoomMember)
            .set({ unreadCount: () => "unreadCount + 1" })
            .where("roomId = :roomId", { roomId: dto.roomId })
            .andWhere("userId != :userId", { userId })
            .andWhere("status = :status", { status: "joined" })
            .execute();

        return this.mapperService.entityToDTO<ForumPost, ForumPostDTO>(
            "ForumPost",
            post,
        );
    }

    async getPostById(postId: number, userId?: number): Promise<ForumPostDTO> {
        const post = await this.forumPostRepo.findOne({
            where: { id: postId },
            relations: ["room"],
        });

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        // Check room permissions
        if (userId) {
            await this.forumRoomService.getRoomById(post.roomId, userId);
        }

        // Filter deleted posts for non-admins
        if (post.status === "deleted" || post.status === "hidden") {
            if (userId) {
                const hasAdminPermission =
                    await this.forumRoomService.hasPermission(
                        post.roomId,
                        userId,
                        "admin",
                    );
                if (!hasAdminPermission) {
                    throw new NotFoundException("Post not found");
                }
            } else {
                throw new NotFoundException("Post not found");
            }
        }

        return this.mapperService.entityToDTO<ForumPost, ForumPostDTO>(
            "ForumPost",
            post,
        );
    }

    async getPostsByRoom(
        roomId: number,
        userId?: number,
        options?: {
            limit?: number;
            offset?: number;
            sortBy?: "createdAt" | "commentCount";
        },
    ): Promise<ForumPostDTO[]> {
        // Verify room exists and user has access
        await this.forumRoomService.getRoomById(roomId, userId);

        const queryBuilder = this.forumPostRepo
            .createQueryBuilder("post")
            .where("post.roomId = :roomId", { roomId });

        // Filter by status (hide deleted/hidden for non-admins)
        if (userId) {
            const hasAdminPermission =
                await this.forumRoomService.hasPermission(
                    roomId,
                    userId,
                    "admin",
                );
            if (!hasAdminPermission) {
                queryBuilder.andWhere("post.status = :status", {
                    status: "active",
                });
            }
        } else {
            queryBuilder.andWhere("post.status = :status", {
                status: "active",
            });
        }

        // Sort: pinned first, then by sortBy option
        const sortBy = options?.sortBy || "createdAt";
        queryBuilder
            .orderBy("post.isPinned", "DESC")
            .addOrderBy(`post.${sortBy}`, "DESC");

        // Pagination
        if (options?.limit) {
            queryBuilder.limit(options.limit);
        }
        if (options?.offset) {
            queryBuilder.offset(options.offset);
        }

        const posts = await queryBuilder.getMany();

        return posts.map((post) =>
            this.mapperService.entityToDTO<ForumPost, ForumPostDTO>(
                "ForumPost",
                post,
            ),
        );
    }

    async updatePost(
        postId: number,
        userId: number,
        updates: Partial<CreateForumPostDTO>,
    ): Promise<ForumPostDTO> {
        const post = await this.forumPostRepo.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        // Check permissions: author, moderator, or admin
        const isAuthor = post.authorId === userId;
        const hasModeratorPermission =
            await this.forumRoomService.hasPermission(
                post.roomId,
                userId,
                "moderator",
            );

        if (!isAuthor && !hasModeratorPermission) {
            throw new ForbiddenException(
                "Only post author, moderators, or admins can update posts",
            );
        }

        // Update post
        if (updates.title !== undefined) {
            post.title = updates.title;
        }
        if (updates.content !== undefined) {
            post.content = updates.content;
        }
        if (updates.type !== undefined) {
            post.type = updates.type;
        }

        const updated = await this.forumPostRepo.save(post);

        return this.mapperService.entityToDTO<ForumPost, ForumPostDTO>(
            "ForumPost",
            updated,
        );
    }

    async deletePost(postId: number, userId: number): Promise<void> {
        const post = await this.forumPostRepo.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        // Check permissions: author, moderator, or admin
        const isAuthor = post.authorId === userId;
        const hasModeratorPermission =
            await this.forumRoomService.hasPermission(
                post.roomId,
                userId,
                "moderator",
            );

        if (!isAuthor && !hasModeratorPermission) {
            throw new ForbiddenException(
                "Only post author, moderators, or admins can delete posts",
            );
        }

        // Soft delete
        await this.forumPostRepo.update({ id: postId }, { status: "deleted" });
    }

    async pinPost(postId: number, userId: number): Promise<ForumPostDTO> {
        const post = await this.forumPostRepo.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        // Only moderators/admins can pin
        const hasModeratorPermission =
            await this.forumRoomService.hasPermission(
                post.roomId,
                userId,
                "moderator",
            );

        if (!hasModeratorPermission) {
            throw new ForbiddenException(
                "Only moderators or admins can pin posts",
            );
        }

        // Toggle pin status
        post.isPinned = !post.isPinned;
        const updated = await this.forumPostRepo.save(post);

        return this.mapperService.entityToDTO<ForumPost, ForumPostDTO>(
            "ForumPost",
            updated,
        );
    }

    async lockPost(postId: number, userId: number): Promise<ForumPostDTO> {
        const post = await this.forumPostRepo.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        // Only moderators/admins can lock
        const hasModeratorPermission =
            await this.forumRoomService.hasPermission(
                post.roomId,
                userId,
                "moderator",
            );

        if (!hasModeratorPermission) {
            throw new ForbiddenException(
                "Only moderators or admins can lock posts",
            );
        }

        // Toggle lock status
        post.isLocked = !post.isLocked;
        const updated = await this.forumPostRepo.save(post);

        return this.mapperService.entityToDTO<ForumPost, ForumPostDTO>(
            "ForumPost",
            updated,
        );
    }
}
