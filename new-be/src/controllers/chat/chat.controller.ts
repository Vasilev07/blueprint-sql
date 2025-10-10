import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ChatService } from "@services/chat.service";
import { ChatConversationDTO } from "../../models/chat-conversation.dto";
import { ChatMessageDTO } from "../../models/chat-message.dto";
import { CreateConversationDTO } from "../../models/create-conversation.dto";

@Controller("chat")
@ApiTags("Chat")
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post("conversation")
    @ApiOperation({ summary: "Get or create a conversation between two users" })
    @ApiResponse({
        status: 201,
        description: "Conversation retrieved or created successfully",
        type: ChatConversationDTO,
    })
    @ApiResponse({
        status: 400,
        description: "Invalid participants",
    })
    async getOrCreateConversation(
        @Body() body: CreateConversationDTO,
    ): Promise<ChatConversationDTO> {
        return this.chatService.getOrCreateConversation(
            body.userId,
            body.otherUserId,
        );
    }

    @Get("conversations")
    @ApiOperation({ summary: "Get all conversations for a user" })
    @ApiResponse({
        status: 200,
        description: "Conversations retrieved successfully",
        type: [ChatConversationDTO],
    })
    async getConversations(
        @Query("userId") userId: number,
    ): Promise<ChatConversationDTO[]> {
        return this.chatService.getConversationsForUser(Number(userId));
    }

    @Get("messages/:conversationId")
    @ApiOperation({ summary: "Get all messages in a conversation" })
    @ApiResponse({
        status: 200,
        description: "Messages retrieved successfully",
        type: [ChatMessageDTO],
    })
    async getMessages(
        @Param("conversationId") conversationId: number,
    ): Promise<ChatMessageDTO[]> {
        return this.chatService.getMessagesForConversation(
            Number(conversationId),
        );
    }
}
