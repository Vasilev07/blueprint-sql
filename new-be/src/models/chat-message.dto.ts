import { ApiProperty } from "@nestjs/swagger";

export class ChatMessageDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    conversationId: number;

    @ApiProperty()
    senderId: number;

    @ApiProperty()
    content: string;

    @ApiProperty({ enum: ["text", "image", "file"] })
    type: "text" | "image" | "file";

    @ApiProperty()
    isRead: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
