import {
    addProfile,
    CamelCaseNamingConvention,
    createMap,
    createMapper,
    namingConventions,
} from "@automapper/core";
import { classes } from "@automapper/classes";
import { Administrator } from "../entities/administrator.entity";
import { AdministratorProfile } from "./profiles/administrator.profile";

export const mapper = createMapper({
    strategyInitializer: classes(),
});
createMap(
    mapper,
    Administrator,
    namingConventions(new CamelCaseNamingConvention()),
);

addProfile(mapper, AdministratorProfile);
