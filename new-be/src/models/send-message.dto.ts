import { ApiProperty } from "@nestjs/swagger";

export class SendMessageDTO {
    @ApiProperty({ description: "Conversation ID" })
    conversationId: number;

    @ApiProperty({ description: "Sender user ID" })
    senderId: number;

    @ApiProperty({ description: "Message content" })
    content: string;

    @ApiProperty({
        description: "Message type",
        enum: ["text", "image", "file"],
        default: "text",
    })
    type?: "text" | "image" | "file";
}
