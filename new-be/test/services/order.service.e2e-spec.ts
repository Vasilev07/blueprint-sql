import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppModule } from "src/app.module";
import { DbModule } from "src/config/db.module";
import { Order, OrderStatus } from "src/entities/order.entity";
import { Product } from "src/entities/product.entity";
import { OrderDTO } from "src/models/order-dto";
import { ProductDTO } from "src/models/product-dto";
import { OrderService } from "src/services/order.service";

describe("Order Service (e2e)", () => {
    let app: INestApplication;
    let orderService: OrderService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule,
                DbModule,
                TypeOrmModule.forFeature([Order, Product]),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        orderService = moduleFixture.get<OrderService>(OrderService);

        await app.init();
    }, 10000);

    test("should save order and corresponding entities", async () => {
        const product: ProductDTO = {
            id: undefined,
            weight: 10,
            name: "Product 1",
            price: 100,
        };
        const orderToSave: OrderDTO = {
            id: undefined,
            status: OrderStatus.PENDING,
            total: 100,
            products: [product],
        };

        const orderFromDB = await orderService.createOrder(orderToSave);

        expect(orderFromDB).toBeDefined();
        expect(orderFromDB.id).toBeDefined();
        expect(orderFromDB.status).toBe(OrderStatus.PENDING);
        expect(orderFromDB.total).toBe(100);
        expect(orderFromDB.products).toBeDefined();
        expect(orderFromDB.products.length).toBe(1);
        expect(orderFromDB.products[0].id).toBeDefined();
        expect(orderFromDB.products[0].name).toBe("Product 1");
        expect(orderFromDB.products[0].weight).toBe(10);
        expect(orderFromDB.products[0].price).toBe(100);
    });
});
