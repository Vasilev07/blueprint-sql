import { BaseMapper } from "@mappers/base.mapper";
import { User } from "@entities/user.entity";
import { UserDTO } from "../../models/user.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserMapper implements BaseMapper<User, UserDTO> {
    entityToDTO(entity: User): UserDTO {
        return {
            id: entity.id,
            email: entity.email,
            fullName: `${entity.firstname} ${entity.lastname}`,
            password: '',  // Don't send actual password
            confirmPassword: '',  // Don't send actual password
            gender: entity.gender,
            city: entity.city
        };
    }
    dtoToEntity(dto: UserDTO): User {
        console.log(dto);
        throw new Error("Method not implemented.");
    }
}
