import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
} from "@nestjs/common";
import { CategoryService } from "@services/category.service";
import { ApiTags } from "@nestjs/swagger";
import { CategoryDto } from "../../models/category.dto";

@Controller("/category")
@ApiTags("Category")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get("")
    async getCategories() {
        return await this.categoryService.getCategories();
    }

    @Post("/create")
    async createCategory(@Body() category: CategoryDto) {
        return await this.categoryService.createCategory(category);
    }

    @Put(":id")
    async updateCategory(
        @Param("id") id: string,
        @Body() category: CategoryDto,
    ): Promise<CategoryDto> {
        return await this.categoryService.updateCategory(category);
    }

    @Delete(":id")
    async deleteCategory(@Param("id") id: string) {
        try {
            return await this.categoryService.deleteCategory(id);
        } catch (error) {
            throw new Error("Error deleting category" + error);
        }
    }
}
