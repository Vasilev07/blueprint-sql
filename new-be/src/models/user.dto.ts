import { ApiProperty } from "@nestjs/swagger";

export class UserDTO {
    @ApiProperty()
    id?: number;

    @ApiProperty()
    email: string;

    @ApiProperty()
    password: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty()
    confirmPassword: string;
}
