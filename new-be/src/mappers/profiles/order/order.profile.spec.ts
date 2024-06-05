import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { OrderProfile } from "./order.profile";
import { AppModule } from "../../../app.module";
import { DbModule } from "../../../config/db.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "../../../entities/order.entity";

describe("AppController", () => {
    let app: INestApplication;
    let orderProfile;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, DbModule, TypeOrmModule.forFeature([Order])],
            controllers: [],
            providers: [],
        }).compile();

        app = moduleFixture.createNestApplication();
        orderProfile = moduleFixture.get<OrderProfile>(OrderProfile);

        await app.init();
    });

    describe("root", () => {
        it('should return "Hello World!"', () => {
            expect(orderProfile).toBeDefined();
        });
    });
});
