import { ApiProperty } from "@nestjs/swagger";
import { Gender } from "../enums/gender.enum";

export class UserDTO {
    @ApiProperty()
    id?: number;

    @ApiProperty()
    email: string;

    @ApiProperty()
    password: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty()
    confirmPassword: string;

    @ApiProperty({ enum: Gender, required: false })
    gender?: Gender;

    @ApiProperty({ required: false })
    city?: string;

    @ApiProperty({ required: false })
    lastOnline?: Date;

    @ApiProperty({ required: false })
    profilePictureId?: number;

    // Profile fields
    @ApiProperty({ required: false })
    bio?: string;

    @ApiProperty({ required: false })
    location?: string;

    @ApiProperty({ required: false, type: [String] })
    interests?: string[];

    @ApiProperty({ required: false })
    isVerified?: boolean;

    @ApiProperty({ required: false })
    appearsInSearches?: boolean;

    @ApiProperty({ required: false })
    profileViewsCount?: number;

    @ApiProperty({ required: false })
    superLikesCount?: number;
}
