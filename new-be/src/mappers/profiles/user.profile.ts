import { createMap, forMember, mapFrom, Mapper } from "@automapper/core";
import { UserDTO } from "../../models/user-d-t-o";
import { User } from "../../entities/user.entity";
import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";

@Injectable()
export class UserProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper) => {
            createMap(
                mapper,
                User,
                UserDTO,
                forMember(
                    (dto: UserDTO) => dto.fullName,
                    mapFrom(
                        (entity: User): string =>
                            entity.firstname + " " + entity.lastname,
                    ),
                ),
                forMember(
                    (dto: UserDTO) => dto.confirmPassword,
                    mapFrom((entity: User) => entity.password),
                ),
            );
        };
    }
}
