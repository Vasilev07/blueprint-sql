import { createMap, forMember, mapFrom, Mapper } from "@automapper/core";
import { AdministratorDTO } from "../../models/administrator-dto";
import { Administrator } from "../../entities/administrator.entity";
import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";

@Injectable()
export class AdministratorProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper) => {
            createMap(
                mapper,
                Administrator,
                AdministratorDTO,
                forMember(
                    (dto: AdministratorDTO) => dto.fullName,
                    mapFrom(
                        (entity: Administrator): string =>
                            entity.firstname + " " + entity.lastname,
                    ),
                ),
                forMember(
                    (dto: AdministratorDTO) => dto.confirmPassword,
                    mapFrom((entity: Administrator) => entity.password),
                ),
            );
        };
    }
}
