import { BaseMapper } from "@mappers/base.mapper";
import { User } from "@entities/user.entity";
import { UserDTO } from "../../models/user.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserMapper implements BaseMapper<User, UserDTO> {
    entityToDTO(entity: User): UserDTO {
        if (!entity) {
            return null as any;
        }
        return {
            id: entity.id,
            email: entity.email,
            fullName:
                `${entity.firstname || ""} ${entity.lastname || ""}`.trim(),
            password: "", // Don't send actual password
            confirmPassword: "", // Don't send actual password
            gender: entity.gender,
            city: entity.profile?.city || null,
            lastOnline: entity.lastOnline,
            profilePictureId: entity.profile?.profilePictureId || null,
        };
    }
    dtoToEntity(dto: UserDTO): User {
        console.log(dto);
        throw new Error("Method not implemented.");
    }
}
