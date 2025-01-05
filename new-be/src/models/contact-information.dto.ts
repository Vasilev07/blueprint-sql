import { ApiProperty } from "@nestjs/swagger";

export class ContactInformationDTO {
    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    phone: string;
}
