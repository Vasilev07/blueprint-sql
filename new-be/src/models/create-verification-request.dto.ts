import { ApiProperty } from "@nestjs/swagger";

export class CreateVerificationRequestDTO {
    @ApiProperty()
    verificationPhoto: string;
}
