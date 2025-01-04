import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import { InjectMapper } from "@automapper/nestjs";
import { beforeMap, Mapper, mapWith } from "@automapper/core";
import { ProductDTO } from "../models/product.dto";
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

            const productImages = await this.buildProductImages(files);
            console.log(productImages, "filesToSave");

            productToSave.images = productImages;

            const productFromDB: Product =
                await this.productRepository.save(productToSave);
            console.log(productFromDB, "productFromDB");
            return this.mapper.map(productFromDB, Product, ProductDTO);
        } catch (e) {
            throw new Error("Product failed to save!");
        }
    }

    async updateProduct(
        productDTO: ProductDTO,
        files: Array<Express.Multer.File>,
    ) {
        // TODO that should be transactional
        // Maybe locking is also a good idea
        try {
            const productToSave = this.mapper.map(
                productDTO,
                ProductDTO,
                Product,
                // mapWith()
                // {
                //     beforeMap: (s, d) => {
                //         console.log(s, "source");
                //         console.log(d, "destination");
                //     },
                // },
            );

            const productImages = await this.buildProductImages(files);
            console.log(productImages, "filesToSave");
            console.log(productToSave, "productToSave");

            productToSave.images = productImages;
            // TODO FIX
            const product = await this.productRepository.save(productToSave);

            return this.mapper.map(product, Product, ProductDTO);
        } catch (error) {
            throw new Error("Error updating product" + error);
        }
    }

    private async buildProductImages(
        files: Array<Express.Multer.File>,
    ): Promise<ProductImage[]> {
        return await Promise.all(
            files.map(async (file) => {
                const currentImage = new ProductImage();

                currentImage.name = file.filename;

                try {
                    currentImage.data = await fs.readFile(file.path);
                } catch (error) {
                    console.log(error, "error");
                }

                return currentImage;
            }),
        );
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
