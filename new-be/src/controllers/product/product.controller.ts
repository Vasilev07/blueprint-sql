import { ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Post } from "@nestjs/common";
import { ProductDTO } from "../../models/product-dto";
import { ProductService } from "@services/product.service";

@Controller("/product")
@ApiTags("Product")
export class ProductController {
    constructor(public productService: ProductService) {}

    @Get()
    async getAll() {
        try {
            return await this.productService.getProducts();
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }

    @Post("/create")
    async createProduct(@Body() productDTO: ProductDTO): Promise<ProductDTO> {
        try {
            console.log(productDTO, "productDTO");
            return await this.productService.createProduct(productDTO);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }
}
