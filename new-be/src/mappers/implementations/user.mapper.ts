import { BaseMapper } from "@mappers/base.mapper";
import { User } from "@entities/user.entity";
import { UserDTO } from "../../models/user.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserMapper implements BaseMapper<User, UserDTO> {
    entityToDTO(entity: User): UserDTO {
        return {
            email: entity.email,
            fullName: `${entity.firstname} ${entity.lastname}`,
        } as any;
    }
    dtoToEntity(dto: UserDTO): User {
        console.log(dto);
        throw new Error("Method not implemented.");
    }
}
