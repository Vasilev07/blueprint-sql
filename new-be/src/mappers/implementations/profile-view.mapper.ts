import { BaseMapper } from "@mappers/base.mapper";
import { ProfileView } from "@entities/profile-view.entity";
import { ProfileViewDTO } from "../../models/profile-view.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ProfileViewMapper
    implements BaseMapper<ProfileView, ProfileViewDTO>
{
    entityToDTO(entity: ProfileView): ProfileViewDTO {
        return {
            id: entity.id,
            userId: entity.userId,
            viewerId: entity.viewerId,
            viewerName: entity.viewer
                ? `${entity.viewer.firstname} ${entity.viewer.lastname}`.trim()
                : undefined,
            viewerEmail: entity.viewer?.email,
            viewerProfilePictureId: entity.viewer?.profile?.profilePictureId,
            isFriend: entity.isFriend,
            viewedAt: entity.viewedAt,
        };
    }

    dtoToEntity(dto: ProfileViewDTO): ProfileView {
        const view = new ProfileView();
        view.userId = dto.userId;
        view.viewerId = dto.viewerId;
        view.isFriend = dto.isFriend;
        return view;
    }
}
