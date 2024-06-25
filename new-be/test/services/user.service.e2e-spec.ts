import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppModule } from "src/app.module";
import { DbModule } from "src/config/db.module";
import { User } from "src/entities/user.entity";
import { UserService } from "src/services/user.service";

describe("Admin Service (e2e)", () => {
    let app: INestApplication;
    let administratorService: UserService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, DbModule, TypeOrmModule.forFeature([User])],
        }).compile();

        app = moduleFixture.createNestApplication();
        administratorService = moduleFixture.get<UserService>(UserService);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    }, 10000);

    test("register", async () => {
        const administratorDTO = {
            fullName: "Georgi Vasilev",
            email: "georgevasile11v007@gmail.com",
            password: "123456",
            confirmPassword: "123456",
        };
        await administratorService.register(administratorDTO);

        const allAdministrators = await administratorService.getAll();

        expect(allAdministrators.length).toBe(1);
        expect(allAdministrators[0].email).toBe(administratorDTO.email);
    });
});