import { ApiProperty } from "@nestjs/swagger";

export class AdministratorDTO {
    @ApiProperty()
    email: string;

    @ApiProperty()
    password: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty()
    confirmPassword: string;
}
