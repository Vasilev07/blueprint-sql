import { Injectable } from "@nestjs/common";
import { CategoryDTO } from "../models/category-dto";
import { Mapper } from "@automapper/core";
import { InjectMapper } from "@automapper/nestjs";
import { Category } from "@entities/category.entity";
import { EntityManager, Repository } from "typeorm";

@Injectable()
export class CategoryService {
    private categoryRepository: Repository<Category>;

    constructor(
        entityManager: EntityManager,
        @InjectMapper() private mapper: Mapper,
    ) {
        this.categoryRepository = entityManager.getRepository(Category);
    }

    async getCategories(): Promise<CategoryDTO[]> {
        const categories = await this.categoryRepository.find();

        return this.mapper.mapArray(categories, Category, CategoryDTO);
    }

    async createCategory(category: CategoryDTO): Promise<CategoryDTO> {
        try {
            const categoryToSave = this.mapper.map(
                category,
                CategoryDTO,
                Category,
            );

            const savedCategory =
                await this.categoryRepository.save(categoryToSave);

            return this.mapper.map(savedCategory, Category, CategoryDTO);
        } catch (e) {
            throw new Error("Error creating category");
        }
    }

    async updateCategory(category: CategoryDTO): Promise<CategoryDTO> {
        // TODO that should be transactional
        // Maybe locking is also a good idea
        try {
            await this.categoryRepository.update(category.id, category);

            const updatedCategory = await this.categoryRepository.findOneBy({
                id: category.id,
            });

            return this.mapper.map(updatedCategory, Category, CategoryDTO);
        } catch (e) {
            throw new Error("Error updating category");
        }
    }
}
