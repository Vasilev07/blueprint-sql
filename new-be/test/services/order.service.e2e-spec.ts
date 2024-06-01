import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppModule } from "src/app.module";
import { DbModule } from "src/config/db.module";
import { Order } from "src/entities/order.entity";
import { OrderService } from "src/services/order.service";

describe("Name of the group", () => {
    let app: INestApplication;
    let orderService: OrderService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, DbModule, TypeOrmModule.forFeature([Order])],
        }).compile();

        app = moduleFixture.createNestApplication();
        orderService = moduleFixture.get<OrderService>(OrderService);

        await app.init();
    });

    test("should save order and corresponding entities", () => {
        orderService.createOrder({});
    });
});
