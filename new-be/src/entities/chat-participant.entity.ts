import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn } from 'typeorm';
import { ChatConversation } from './chat-conversation.entity';
import { User } from './user.entity';

@Entity()
export class ChatParticipant {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ChatConversation, (c) => c.participants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: ChatConversation;

    @Column('int')
    conversationId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column('int')
    userId: number;

    @Column('int', { default: 0 })
    unreadCount: number;

    @CreateDateColumn()
    joinedAt: Date;
}


