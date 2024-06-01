import { Administrator } from "../../src/entities/administrator.entity";
import { AdministratorDTO } from "../../src/models/administrator-dto";
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
            AdministratorDTO,
            namingConventions(new CamelCaseNamingConvention()),
        );

        addProfile(mapper, AdministratorProfile);
    });
    it("should map Administrator to AdministratorDTO", () => {
        const admin: Administrator = new Administrator();
        admin.firstname = "John";
        admin.lastname = "Doe";
        admin.email = "gdimov@gmail.com";
        admin.password = "password";

        const adminDto: AdministratorDTO = mapper.map(
            admin,
            Administrator,
            AdministratorDTO,
        );

        // expect(adminDto.fullName).toBe("John Doe");
        expect(adminDto.email).toBe("gdimov@gmail.com");
        expect(adminDto.confirmPassword).toBe("password");
    });
});
