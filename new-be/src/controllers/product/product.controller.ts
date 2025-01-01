import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    SerializeOptions,
    UploadedFiles,
    UseInterceptors,
} from "@nestjs/common";
import { ProductDTO } from "../../models/product-dto";
import { ProductService } from "@services/product.service";
import { JsonToDtoInterceptor } from "../../interceptors/json-to-objects.interceptor";
import { FilesInterceptor } from "@nestjs/platform-express";

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
                    type: "string",
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
    @UseInterceptors(
        FilesInterceptor("files"),
        new JsonToDtoInterceptor(ProductDTO, ["data"]),
    )
    @SerializeOptions({ type: ProductDTO })
    async createProduct(
        @Body("data") productDTO: ProductDTO,
        @UploadedFiles() files: Array<Express.Multer.File>,
    ): Promise<ProductDTO> {
        console.log(files, "files");
        console.log(productDTO, "productDTO");
        console.log(typeof productDTO, "productDTO");
        try {
            return await this.productService.createProduct(productDTO, files);
        } catch (error) {
            throw new Error("Error creating product" + error);
        }
    }

    // @Post("/upload")
    // @ApiConsumes("multipart/form-data")
    // @UseInterceptors(FileInterceptor("file"))
    // @ApiBody({
    //     required: true,
    //     type: "multipart/form-data",
    //     schema: {
    //         type: "object",
    //         properties: {
    //             file: {
    //                 type: "string",
    //                 format: "binary",
    //             },
    //         },
    //     },
    // })
    // async uploadFile(
    //     @UploadedFile()
    //     file: Express.Multer.File,
    // ): Promise<void> {
    //     console.log(file, "file");
    //     return await Promise.resolve();
    // }

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
