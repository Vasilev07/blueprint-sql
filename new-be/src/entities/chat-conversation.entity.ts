import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from "typeorm";
import { ChatParticipant } from "@entities/chat-participant.entity";
import { ChatMessage } from "@entities/chat-message.entity";

@Entity()
export class ChatConversation {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => ChatParticipant, (p) => p.conversation)
    participants: ChatParticipant[];

    @OneToMany(() => ChatMessage, (m) => m.conversation)
    messages: ChatMessage[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
