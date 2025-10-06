import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { ChatService } from '../services/chat.service';

@WebSocketGateway({
  cors: { origin: 'http://localhost:4200', credentials: true },
  transports: ['websocket', 'polling']
})
@Injectable()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    const email = client.handshake.query.email as string;
    if (email) this.userSockets.set(email, client);
  }

  handleDisconnect(client: Socket) {
    const email = client.handshake.query.email as string;
    if (email) this.userSockets.delete(email);
  }

  @SubscribeMessage('chat:send')
  async handleSend(
    @MessageBody() payload: { conversationId?: number; senderId: number; recipientId: number; content: string },
    @ConnectedSocket() client: Socket
  ) {
    let conversationId = payload.conversationId;
    if (!conversationId) {
      const conv = await this.chatService.getOrCreateConversation(payload.senderId, payload.recipientId);
      conversationId = conv.id;
    }
    const message = await this.chatService.sendMessage(conversationId, payload.senderId, payload.content, 'text');
    this.server.emit(`chat:message:${conversationId}`, message);
    return message;
  }
}


