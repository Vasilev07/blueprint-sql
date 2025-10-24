import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { VerificationStatus } from "../enums/verification-status.enum";

export class VerificationRequestDTO {
    @ApiPropertyOptional()
    id?: number;

    @ApiPropertyOptional()
    userId?: number;

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

export class CreateVerificationRequestDTO {
    @ApiProperty()
    verificationPhoto: string;
}

export class ReviewVerificationRequestDTO {
    @ApiProperty({ enum: VerificationStatus })
    status: VerificationStatus;

    @ApiPropertyOptional()
    rejectionReason?: string;
}
