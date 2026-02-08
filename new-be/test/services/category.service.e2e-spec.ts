import { INestApplication } from "@nestjs/common";
import { CategoryService } from "../../src/services/category.service";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "../../src/entities/category.entity";
import { DataSource } from "typeorm";

describe("Category Service (e2e)", () => {
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

    afterAll(async () => {
        await app.close();
    }, 10000);

    afterEach(async () => {
        const ds = app.get(DataSource);
        await ds.createQueryBuilder().delete().from(Category).execute();
    });

    test("should create new category", async () => {
        const categoryToSave = {
            id: undefined,
            name: "Category 1",
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

    test("should fetch all categories", async () => {
        const categoryToSave1 = {
            id: undefined,
            name: "Category 1",
            description: "Some test descriptive description 1",
            parent: undefined,
            children: undefined,
        };
        const categoryToSave2 = {
            id: undefined,
            name: "Category 2",
            description: "Some test descriptive description 2",
            parent: undefined,
            children: undefined,
        };
        const categoryToSave3 = {
            id: undefined,
            name: "Category 3",
            description: "Some test descriptive description 3",
            parent: undefined,
            children: undefined,
        };

        const dto1 = await categoryService.createCategory(categoryToSave1);
        const dto2 = await categoryService.createCategory(categoryToSave2);
        const dto3 = await categoryService.createCategory(categoryToSave3);

        const categories = await categoryService.getCategories();

        expect(categories).toBeDefined();
        expect(categories.length).toBe(3);
        expect(categories[0].id).toBeDefined();
        expect(categories[1].id).toBeDefined();
        expect(categories[2].id).toBeDefined();
        expect(categories[0].name).toBe(dto1.name);
        expect(categories[1].name).toBe(dto2.name);
        expect(categories[2].name).toBe(dto3.name);
    });

    test("should update category", async () => {
        const categoryToSave = {
            id: undefined,
            name: "Category 1",
            description: "Some test descriptive description 1",
            parent: undefined,
            children: undefined,
        };

        const dto1 = await categoryService.createCategory(categoryToSave);

        const categoryToUpdate = {
            id: dto1.id,
            name: "Category 1 Updated",
            description: "Some test descriptive description 1 Updated",
            parent: undefined,
            children: undefined,
        };

        const updatedCategory =
            await categoryService.updateCategory(categoryToUpdate);

        expect(updatedCategory).toBeDefined();
        expect(updatedCategory.id).toBe(dto1.id);
        expect(updatedCategory.name).toBe("Category 1 Updated");
        expect(updatedCategory.description).toBe(
            "Some test descriptive description 1 Updated",
        );
    });

    test("should delete category", async () => {
        const categoryToSave1 = {
            id: undefined,
            name: "Category 1",
            description: "Some test descriptive description 1",
            parent: undefined,
            children: undefined,
        };

        const savedCategory1 =
            await categoryService.createCategory(categoryToSave1);

        const categoryToSave2 = {
            id: undefined,
            name: "Category 2",
            description: "Some test descriptive description 1",
            parent: undefined,
            children: undefined,
        };

        const savedCategory2 =
            await categoryService.createCategory(categoryToSave2);

        const productsBeforeDelete = await categoryService.getCategories();

        expect(productsBeforeDelete).toBeDefined();
        expect(productsBeforeDelete.length).toBe(2);

        await categoryService.deleteCategory(savedCategory2.id.toString());

        const categoriesAfterDelete = await categoryService.getCategories();

        expect(categoriesAfterDelete).toBeDefined();
        expect(categoriesAfterDelete.length).toBe(1);
        expect(categoriesAfterDelete[0].id).toBe(savedCategory1.id);
    });
});
