import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, Mapper } from "@automapper/core";
import { Category } from "../../entities/category.entity";
import { CategoryDTO } from "../../models/category-dto";

@Injectable()
export class CategoryProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper) => {
            createMap(mapper, Category, CategoryDTO);
            createMap(mapper, CategoryDTO, Category);
        };
    }
}
