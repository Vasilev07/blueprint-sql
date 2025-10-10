import { ApiProperty } from "@nestjs/swagger";
import { ChatMessageDTO } from "./chat-message.dto";

export class OtherUserDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    firstname: string;

    @ApiProperty()
    lastname: string;

    @ApiProperty()
    email: string;
}

export class ChatConversationDTO {
    @ApiProperty()
    id: number;

    @ApiProperty({ type: [Number] })
    participants: number[];

    @ApiProperty({ type: [ChatMessageDTO], required: false })
    messages?: ChatMessageDTO[];

    @ApiProperty()
    unreadCount: number;

    @ApiProperty({ type: OtherUserDTO, required: false })
    otherUser?: OtherUserDTO;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

