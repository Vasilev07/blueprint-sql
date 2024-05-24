import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { createTestDataSource } from "src/config/db.config";
import { AdministratorService } from "src/services/administrator.service";
import { DataSource } from "typeorm";
import { TestDBInitiator } from "../config.e2e";
import { DbModule } from "src/config/db.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Administrator } from "src/entities/administrator.entity";

describe("AdminController (e2e)", () => {
    let app: INestApplication;
    let administratorService: AdministratorService;
    let dataSource: DataSource;
    let databaseConfig: TestDBInitiator;

    beforeAll(async () => {
        databaseConfig = new TestDBInitiator();
        console.log("db options in test", databaseConfig.dbOptions);

        dataSource = await createTestDataSource(databaseConfig.dbOptions);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule,
                DbModule,
                TypeOrmModule.forFeature([Administrator]),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        administratorService =
            moduleFixture.get<AdministratorService>(AdministratorService);

        await app.init();
    });

    afterAll(async () => {
        await databaseConfig.dropDatabase();
        await dataSource.destroy();
        await app.close();
    }, 10000);

    it.only("register", async () => {
        const administratorDTO = {
            fullName: "Georgi Vasilev",
            email: "georgevasile11v07@gmail.com",
            password: "123456",
            confirmPassword: "123456",
        };
        await administratorService.register(administratorDTO);

        const allAdministrators = await administratorService.getAll();

        expect(allAdministrators.length).toBe(1);
        expect(allAdministrators[0].email).toBe(administratorDTO.email);
    });
});
