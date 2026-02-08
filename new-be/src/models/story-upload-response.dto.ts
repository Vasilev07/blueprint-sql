import { ApiProperty } from "@nestjs/swagger";

export class StoryUploadResponseDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    filePath: string;

    @ApiProperty()
    message: string;
}
