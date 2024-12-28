import { Body, Controller, Post } from "@nestjs/common";
import { CategoryService } from "@services/category.service";
import { ApiTags } from "@nestjs/swagger";
import { CategoryDTO } from "../../models/category-dto";

@Controller("/category")
@ApiTags("Category")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post("/create")
    async createCategory(@Body() category: CategoryDTO) {
        return await this.categoryService.createCategory(category);
    }
}
