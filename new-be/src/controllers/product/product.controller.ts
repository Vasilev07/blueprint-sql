import { ApiTags } from "@nestjs/swagger";
import { Controller, Get } from "@nestjs/common";

@Controller("/product")
@ApiTags("Product")
export class ProductController {
    constructor() {}

    @Get()
    async getAll() {
        return "Get all products";
    }
}
