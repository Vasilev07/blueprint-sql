import { BaseMapper } from "@mappers/base.mapper";
import { ForumPost } from "@entities/forum-post.entity";
import { ForumPostDTO } from "../../models/forum-post.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ForumPostMapper implements BaseMapper<ForumPost, ForumPostDTO> {
    entityToDTO(entity: ForumPost): ForumPostDTO {
        return {
            id: entity.id,
            roomId: entity.roomId,
            authorId: entity.authorId,
            title: entity.title,
            content: entity.content,
            type: entity.type,
            commentCount: entity.commentCount,
            likeCount: entity.likeCount,
            isPinned: entity.isPinned,
            isLocked: entity.isLocked,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    dtoToEntity(dto: ForumPostDTO): ForumPost {
        const post = new ForumPost();
        post.id = dto.id;
        post.roomId = dto.roomId;
        post.authorId = dto.authorId;
        post.title = dto.title;
        post.content = dto.content;
        post.type = dto.type;
        post.commentCount = dto.commentCount;
        post.likeCount = dto.likeCount;
        post.isPinned = dto.isPinned;
        post.isLocked = dto.isLocked;
        post.status = dto.status;
        return post;
    }
}

