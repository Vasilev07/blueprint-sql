import { createMap, forMember, mapFrom, Mapper } from "@automapper/core";
import { UserDto } from "../../models/user-dto";
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
                UserDto,
                forMember(
                    (dto: UserDto) => dto.fullName,
                    mapFrom(
                        (entity: User): string =>
                            entity.firstname + " " + entity.lastname,
                    ),
                ),
                forMember(
                    (dto: UserDto) => dto.confirmPassword,
                    mapFrom((entity: User) => entity.password),
                ),
            );
        };
    }
}
