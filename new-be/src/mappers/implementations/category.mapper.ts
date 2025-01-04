import { Injectable } from "@nestjs/common";
import { Category } from "@entities/category.entity";
import { CategoryDTO } from "../../models/category.dto";
import { BaseMapper } from "@mappers/base.mapper";

@Injectable()
export class CategoryMapper implements BaseMapper<Category, CategoryDTO> {
    public entityToDTO(entity: Category): CategoryDTO {
        if (!entity) {
            return undefined;
        }
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            parent: entity.parent ? this.entityToDTO(entity.parent) : undefined,
            children: entity.children
                ? entity.children.map((child) => this.entityToDTO(child))
                : undefined,
        };
    }

    public dtoToEntity(dto: CategoryDTO): Category {
        if (!dto) {
            return undefined;
        }

        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            parent: dto.parent ? this.dtoToEntity(dto.parent) : undefined,
            children: dto.children
                ? dto.children.map((child) => this.dtoToEntity(child))
                : undefined,
        };
    }
}
