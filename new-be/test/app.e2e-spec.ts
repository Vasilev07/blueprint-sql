import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "src/app.module";
import { DataSource } from "typeorm";
import { TestDBInitiator } from "./config.e2e";
import { createTestDataSource } from "src/config/db.config";

describe("AppController (e2e)", () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let databaseConfig: TestDBInitiator;

    beforeEach(async () => {
        databaseConfig = new TestDBInitiator();
        dataSource = await createTestDataSource(databaseConfig.dbOptions);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await databaseConfig.dropDatabase();
        await dataSource.destroy();
        await app.close();
    }, 10000);

    it("/ (GET)", () => {
        return request(app.getHttpServer())
            .get("/")
            .expect(200)
            .expect("Hello World!");
    });
});
