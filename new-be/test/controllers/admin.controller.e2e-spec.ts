import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { createTestDataSource } from "src/config/db.config";
import { AdministratorService } from "src/services/administrator.service";
import { DataSource } from "typeorm";
import { AppModule } from "src/app.module";
import { TestDBInitiator } from "../config.e2e";

describe("AdminController (e2e)", () => {
    let app: INestApplication;
    let administratorService: AdministratorService;
    let dataSource: DataSource;
    let databaseConfig: TestDBInitiator;

    // let cryptoService: CryptoService;
    // let authMiddleware: AuthMiddleware;
    // let httpServer: any;

    beforeAll(async () => {
        databaseConfig = new TestDBInitiator();
        dataSource = await createTestDataSource(databaseConfig.dbOptions);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
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

    it("/ (GET)", async () => {
        const administratorDTO = {
            fullName: "Georgi Vasilev",
            email: "georgevasilev10117@gmail.com",
            password: "123456",
            confirmPassword: "123456",
        };
        await administratorService.register(administratorDTO);

        const allAdministrators = await administratorService.getAll();

        expect(allAdministrators.length).toBe(1);
        expect(allAdministrators[0].email).toBe(administratorDTO.email);
    });
});
