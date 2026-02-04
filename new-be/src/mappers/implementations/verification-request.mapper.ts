import { BaseMapper } from "@mappers/base.mapper";
import { VerificationRequest } from "@entities/verification-request.entity";
import { VerificationRequestDTO } from "../../models/verification-request.dto";
import { Injectable } from "@nestjs/common";
import { UserMapper } from "./user.mapper";

@Injectable()
export class VerificationRequestMapper implements BaseMapper<VerificationRequest, VerificationRequestDTO> {
    constructor(private readonly userMapper: UserMapper) { }

    entityToDTO(entity: VerificationRequest): VerificationRequestDTO {
        return {
            id: entity.id,
            userId: entity.userId,
            user: entity.user ? this.userMapper.entityToDTO(entity.user) : undefined,
            verificationPhoto: entity.verificationPhoto,
            status: entity.status,
            rejectionReason: entity.rejectionReason,
            reviewedBy: entity.reviewedBy,
            reviewedAt: entity.reviewedAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    dtoToEntity(dto: VerificationRequestDTO): VerificationRequest {
        throw new Error("Method not implemented.");
    }
}
