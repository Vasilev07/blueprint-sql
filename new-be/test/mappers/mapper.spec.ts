import { UserDTO } from "../../src/models/user-d-t-o";
import { mapper } from "../../src/mappers/mapper";
import {
    addProfile,
    CamelCaseNamingConvention,
    createMap,
    namingConventions,
} from "@automapper/core";
import { User } from "../../src/entities/user.entity";

describe("Mapper", () => {
    beforeAll(() => {
        createMap(
            mapper,
            User,
            UserDTO,
            namingConventions(new CamelCaseNamingConvention()),
        );

        addProfile(mapper, User);
    });
    it("should map Administrator to AdministratorDTO", () => {
        const user: User = new User();
        user.firstname = "Cesare";
        user.lastname = "Paciotti";
        user.email = "gdimov@gmail.com";
        user.password = "password";

        const adminDto: UserDTO = mapper.map(user, User, UserDTO);

        expect(adminDto.fullName).toBe("Cesare Paciotti");
        expect(adminDto.email).toBe("gdimov@gmail.com");
        expect(adminDto.confirmPassword).toBe("password");
    });
});
