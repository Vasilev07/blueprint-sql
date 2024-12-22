import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductService } from "../../src/services/product.service";
import { DataSource } from "typeorm";
import { AppModule } from "../../src/app.module";
import { Order } from "../../src/entities/order.entity";
import { Product } from "../../src/entities/product.entity";

describe("Order Service (e2e)", () => {
    let app: INestApplication;
    let productService: ProductService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, TypeOrmModule.forFeature([Order, Product])],
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

        const dto = await productService.createProduct(productToSave);

        expect(dto).toBeDefined();
        expect(dto.id).toBeDefined();
        expect(dto.name).toBe(productToSave.name);
        expect(dto.price).toBe(productToSave.price);
        expect(dto.weight).toBe(productToSave.weight);
    });

    test("should get all products", async () => {
        const productToSave1 = {
            id: undefined,
            name: "Product 1",
            price: 100,
            weight: 10,
        };
        const productToSave2 = {
            id: undefined,
            name: "Product 2",
            price: 88,
            weight: 1,
        };

        const dto1 = await productService.createProduct(productToSave1);
        const dto2 = await productService.createProduct(productToSave2);

        const products = await productService.getProducts();

        expect(products).toBeDefined();
        expect(products.length).toBe(2);
        expect(products[0].name).toEqual(dto1.name);
        expect(products[1].name).toEqual(dto2.name);
        expect(products[0].id).toBeDefined();
        expect(products[1].id).toBeDefined();
    });

    test("should update product", async () => {
        const productToSave1 = {
            id: undefined,
            name: "Product 1",
            price: 100,
            weight: 10,
        };
        const savedProduct = await productService.createProduct(productToSave1);

        expect(savedProduct).toBeDefined();
        expect(savedProduct.name).toBe("Product 1");
        expect(savedProduct.price).toBe(100);
        expect(savedProduct.weight).toBe(10);

        const productToUpdate = {
            id: savedProduct.id,
            name: "Product 1 Updated",
            price: 200,
            weight: 20,
        };
        const updatedProduct =
            await productService.updateProduct(productToUpdate);

        expect(updatedProduct).toBeDefined();
        expect(updatedProduct.id).toBe(savedProduct.id);
        expect(updatedProduct.name).toBe("Product 1 Updated");
        expect(updatedProduct.price).toBe("200.00");
        expect(updatedProduct.weight).toBe("20.00");
    });
});
