import {
    createMap,
    forMember,
    mapFrom,
    MappingProfile,
} from "@automapper/core";
import { AdministratorDTO } from "../../models/administrator-dto";
import { Administrator } from "../../entities/administrator.entity";

export const AdministratorProfile: MappingProfile = (mapper) => {
    createMap(
        mapper,
        Administrator,
        AdministratorDTO,
        forMember(
            (dto) => dto.fullName,
            mapFrom((entity) => entity.firstname + " " + entity.lastname),
        ),
        forMember(
            (dto: AdministratorDTO) => dto.confirmPassword,
            mapFrom((entity: Administrator) => entity.password),
        ),
    );
};
