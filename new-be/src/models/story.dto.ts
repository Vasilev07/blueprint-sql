import { ApiProperty } from "@nestjs/swagger";

export class StoryDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: number;

    @ApiProperty()
    userName?: string;

    @ApiProperty()
    filePath: string;

    @ApiProperty()
    originalFilename: string;

    @ApiProperty()
    fileSize: number;

    @ApiProperty({ required: false })
    duration?: number;

    @ApiProperty()
    mimeType: string;

    @ApiProperty({ required: false })
    width?: number;

    @ApiProperty({ required: false })
    height?: number;

    @ApiProperty({ required: false })
    thumbnailPath?: string;

    @ApiProperty()
    views: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    expiresAt: Date;

    @ApiProperty()
    isProcessed: boolean;
}
