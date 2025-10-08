import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ChatService } from "@services/chat.service";

@Controller("chat")
@ApiTags("Chat")
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post("conversation")
    @ApiOperation({ summary: "Create a new message" })
    @ApiResponse({ status: 201, description: "Message created successfully" })
    async getOrCreateConversation(
        @Body() body: { userId: number; otherUserId: number },
    ) {
        return this.chatService.getOrCreateConversation(
            body.userId,
            body.otherUserId,
        );
    }

    @Get("conversations")
    @ApiOperation({ summary: "Create a new message" })
    @ApiResponse({ status: 201, description: "Message created successfully" })
    async getConversations(@Query("userId") userId: number) {
        return this.chatService.getConversationsForUser(Number(userId));
    }

    @Get("messages/:conversationId")
    @ApiOperation({ summary: "Create a new message" })
    @ApiResponse({ status: 201, description: "Message created successfully" })
    async getMessages(@Param("conversationId") conversationId: number) {
        return this.chatService.getMessagesForConversation(
            Number(conversationId),
        );
    }
}
