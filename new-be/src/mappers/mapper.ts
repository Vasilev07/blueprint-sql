import { addProfile, createMapper, Mapper } from "@automapper/core";
import { classes } from "@automapper/classes";
import { AdministratorProfile } from "./profiles/administrator.profile"; //TODO think of way to make it a class that is injectable and register the profiles from the profile files

//TODO think of way to make it a class that is injectable and register the profiles from the profile files
export const mapper: Mapper = createMapper({
    strategyInitializer: classes(),
});

addProfile(mapper, AdministratorProfile);
