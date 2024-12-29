import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UploadedFiles,
    UseInterceptors,
} from "@nestjs/common";
import { ProductDTO } from "../../models/product-dto";
import { ProductService } from "@services/product.service";
import { FileInterceptor } from "@nestjs/platform-express";

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
    @ApiConsumes("multipart/form-data")
    // TODO Think of a way to make it more dynamic -> it is not working without it ...
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                data: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string" || undefined,
                        },
                        name: {
                            type: "string",
                        },
                        description: {
                            type: "number",
                        },
                        parent: {
                            type: undefined,
                        },
                        children: {
                            type: undefined,
                        },
                    },
                },
                files: {
                    type: "array",
                    items: {
                        type: "string",
                        format: "binary",
                    },
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor("files"))
    async createProduct(
        @Body() productDTO: ProductDTO,
        @UploadedFiles() files: Array<Express.Multer.File>,
    ): Promise<ProductDTO> {
        console.log(files, "files");
        try {
            return await this.productService.createProduct(productDTO);
        } catch (error) {
            throw new Error("Error creating product" + error);
        }
    }

    @Put(":id")
    async updateProduct(
        @Param("id") id: string,
        @Body() productDTO: ProductDTO,
    ): Promise<ProductDTO> {
        try {
            return await this.productService.updateProduct(productDTO);
        } catch (error) {
            throw new Error("Error updating product" + error);
        }
    }

    @Delete(":id")
    async deleteProduct(@Param("id") id: string) {
        try {
            return await this.productService.deleteProduct(id);
        } catch (error) {
            throw new Error("Error deleting product" + error);
        }
    }
}
