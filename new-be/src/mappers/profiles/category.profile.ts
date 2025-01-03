import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, Mapper } from "@automapper/core";
import { Category } from "../../entities/category.entity";
import { CategoryDto } from "../../models/category.dto";

@Injectable()
export class CategoryProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper) => {
            createMap(mapper, Category, CategoryDto);
            createMap(mapper, CategoryDto, Category);
        };
    }
}
