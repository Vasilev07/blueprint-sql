import { ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Post, Put } from "@nestjs/common";
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
            throw new Error("Error getting products" + error);
        }
    }

    @Post("/create")
    async createProduct(@Body() productDTO: ProductDTO): Promise<ProductDTO> {
        try {
            console.log(productDTO, "productDTO");
            return await this.productService.createProduct(productDTO);
        } catch (error) {
            throw new Error("Error creating product" + error);
        }
    }

    @Put(":id")
    async updateProduct(@Body() productDTO: ProductDTO): Promise<ProductDTO> {
        try {
            return await this.productService.updateProduct(productDTO);
        } catch (error) {
            throw new Error("Error updating product" + error);
        }
    }
}
