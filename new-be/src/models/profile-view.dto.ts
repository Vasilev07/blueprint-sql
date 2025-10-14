import { ApiProperty } from "@nestjs/swagger";

export class ProfileViewDTO {
    @ApiProperty()
    id: number;

    @ApiProperty({ description: "The user whose profile was viewed" })
    userId: number;

    @ApiProperty({ description: "The user who viewed the profile" })
    viewerId: number;

    @ApiProperty({ required: false })
    viewerName?: string;

    @ApiProperty({ required: false })
    viewerEmail?: string;

    @ApiProperty({ required: false })
    viewerProfilePictureId?: number;

    @ApiProperty()
    isFriend: boolean;

    @ApiProperty()
    viewedAt: Date;
}

export class ProfileViewNotificationDTO {
    @ApiProperty()
    viewerId: number;

    @ApiProperty()
    viewerName: string;

    @ApiProperty({ required: false })
    viewerEmail?: string;

    @ApiProperty({ required: false })
    viewerProfilePictureId?: number;

    @ApiProperty()
    isFriend: boolean;

    @ApiProperty()
    viewedAt: Date;
}

