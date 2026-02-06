import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "../../src/services/user.service";
import { AppModule } from "../../src/app.module";
import { User } from "../../src/entities/user.entity";

describe("Admin Service (e2e)", () => {
    let app: INestApplication;
    let userService: UserService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, TypeOrmModule.forFeature([User])],
        }).compile();

        app = moduleFixture.createNestApplication();
        userService = moduleFixture.get<UserService>(UserService);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    }, 10000);

    test("register", async () => {
        const userDto = {
            fullName: "Georgi Vasilev",
            email: "georgevasile11v007@gmail.com",
            password: "123456",
            confirmPassword: "123456",
        };
        await userService.register(userDto);

        const allUsers = await userService.getAll();

        expect(allUsers.users.length).toBeGreaterThanOrEqual(1);
        const registered = allUsers.users.find((u) => u.email === userDto.email);
        expect(registered).toBeDefined();
        expect(registered!.email).toBe(userDto.email);
    });
});
