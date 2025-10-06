import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ChatService } from '@services/chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversation')
  async getOrCreateConversation(@Body() body: { userId: number; otherUserId: number }) {
    return this.chatService.getOrCreateConversation(body.userId, body.otherUserId);
  }

  @Get('conversations')
  async getConversations(@Query('userId') userId: number) {
    return this.chatService.getConversationsForUser(Number(userId));
  }

  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: number) {
    return this.chatService.getMessagesForConversation(Number(conversationId));
  }
}


