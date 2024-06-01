import {
    addProfile,
    CamelCaseNamingConvention,
    createMap,
    namingConventions,
} from "@automapper/core";
import { mapper } from "../mapper";
import { Administrator } from "../../entities/administrator.entity";
import { AdministratorDTO } from "../../models/administrator-dto";
import { AdministratorProfile } from "../profiles/administrator.profile";

createMap(
    mapper,
    Administrator,
    AdministratorDTO,
    namingConventions(new CamelCaseNamingConvention()),
);

addProfile(mapper, AdministratorProfile);
