import {
    addProfile,
    CamelCaseNamingConvention,
    createMap,
    createMapper,
    namingConventions,
} from "@automapper/core";
import { classes } from "@automapper/classes";
import { Administrator } from "../entities/administrator.entity";
import { AdministratorDTO } from "../models/administrator-dto";
import { AdministratorProfile } from "./profiles/administrator.profile";

export const mapper = createMapper({
    strategyInitializer: classes(),
});
createMap(
    mapper,
    Administrator,
    AdministratorDTO,
    namingConventions(new CamelCaseNamingConvention()),
);

addProfile(mapper, AdministratorProfile);
