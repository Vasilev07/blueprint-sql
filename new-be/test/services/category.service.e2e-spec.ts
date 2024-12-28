import { INestApplication } from "@nestjs/common";
import { CategoryService } from "../../src/services/category.service";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "../../src/entities/category.entity";
import { DataSource } from "typeorm";
import { Product } from "../../src/entities/product.entity";

describe("Order Service (e2e)", () => {
    let app: INestApplication;
    let categoryService: CategoryService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, TypeOrmModule.forFeature([Category])],
        }).compile();

        app = moduleFixture.createNestApplication();
        categoryService = moduleFixture.get<CategoryService>(CategoryService);

        await app.init();
    }, 10000);

    afterEach(async () => {
        const ds = app.get(DataSource);
        await ds.createQueryBuilder().delete().from(Product).execute();
    });

    test("should create new category", async () => {
        const categoryToSave = {
            id: undefined,
            name: "Product 1",
            description: "Some test descriptive description",
            parent: undefined,
            children: undefined,
        };

        const dto = await categoryService.createCategory(categoryToSave);

        expect(dto).toBeDefined();
        expect(dto.id).toBeDefined();
        expect(dto.name).toBe(categoryToSave.name);
        expect(dto.parent).toBe(undefined);
        expect(dto.children).toBe(undefined);
    });
});
