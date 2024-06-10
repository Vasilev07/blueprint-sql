import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppModule } from "src/app.module";
import { DbModule } from "src/config/db.module";
import { Order } from "src/entities/order.entity";
import { Product } from "src/entities/product.entity";
import { ProductService } from "../../src/services/product.service";
import { DataSource } from "typeorm";

describe("Order Service (e2e)", () => {
    let app: INestApplication;
    let productService: ProductService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule,
                DbModule,
                TypeOrmModule.forFeature([Order, Product]),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        productService = moduleFixture.get<ProductService>(ProductService);

        await app.init();
    }, 10000);

    afterEach(async () => {
        const ds = app.get(DataSource);
        await ds.createQueryBuilder().delete().from(Product).execute();
    });

    test("should create new product", async () => {
        const productToSave = {
            id: undefined,
            name: "Product 1",
            price: 100,
            weight: 10,
        };

        const productFromDB = await productService.createProduct(productToSave);

        expect(productFromDB).toBeDefined();
        expect(productFromDB.id).toBeDefined();
        expect(productFromDB.name).toBe(productToSave.name);
        expect(productFromDB.price).toBe(productToSave.price);
        expect(productFromDB.weight).toBe(productToSave.weight);
    });
});
