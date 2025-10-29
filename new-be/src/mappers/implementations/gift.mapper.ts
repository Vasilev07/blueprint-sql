import { Injectable } from "@nestjs/common";
import { Gift } from "@entities/gift.entity";
import { GiftDTO } from "../../models/gift.dto";
import { BaseMapper } from "@mappers/base.mapper";

@Injectable()
export class GiftMapper implements BaseMapper<Gift, GiftDTO> {
    public entityToDTO(entity: Gift): GiftDTO {
        if (!entity) {
            return undefined;
        }
        return {
            id: entity.id,
            senderId: entity.senderId,
            receiverId: entity.receiverId,
            giftImageName: entity.giftImageName,
            amount: entity.amount,
            message: entity.message,
            transactionId: entity.transactionId,
            createdAt: entity.createdAt,
            sender: entity.sender
                ? {
                      id: entity.sender.id,
                      firstname: entity.sender.firstname,
                      lastname: entity.sender.lastname,
                      email: entity.sender.email,
                  }
                : undefined,
            receiver: entity.receiver
                ? {
                      id: entity.receiver.id,
                      firstname: entity.receiver.firstname,
                      lastname: entity.receiver.lastname,
                      email: entity.receiver.email,
                  }
                : undefined,
        };
    }

    public dtoToEntity(dto: GiftDTO): Gift {
        if (!dto) {
            return undefined;
        }
        const gift = new Gift();
        gift.id = dto.id;
        gift.senderId = dto.senderId;
        gift.receiverId = dto.receiverId;
        gift.giftImageName = dto.giftImageName;
        gift.amount = dto.amount;
        gift.message = dto.message;
        gift.transactionId = dto.transactionId;
        gift.createdAt = dto.createdAt;
        return gift;
    }
}

