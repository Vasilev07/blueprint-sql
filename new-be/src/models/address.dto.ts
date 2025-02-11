import { ApiProperty } from "@nestjs/swagger";

export class AddressDTO {
    @ApiProperty()
    country: string;

    @ApiProperty()
    city: string;

    @ApiProperty()
    postCode: string;

    @ApiProperty()
    address: string;
}
