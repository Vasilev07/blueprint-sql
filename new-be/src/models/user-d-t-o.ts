import { ApiProperty } from "@nestjs/swagger";
import { AutoMap } from "@automapper/classes";

export class UserDTO {
    @ApiProperty()
    @AutoMap()
    email: string;

    @ApiProperty()
    @AutoMap()
    password: string;

    @ApiProperty()
    @AutoMap()
    fullName: string;

    @ApiProperty()
    @AutoMap()
    confirmPassword: string;
}
