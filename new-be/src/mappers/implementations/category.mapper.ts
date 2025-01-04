import { Injectable } from "@nestjs/common";
import { Category } from "@entities/category.entity";
import { CategoryDTO } from "../../models/category.dto";
import { BaseMapper } from "@mappers/base.mapper";

@Injectable()
export class CategoryMapper implements BaseMapper<Category, CategoryDTO> {
    public entityToDTO(entity: Category): CategoryDTO {
        if (!entity) {
            return null;
        }
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            parent: entity.parent ? this.entityToDTO(entity.parent) : null,
            children: entity.children
                ? entity.children.map((child) => this.entityToDTO(child))
                : [],
        };
    }

    public dtoToEntity(dto: CategoryDTO): Category {
        if (!dto) {
            return null;
        }

        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            parent: dto.parent ? this.dtoToEntity(dto.parent) : undefined,
            children: dto.children
                ? dto.children.map((child) => this.dtoToEntity(child))
                : [],
        };
    }
}
