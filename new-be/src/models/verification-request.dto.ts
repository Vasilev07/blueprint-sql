import { ApiPropertyOptional } from "@nestjs/swagger";
import { VerificationStatus } from "../enums/verification-status.enum";
import { UserDTO } from "./user.dto";

export class VerificationRequestDTO {
    @ApiPropertyOptional()
    id?: number;

    @ApiPropertyOptional()
    userId?: number;

    @ApiPropertyOptional()
    user?: UserDTO;

    @ApiPropertyOptional()
    verificationPhoto?: string;

    @ApiPropertyOptional({ enum: VerificationStatus })
    status?: VerificationStatus;

    @ApiPropertyOptional()
    rejectionReason?: string;

    @ApiPropertyOptional()
    reviewedBy?: number;

    @ApiPropertyOptional()
    reviewedAt?: Date;

    @ApiPropertyOptional()
    createdAt?: Date;

    @ApiPropertyOptional()
    updatedAt?: Date;
}
