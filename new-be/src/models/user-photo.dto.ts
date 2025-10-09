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
}

