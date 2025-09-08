import { Injectable, OnModuleInit, Inject } from "@nestjs/common";
import { MessageDTO, CreateMessageDTO } from "../models/message.dto";
import { EntityManager } from "typeorm";
import { Message } from "@entities/message.entity";
import { MessageMapper } from "@mappers/implementations/message.mapper";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class MessageService implements OnModuleInit {
    private messageMapper: MessageMapper;

    constructor(
        private entityManager: EntityManager,
        @Inject(MapperService) private readonly mapperService: MapperService,
    ) {}

    public onModuleInit(): void {
        this.messageMapper = this.mapperService.getMapper("Message");
    }

    async create(createMessageDTO: CreateMessageDTO): Promise<MessageDTO> {
        const message = this.messageMapper.dtoToEntity(createMessageDTO as MessageDTO);
        const savedMessage = await this.entityManager.save(message);
        return this.messageMapper.entityToDTO(savedMessage);
    }

    async findAllByUserId(userId: number): Promise<MessageDTO[]> {
        const messages = await this.entityManager.find(Message, {
            where: { userId, isDeleted: false },
            order: { createdAt: 'DESC' }
        });
        return messages.map(message => this.messageMapper.entityToDTO(message));
    }

    async findInboxByUserId(userId: number): Promise<MessageDTO[]> {
        const messages = await this.entityManager.find(Message, {
            where: { userId, isDeleted: false, isArchived: false },
            order: { createdAt: 'DESC' }
        });
        return messages.map(message => this.messageMapper.entityToDTO(message));
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
