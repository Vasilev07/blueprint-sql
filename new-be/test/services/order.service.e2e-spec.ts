import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppModule } from "src/app.module";
import { Order, OrderStatus } from "src/entities/order.entity";
import { Product } from "src/entities/product.entity";
import { OrderDTO } from "src/models/order-dto";
import { ProductDTO } from "src/models/product-dto";
import { OrderService } from "src/services/order.service";
import { ProductService } from "../../src/services/product.service";
import dataSource from "../../src/config/data-source";

describe("Order Service (e2e)", () => {
    let app: INestApplication;
    let orderService: OrderService;
    let productService: ProductService;

    beforeAll(async () => {
        await dataSource.initialize();
        await dataSource.runMigrations();
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, TypeOrmModule.forFeature([Order, Product])],
        }).compile();

        app = moduleFixture.createNestApplication();
        orderService = moduleFixture.get<OrderService>(OrderService);
        productService = moduleFixture.get<ProductService>(ProductService);

        await app.init();
    }, 10000);

    afterAll(async () => {
        await dataSource.destroy();
    });

    afterEach(async () => {
        try {
            try {
                await dataSource.manager.delete(Order, {});
                await dataSource.manager.delete(Product, {});
            } catch (e) {
                console.error(e);
            }
        } catch (e) {
            console.error(e);
        }
    });

    test("should save order", async () => {
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
            created_at: new Date(),
            updated_at: new Date(),
        };

        const orderFromDB: OrderDTO =
            await orderService.createOrder(orderToSave);

        const productsFromDb: ProductDTO[] = await productService.getProducts();

        expect(orderFromDB).toBeDefined();
        expect(orderFromDB.id).toBeDefined();
        expect(orderFromDB.status).toBe(OrderStatus.PENDING);
        expect(orderFromDB.total).toBe(100);
        expect(orderFromDB.products).toBeDefined();
        expect(orderFromDB.products.length).toBe(1);
        expect(productsFromDb.length).toBe(0);
    });

    test("should get orders", async () => {
        const product: ProductDTO = {
            id: 1,
            weight: 10,
            name: "Product 1",
            price: 100,
        };
        const orderToSave: OrderDTO = {
            id: undefined,
            status: OrderStatus.PENDING,
            total: 100,
            products: [product],
            created_at: new Date(),
            updated_at: new Date(),
        };
        await productService.createProduct(product);
        await orderService.createOrder(orderToSave);

        const orders: OrderDTO[] = await orderService.getOrdersWithProducts();

        expect(orders).toBeDefined();
        expect(orders.length).toBe(1);
        expect(orders[0].id).toBeDefined();
        expect(orders[0].status).toBe(OrderStatus.PENDING);
        expect(orders[0].total).toBe(100);
        expect(orders[0].products).toBeDefined();
        expect(orders[0].products.length).toBe(1);
        expect(orders[0].products[0].id).toBeDefined();
        expect(orders[0].products[0].name).toBe("Product 1");
        expect(orders[0].products[0].weight).toBe("10.00");
        expect(orders[0].products[0].price).toBe("100.00");
    });
});
