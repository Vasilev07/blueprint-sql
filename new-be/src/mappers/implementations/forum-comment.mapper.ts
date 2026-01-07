import { BaseMapper } from "@mappers/base.mapper";
import { ForumComment } from "@entities/forum-comment.entity";
import { ForumCommentDTO } from "../../models/forum-comment.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ForumCommentMapper
    implements BaseMapper<ForumComment, ForumCommentDTO>
{
    entityToDTO(entity: ForumComment): ForumCommentDTO {
        return {
            id: entity.id,
            postId: entity.postId,
            parentCommentId: entity.parentCommentId,
            authorId: entity.authorId,
            content: entity.content,
            type: entity.type,
            replyCount: entity.replyCount,
            likeCount: entity.likeCount,
            depth: entity.depth,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    dtoToEntity(dto: ForumCommentDTO): ForumComment {
        const comment = new ForumComment();
        comment.id = dto.id;
        comment.postId = dto.postId;
        comment.parentCommentId = dto.parentCommentId;
        comment.authorId = dto.authorId;
        comment.content = dto.content;
        comment.type = dto.type;
        comment.replyCount = dto.replyCount;
        comment.likeCount = dto.likeCount;
        comment.depth = dto.depth;
        comment.status = dto.status;
        return comment;
    }
}

