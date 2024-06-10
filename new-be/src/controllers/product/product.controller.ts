import { Body, Controller, Post } from "@nestjs/common";
import { ProductDTO } from "../../models/product-dto";
import { ProductService } from "../../services/product.service";

@Controller("/product")
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post("/create")
    async createOrder(@Body() productDTO: ProductDTO): Promise<ProductDTO> {
        try {
            return await this.productService.createProduct(productDTO);
        } catch (error) {
            throw new Error("Error creating order" + error);
        }
    }
}