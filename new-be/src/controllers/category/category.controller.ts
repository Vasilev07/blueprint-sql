import { Controller } from "@nestjs/common";
import { CategoryService } from "@services/category.service";

@Controller("categories")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    // Add your controller methods here
}
