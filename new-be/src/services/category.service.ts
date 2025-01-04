import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Category } from "@entities/category.entity";
import { EntityManager, Repository } from "typeorm";
import { CategoryDTO } from "../models/category.dto";
import { CategoryMapper } from "@mappers/implementations/category.mapper";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class CategoryService implements OnModuleInit {
    private categoryRepository: Repository<Category>;
    private categoryMapper: CategoryMapper;

    constructor(
        private readonly entityManager: EntityManager,
        @Inject(MapperService) private readonly mapperService: MapperService,
    ) {}

    public onModuleInit(): any {
        this.categoryRepository = this.entityManager.getRepository(Category);
        this.categoryMapper = this.mapperService.getMapper("Category");
    }

    async getCategories(): Promise<CategoryDTO[]> {
        const categories = await this.categoryRepository.find();

        return categories.map((category) => {
            return this.categoryMapper.entityToDTO(category);
        });
    }

    async createCategory(category: CategoryDTO): Promise<CategoryDTO> {
        try {
            const categoryToSave = this.categoryMapper.dtoToEntity(category);

            const savedCategory =
                await this.categoryRepository.save(categoryToSave);

            return this.categoryMapper.entityToDTO(savedCategory);
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

            return this.categoryMapper.entityToDTO(updatedCategory);
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
