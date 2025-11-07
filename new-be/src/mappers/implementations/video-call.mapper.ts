import { BaseMapper } from "@mappers/base.mapper";
import { VideoCall } from "@entities/video-call.entity";
import { VideoCallDTO } from "../../models/video-call.dto";
import { Injectable, Inject } from "@nestjs/common";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class VideoCallMapper implements BaseMapper<VideoCall, VideoCallDTO> {
    constructor(
        @Inject(MapperService)
        private readonly mapperService: MapperService,
    ) {}

    entityToDTO(entity: VideoCall): VideoCallDTO {
        const dto = new VideoCallDTO();
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

    dtoToEntity(dto: VideoCallDTO): VideoCall {
        throw new Error("Method not implemented.");
    }
}

