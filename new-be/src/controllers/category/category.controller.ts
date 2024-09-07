import { Controller, Post } from "@nestjs/common";
import { CategoryService } from "@services/category.service";
import { ApiTags } from "@nestjs/swagger";

@Controller("/category")
@ApiTags("Category")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    async createCategory() {
        return await this.categoryService.createCategory();
    }
}
