import { BaseMapper } from "@mappers/base.mapper";
import { LiveStreamSession } from "@entities/live-stream-session.entity";
import { LiveStreamSessionDTO } from "../../models/live-stream-session.dto";
import { Injectable, Inject } from "@nestjs/common";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class LiveStreamSessionMapper implements BaseMapper<LiveStreamSession, LiveStreamSessionDTO> {
    constructor(
        @Inject(MapperService)
        private readonly mapperService: MapperService,
    ) {}

    entityToDTO(entity: LiveStreamSession): LiveStreamSessionDTO {
        const dto = new LiveStreamSessionDTO();
        dto.id = entity.id;
        dto.initiatorId = entity.initiatorId;
        dto.recipientId = entity.recipientId;
        dto.status = entity.status;
        dto.createdAt = entity.createdAt;
        dto.startedAt = entity.startedAt;
        dto.endedAt = entity.endedAt;
        dto.updatedAt = entity.updatedAt;
        dto.durationSeconds = entity.durationSeconds;
        dto.endReason = entity.endReason;
        dto.isLiveStream = entity.isLiveStream;
        dto.roomName = entity.roomName;
        dto.maxParticipants = entity.maxParticipants;

        // Map user entities to UserDTOs using the User mapper
        if (entity.initiator) {
            dto.initiator = this.mapperService.entityToDTO(
                "User",
                entity.initiator,
            );
        }

        if (entity.recipient) {
            dto.recipient = this.mapperService.entityToDTO(
                "User",
                entity.recipient,
            );
        }

        return dto;
    }

    dtoToEntity(dto: LiveStreamSessionDTO): LiveStreamSession {
        throw new Error("Method not implemented.");
    }
}
