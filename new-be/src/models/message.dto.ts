import { ApiProperty } from "@nestjs/swagger";

export class MessageDTO {
    @ApiProperty()
    id?: number;

    @ApiProperty()
    subject: string;

    @ApiProperty()
    content: string;

    @ApiProperty()
    from: string;

    @ApiProperty({ type: [String] })
    to: string[];

    @ApiProperty({ type: [String], required: false })
    cc?: string[];

    @ApiProperty({ type: [String], required: false })
    bcc?: string[];

    @ApiProperty({ type: [String], required: false })
    attachments?: string[];

    @ApiProperty()
    userId: number;

    @ApiProperty()
    createdAt?: Date;

    @ApiProperty()
    updatedAt?: Date;
}

export class CreateMessageDTO {
    @ApiProperty()
    subject: string;

    @ApiProperty()
    content: string;

    @ApiProperty()
    from: string;

    @ApiProperty({ type: [String] })
    to: string[];

    @ApiProperty({ type: [String], required: false })
    cc?: string[];

    @ApiProperty({ type: [String], required: false })
    bcc?: string[];

    @ApiProperty({ type: [String], required: false })
    attachments?: string[];

    @ApiProperty()
    userId: number;
}
