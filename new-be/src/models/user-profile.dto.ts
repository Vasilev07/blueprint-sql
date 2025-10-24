import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserProfileDTO {
    @ApiPropertyOptional()
    id?: number;

    @ApiPropertyOptional()
    userId?: number;

    @ApiPropertyOptional()
    bio?: string;

    @ApiPropertyOptional()
    city?: string;

    @ApiPropertyOptional()
    location?: string;

    @ApiPropertyOptional({ type: [String] })
    interests?: string[];

    @ApiPropertyOptional({ default: true })
    appearsInSearches?: boolean;

    @ApiPropertyOptional()
    profilePictureId?: number;

    @ApiPropertyOptional()
    dateOfBirth?: Date;

    @ApiPropertyOptional()
    isVerified?: boolean;

    @ApiPropertyOptional()
    createdAt?: Date;

    @ApiPropertyOptional()
    updatedAt?: Date;
}

export class UpdateUserProfileDTO {
    @ApiPropertyOptional()
    bio?: string;

    @ApiPropertyOptional()
    city?: string;

    @ApiPropertyOptional()
    location?: string;

    @ApiPropertyOptional({ type: [String] })
    interests?: string[];

    @ApiPropertyOptional()
    appearsInSearches?: boolean;

    @ApiPropertyOptional()
    dateOfBirth?: Date;
}

