import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { createTestDataSource } from "src/config/db.config";
import { AdministratorService } from "src/services/administrator.service";
import { DataSource } from "typeorm";
import { AppModule } from "src/app.module";
import { TestDBInitiator } from "../config.e2e";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Administrator } from "src/entities/administrator.entity";

describe("AdminController (e2e)", () => {
    let app: INestApplication;
    let administratorService: AdministratorService;
    let dataSource: DataSource;
    let databaseConfig: TestDBInitiator;

    beforeAll(async () => {
        databaseConfig = new TestDBInitiator();
        dataSource = await createTestDataSource(databaseConfig.dbOptions);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRootAsync({
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        const isTesting =
                            configService.get("NODE_ENV") === "test";
                        console.log("isTesting", isTesting);
                        console.log("NODE_ENV", configService.get("NODE_ENV"));
                        console.log(
                            "after tests start",
                            configService.get("DATABASE_URL"),
                        );

                        return {
                            type: "postgres",
                            host: "0.0.0.0",
                            port: 5432,
                            username: "postgres",
                            password: "postgres",
                            database: isTesting
                                ? "blueprint-sql"
                                : "blueprint-sql-test",
                            synchronize: true,
                            logging: false,
                            entities: [Administrator],
                            migrations: [],
                            subscribers: [],
                        };
                    },
                }),
                AppModule,
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
