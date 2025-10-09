import { ApiProperty } from "@nestjs/swagger";
import { Gender } from "../enums/gender.enum";

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

    @ApiProperty({ enum: Gender, required: false })
    gender?: Gender;

    @ApiProperty({ required: false })
    city?: string;
}
