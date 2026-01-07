import { BaseMapper } from "@mappers/base.mapper";
import { ForumRoomMember } from "@entities/forum-room-member.entity";
import { ForumRoomMemberDTO } from "../../models/forum-room-member.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ForumRoomMemberMapper
    implements BaseMapper<ForumRoomMember, ForumRoomMemberDTO>
{
    entityToDTO(entity: ForumRoomMember): ForumRoomMemberDTO {
        return {
            id: entity.id,
            roomId: entity.roomId,
            userId: entity.userId,
            role: entity.role,
            status: entity.status,
            unreadCount: entity.unreadCount,
            joinedAt: entity.joinedAt,
            updatedAt: entity.updatedAt,
        };
    }

    dtoToEntity(dto: ForumRoomMemberDTO): ForumRoomMember {
        const member = new ForumRoomMember();
        member.id = dto.id;
        member.roomId = dto.roomId;
        member.userId = dto.userId;
        member.role = dto.role;
        member.status = dto.status;
        member.unreadCount = dto.unreadCount;
        return member;
    }
}

