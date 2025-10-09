import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatConversation } from "../../entities/chat-conversation.entity";
import { ChatParticipant } from "../../entities/chat-participant.entity";
import { ChatMessage } from "../../entities/chat-message.entity";
import { ChatService } from "../../services/chat.service";
import { ChatGateway } from "../../gateways/chat.gateway";
import { ChatController } from "./chat.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ChatConversation,
            ChatParticipant,
            ChatMessage,
        ]),
    ],
    providers: [ChatService, ChatGateway],
    controllers: [ChatController],
    exports: [ChatService, ChatGateway],
})
export class ChatModule {}
