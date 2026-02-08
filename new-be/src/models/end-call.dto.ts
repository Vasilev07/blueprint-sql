import { ApiProperty } from "@nestjs/swagger";

export class EndCallDTO {
    @ApiProperty({
        description: "Reason for ending the call",
        required: false,
    })
    endReason?: string;
}
