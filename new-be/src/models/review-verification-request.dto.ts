import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { VerificationStatus } from "../enums/verification-status.enum";

export class ReviewVerificationRequestDTO {
    @ApiProperty({ enum: VerificationStatus })
    status: VerificationStatus;

    @ApiPropertyOptional()
    rejectionReason?: string;
}
