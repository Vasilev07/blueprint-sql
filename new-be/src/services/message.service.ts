import { Injectable, OnModuleInit, Inject } from "@nestjs/common";
import { MessageDTO, CreateMessageDTO } from "../models/message.dto";
import { EntityManager } from "typeorm";
import { Message } from "@entities/message.entity";
import { User } from "@entities/user.entity";
import { MessageMapper } from "@mappers/implementations/message.mapper";
import { MapperService } from "@mappers/mapper.service";
import { MessageGateway } from "../gateways/message.gateway";

@Injectable()
export class MessageService implements OnModuleInit {
    private messageMapper: MessageMapper;

    constructor(
        private entityManager: EntityManager,
        @Inject(MapperService) private readonly mapperService: MapperService,
        private readonly messageGateway: MessageGateway,
    ) {}

    public onModuleInit(): void {
        this.messageMapper = this.mapperService.getMapper("Message");
    }

    async create(createMessageDTO: CreateMessageDTO): Promise<MessageDTO> {
        const message = this.messageMapper.dtoToEntity(createMessageDTO as MessageDTO);
        const savedMessage = await this.entityManager.save(message);
        const messageDto = this.messageMapper.entityToDTO(savedMessage);
        
        // Notify connected clients about the new message
        await this.messageGateway.notifyNewMessage(messageDto);
        
        return messageDto;
    }

    async findAllByUserId(userId: number): Promise<MessageDTO[]> {
        const messages = await this.entityManager.find(Message, {
            where: { userId, isDeleted: false },
            order: { createdAt: 'DESC' }
        });
        return messages.map(message => this.messageMapper.entityToDTO(message));
    }

    async findInboxByEmail(email: string): Promise<MessageDTO[]> {
        console.log('Searching for messages for email:', email);

        // First get all messages to see what we're working with
        const allMessages = await this.entityManager.find(Message);
        console.log('All messages in DB:', allMessages.map(m => ({
            id: m.id,
            to: m.to,
            from: m.from,
            cc: m.cc,
            isDeleted: m.isDeleted,
            isArchived: m.isArchived
        })));

        // Try a simpler query first to debug
        const messages = await this.entityManager
            .createQueryBuilder(Message, "message")
            .where("message.isDeleted = :isDeleted", { isDeleted: false })
            .andWhere("message.isArchived = :isArchived", { isArchived: false })
            .andWhere("(message.to = :email OR :email = ANY(string_to_array(message.cc, ',')))", { 
                email 
            })
            .orderBy("message.createdAt", "DESC")
            .getMany();

        console.log('Found messages:', messages.map(m => ({
            id: m.id,
            to: m.to,
            from: m.from,
            cc: m.cc,
            isDeleted: m.isDeleted,
            isArchived: m.isArchived
        })));

        return messages.map(message => this.messageMapper.entityToDTO(message));
    }

    async findMessagesByTab(email: string, tab: 'unread' | 'read' | 'vip'): Promise<MessageDTO[]> {
        console.log(`Searching for ${tab} messages for email:`, email);

        // First get all messages to debug what we're working with
        const allMessages = await this.entityManager.find(Message);
        console.log('All messages in DB:', allMessages.map(m => ({
            id: m.id,
            to: m.to,
            from: m.from,
            cc: m.cc,
            isRead: m.isRead,
            isDeleted: m.isDeleted,
            isArchived: m.isArchived
        })));

        // Use a simpler approach - get all messages and filter in memory for now
        // This is not optimal for large datasets but will work for debugging
        const allMessagesForUser = await this.entityManager
            .createQueryBuilder(Message, "message")
            .where("message.isDeleted = :isDeleted", { isDeleted: false })
            .andWhere("message.isArchived = :isArchived", { isArchived: false })
            .getMany();

        // Filter messages for the user
        const userMessages = allMessagesForUser.filter(message => {
            // Check if email is in the 'to' array
            const isInTo = Array.isArray(message.to) && message.to.includes(email);
            // Check if email is in the 'cc' array
            const isInCc = Array.isArray(message.cc) && message.cc.includes(email);
            return isInTo || isInCc;
        });

        console.log(`Found ${userMessages.length} messages for user ${email}:`, userMessages.map(m => ({
            id: m.id,
            to: m.to,
            from: m.from,
            cc: m.cc,
            isRead: m.isRead
        })));

        // Apply tab-specific filtering
        let filteredMessages = userMessages;
        switch (tab) {
            case 'unread':
                filteredMessages = userMessages.filter(m => !m.isRead);
                break;
            case 'read':
                filteredMessages = userMessages.filter(m => m.isRead);
                break;
            case 'vip':
                filteredMessages = userMessages.filter(m => m.from && m.from.toLowerCase().includes('vip'));
                break;
            default:
                throw new Error(`Invalid tab: ${tab}`);
        }

        console.log(`Found ${filteredMessages.length} ${tab} messages:`, filteredMessages.map(m => ({
            id: m.id,
            to: m.to,
            from: m.from,
            cc: m.cc,
            isRead: m.isRead
        })));

        return filteredMessages.map(message => this.messageMapper.entityToDTO(message));
    }

    async findById(id: number): Promise<MessageDTO | null> {
        const message = await this.entityManager.findOne(Message, {
            where: { id, isDeleted: false }
        });
        return message ? this.messageMapper.entityToDTO(message) : null;
    }

    async markAsRead(id: number): Promise<void> {
        await this.entityManager.update(Message, id, { isRead: true });
    }

    async archive(id: number): Promise<void> {
        await this.entityManager.update(Message, id, { isArchived: true });
    }

    async delete(id: number): Promise<void> {
        await this.entityManager.update(Message, id, { isDeleted: true });
    }

    async update(id: number, updateMessageDTO: Partial<MessageDTO>): Promise<MessageDTO> {
        await this.entityManager.update(Message, id, updateMessageDTO);
        const updatedMessage = await this.findById(id);
        if (!updatedMessage) {
            throw new Error("Message not found");
        }
        return updatedMessage;
    }
}
