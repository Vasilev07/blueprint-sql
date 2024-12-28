import { Body, Controller, Get, Post } from "@nestjs/common";
import { CategoryService } from "@services/category.service";
import { ApiTags } from "@nestjs/swagger";
import { CategoryDTO } from "../../models/category-dto";

@Controller("/category")
@ApiTags("Category")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get("")
    async getCategories() {
        return await this.categoryService.getCategories();
    }

    @Post("/create")
    async createCategory(@Body() category: CategoryDTO) {
        return await this.categoryService.createCategory(category);
    }
}
