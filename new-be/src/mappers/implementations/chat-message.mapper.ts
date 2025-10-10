import { BaseMapper } from "@mappers/base.mapper";
import { ChatMessage } from "@entities/chat-message.entity";
import { ChatMessageDTO } from "../../models/chat-message.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ChatMessageMapper implements BaseMapper<ChatMessage, ChatMessageDTO> {
    entityToDTO(entity: ChatMessage): ChatMessageDTO {
        return {
            id: entity.id,
            conversationId: entity.conversationId,
            senderId: entity.senderId,
            content: entity.content,
            type: entity.type,
            isRead: entity.isRead,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    dtoToEntity(dto: ChatMessageDTO): ChatMessage {
        const message = new ChatMessage();
        message.conversationId = dto.conversationId;
        message.senderId = dto.senderId;
        message.content = dto.content;
        message.type = dto.type;
        message.isRead = dto.isRead;
        return message;
    }
}

