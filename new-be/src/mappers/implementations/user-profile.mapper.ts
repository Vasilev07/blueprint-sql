import { BaseMapper } from "@mappers/base.mapper";
import { UserProfile } from "@entities/user-profile.entity";
import { UserProfileDTO } from "../../models/user-profile.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserProfileMapper implements BaseMapper<UserProfile, UserProfileDTO> {
    entityToDTO(entity: UserProfile): UserProfileDTO {
        return {
            id: entity.id,
            userId: entity.userId,
            bio: entity.bio,
            city: entity.city,
            location: entity.location,
            interests: entity.interests || [],
            appearsInSearches: entity.appearsInSearches,
            profilePictureId: entity.profilePictureId,
            dateOfBirth: entity.dateOfBirth,
            isVerified: entity.isVerified,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    dtoToEntity(dto: UserProfileDTO): UserProfile {
        const profile = new UserProfile();
        profile.id = dto.id;
        profile.userId = dto.userId;
        profile.bio = dto.bio;
        profile.city = dto.city;
        profile.location = dto.location;
        profile.interests = dto.interests || [];
        profile.appearsInSearches = dto.appearsInSearches;
        profile.profilePictureId = dto.profilePictureId;
        profile.dateOfBirth = dto.dateOfBirth;
        profile.isVerified = dto.isVerified;
        return profile;
    }
}
