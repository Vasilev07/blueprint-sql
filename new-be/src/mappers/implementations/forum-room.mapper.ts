import { BaseMapper } from "@mappers/base.mapper";
import { ForumRoom } from "@entities/forum-room.entity";
import { ForumRoomDTO } from "../../models/forum-room.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ForumRoomMapper implements BaseMapper<ForumRoom, ForumRoomDTO> {
    entityToDTO(entity: ForumRoom): ForumRoomDTO {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            visibility: entity.visibility,
            createdBy: entity.createdBy,
            memberCount: entity.memberCount,
            maxMembers: entity.maxMembers,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    dtoToEntity(dto: ForumRoomDTO): ForumRoom {
        const room = new ForumRoom();
        room.id = dto.id;
        room.name = dto.name;
        room.description = dto.description;
        room.visibility = dto.visibility;
        room.createdBy = dto.createdBy;
        room.memberCount = dto.memberCount;
        room.maxMembers = dto.maxMembers;
        room.status = dto.status;
        return room;
    }
}
