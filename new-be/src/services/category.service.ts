import { Injectable } from "@nestjs/common";
import { CategoryDto } from "../models/category.dto";
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

    async getCategories(): Promise<CategoryDto[]> {
        const categories = await this.categoryRepository.find();

        return this.mapper.mapArray(categories, Category, CategoryDto);
    }

    async createCategory(category: CategoryDto): Promise<CategoryDto> {
        try {
            const categoryToSave = this.mapper.map(
                category,
                CategoryDto,
                Category,
            );

            const savedCategory =
                await this.categoryRepository.save(categoryToSave);

            return this.mapper.map(savedCategory, Category, CategoryDto);
        } catch (e) {
            throw new Error("Error creating category");
        }
    }

    async updateCategory(category: CategoryDto): Promise<CategoryDto> {
        // TODO that should be transactional
        // Maybe locking is also a good idea
        try {
            await this.categoryRepository.update(category.id, category);

            const updatedCategory = await this.categoryRepository.findOneBy({
                id: category.id,
            });

            return this.mapper.map(updatedCategory, Category, CategoryDto);
        } catch (e) {
            throw new Error("Error updating category");
        }
    }

    async deleteCategory(id: string): Promise<void> {
        try {
            await this.categoryRepository.delete(id);
        } catch (e) {
            throw new Error("Error deleting category");
        }
    }
}
