import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { ProductDTO } from "../models/product-dto";
import { Product } from "@entities/product.entity";
import { ProductImage } from "@entities/product-image.entity";
import { promises as fs } from "fs";

@Injectable()
export class ProductService {
    private productRepository: Repository<Product>;
    private productImageRepository: Repository<ProductImage>;

    constructor(
        entityManager: EntityManager,
        @InjectMapper() private mapper: Mapper,
    ) {
        this.productRepository = entityManager.getRepository(Product);
        this.productImageRepository = entityManager.getRepository(ProductImage);
    }

    async getProducts(): Promise<ProductDTO[]> {
        try {
            const products: Product[] = await this.productRepository.find({
                relations: { images: true },
            });
            return products.map((product: Product) =>
                this.mapper.map(product, Product, ProductDTO),
            );
        } catch (e) {
            throw new Error("Error fetching products");
        }
    }

    async createProduct(
        product: ProductDTO,
        files: Array<Express.Multer.File>,
    ): Promise<ProductDTO> {
        try {
            console.log(product);
            const productToSave: Product = this.mapper.map(
                product,
                ProductDTO,
                Product,
            );
            console.log(productToSave, "productToSave");

            const filesToSave = await Promise.all(
                files.map(async (file) => {
                    const currentImage = new ProductImage();

                    currentImage.name = file.filename;
                    // currentImage.product = productToSave;
                    console.log(file.buffer, "file.buffer");
                    console.log(file, "file");
                    console.log(file.path, "file.path");
                    console.log(__dirname, "__dirname");
                    try {
                        const fileData = await fs.readFile(file.path);
                        console.log(fileData, "fileData");
                        currentImage.data = fileData;
                    } catch (error) {
                        console.log(error, "error");
                    }
                    console.log(currentImage, "currentImage BEFORE SAVE");
                    try {
                        return await this.productImageRepository.save(
                            currentImage,
                        );
                    } catch (e) {
                        console.log(e, "e");
                    }
                }),
            );
            console.log(filesToSave, "filesToSave");

            productToSave.images = filesToSave;

            const productFromDB: Product =
                await this.productRepository.save(productToSave);
            console.log(productFromDB, "productFromDB");
            return this.mapper.map(productFromDB, Product, ProductDTO);
        } catch (e) {
            throw new Error("Product failed to save!");
        }
    }

    async updateProduct(productDTO: ProductDTO) {
        // TODO that should be transactional
        // Maybe locking is also a good idea
        try {
            // TODO FIX
            // await this.productRepository.update(productDTO.id, productDTO);

            const product = await this.productRepository.findOneBy({
                id: productDTO.id,
            });

            return this.mapper.map(product, Product, ProductDTO);
        } catch (error) {
            throw new Error("Error updating product" + error);
        }
    }

    async deleteProduct(id: string) {
        try {
            // TODO we do nothing with Orders referencing it
            await this.productRepository.delete(id);
        } catch (error) {
            throw new Error("Error deleting product" + error);
        }
    }
}
