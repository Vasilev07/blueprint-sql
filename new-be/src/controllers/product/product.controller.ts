import { Body, Controller, Get, Post } from "@nestjs/common";
import { ProductDTO } from "../../models/product-dto";
import { ProductService } from "../../services/product.service";
import { ApiTags } from "@nestjs/swagger";

@Controller("/products")
@ApiTags("User")
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Get("")
    async getProducts(): Promise<ProductDTO[]> {
        try {
            return await this.productService.getProducts();
        } catch (error) {
            throw new Error("Error getting products" + error);
        }
    }

    @Post("/create")
    async createOrder(@Body() productDTO: ProductDTO): Promise<ProductDTO> {
        try {
            return await this.productService.createProduct(productDTO);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }
}
