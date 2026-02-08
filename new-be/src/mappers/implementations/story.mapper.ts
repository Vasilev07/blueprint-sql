import { BaseMapper } from "@mappers/base.mapper";
import { Story } from "@entities/story.entity";
import { StoryDTO } from "../../models/story.dto";
import { Injectable, Inject } from "@nestjs/common";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class StoryMapper implements BaseMapper<Story, StoryDTO> {
    constructor(
        @Inject(MapperService)
        private readonly mapperService: MapperService,
    ) {}

    entityToDTO(entity: Story): StoryDTO {
        const dto = new StoryDTO();
        dto.id = entity.id;
        dto.userId = entity.userId;
        dto.filePath = entity.filePath;
        dto.originalFilename = entity.originalFilename;
        dto.fileSize = entity.fileSize;
        dto.duration = entity.duration;
        dto.mimeType = entity.mimeType;
        dto.width = entity.width;
        dto.height = entity.height;
        dto.thumbnailPath = entity.thumbnailPath;
        dto.views = entity.views;
        dto.createdAt = entity.createdAt;
        dto.expiresAt = entity.expiresAt;
        dto.isProcessed = entity.isProcessed;

        // Map user entity to user name if available
        if (entity.user) {
            dto.userName =
                `${entity.user.firstname} ${entity.user.lastname}`.trim();
        }

        return dto;
    }

    dtoToEntity(_dto: StoryDTO): Story {
        throw new Error("Method not implemented.");
    }
}
