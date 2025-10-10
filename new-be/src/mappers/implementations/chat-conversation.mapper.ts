import { BaseMapper } from "@mappers/base.mapper";
import { ChatConversation } from "@entities/chat-conversation.entity";
import { ChatConversationDTO } from "../../models/chat-conversation.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ChatConversationMapper implements BaseMapper<ChatConversation, ChatConversationDTO> {
    entityToDTO(entity: ChatConversation): ChatConversationDTO {
        return {
            id: entity.id,
            participants: entity.participants?.map(p => p.userId) || [],
            messages: [],
            unreadCount: 0,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    dtoToEntity(dto: ChatConversationDTO): ChatConversation {
        const conversation = new ChatConversation();
        // Minimal implementation - conversation creation is handled in service
        return conversation;
    }
}

