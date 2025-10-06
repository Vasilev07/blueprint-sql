import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation) private conversationsRepo: Repository<ChatConversation>,
    @InjectRepository(ChatParticipant) private participantsRepo: Repository<ChatParticipant>,
    @InjectRepository(ChatMessage) private messagesRepo: Repository<ChatMessage>,
  ) {}

  async getOrCreateConversation(userId: number, otherUserId: number): Promise<ChatConversation> {
    const existing = await this.conversationsRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participants', 'p')
      .where('p.userId IN (:...ids)', { ids: [userId, otherUserId] })
      .groupBy('c.id')
      .having('COUNT(DISTINCT p.userId) = 2')
      .getOne();

    if (existing) return existing;

    const conversation = await this.conversationsRepo.save(this.conversationsRepo.create({}));
    await this.participantsRepo.save([
      this.participantsRepo.create({ conversationId: conversation.id, userId, unreadCount: 0 }),
      this.participantsRepo.create({ conversationId: conversation.id, userId: otherUserId, unreadCount: 0 }),
    ]);
    return conversation;
  }

  async getConversationsForUser(userId: number) {
    return this.conversationsRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.participants', 'p')
      .leftJoinAndSelect('c.messages', 'm')
      .where('p.userId = :userId', { userId })
      .loadRelationCountAndMap('c.unreadCount', 'c.messages', 'um', qb => qb.where('um.isRead = false'))
      .orderBy('m.createdAt', 'DESC')
      .getMany();
  }

  async getMessagesForConversation(conversationId: number) {
    return this.messagesRepo.find({ where: { conversationId }, order: { createdAt: 'ASC' } });
  }

  async sendMessage(conversationId: number, senderId: number, content: string, type: 'text' | 'image' | 'file' = 'text') {
    const message = await this.messagesRepo.save(this.messagesRepo.create({ conversationId, senderId, content, type }));
    await this.participantsRepo.createQueryBuilder()
      .update(ChatParticipant)
      .set({ unreadCount: () => 'unreadCount + 1' })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('userId != :senderId', { senderId })
      .execute();
    return message;
  }
}


