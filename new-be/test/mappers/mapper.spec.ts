import { Administrator } from "../../src/entities/user.entity";
import { UserDTO } from "../../src/models/user-d-t-o";
import { mapper } from "../../src/mappers/mapper";
import {
    addProfile,
    CamelCaseNamingConvention,
    createMap,
    namingConventions,
} from "@automapper/core";
import { AdministratorProfile } from "../../src/mappers/profiles/administrator.profile";

describe("Mapper", () => {
    beforeAll(() => {
        createMap(
            mapper,
            Administrator,
            UserDTO,
            namingConventions(new CamelCaseNamingConvention()),
        );

        addProfile(mapper, AdministratorProfile);
    });
    it("should map Administrator to AdministratorDTO", () => {
        const admin: Administrator = new Administrator();
        admin.firstname = "Cesare";
        admin.lastname = "Paciotti";
        admin.email = "gdimov@gmail.com";
        admin.password = "password";

        const adminDto: UserDTO = mapper.map(admin, Administrator, UserDTO);

        expect(adminDto.fullName).toBe("Cesare Paciotti");
        expect(adminDto.email).toBe("gdimov@gmail.com");
        expect(adminDto.confirmPassword).toBe("password");
    });
});
