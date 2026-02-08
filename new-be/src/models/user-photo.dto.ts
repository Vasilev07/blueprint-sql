import { ApiProperty } from "@nestjs/swagger";

export class UserPhotoDTO {
    @ApiProperty()
    id?: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    userId: number;

    @ApiProperty()
    uploadedAt?: Date;

    @ApiProperty({ required: false })
    likesCount?: number;

    @ApiProperty({
        required: false,
        description: "Whether the current user has liked this photo",
    })
    isLikedByCurrentUser?: boolean;
}
