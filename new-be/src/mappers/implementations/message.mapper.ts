import { BaseMapper } from "@mappers/base.mapper";
import { Message } from "@entities/message.entity";
import { MessageDTO } from "../../models/message.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MessageMapper implements BaseMapper<Message, MessageDTO> {
    entityToDTO(entity: Message): MessageDTO {
        return {
            id: entity.id,
            subject: entity.subject,
            content: entity.content,
            from: entity.from,
            to: entity.to,
            cc: entity.cc,
            bcc: entity.bcc,
            attachments: entity.attachments,
            userId: entity.userId,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    dtoToEntity(dto: MessageDTO): Message {
        const message = new Message();
        message.subject = dto.subject;
        message.content = dto.content;
        message.from = dto.from;
        message.to = dto.to;
        message.cc = dto.cc;
        message.bcc = dto.bcc;
        message.attachments = dto.attachments;
        message.userId = dto.userId;
        return message;
    }
}
