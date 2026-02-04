import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import { ProductDTO } from "../models/product.dto";
import { Product } from "@entities/product.entity";
import { ProductImage } from "@entities/product-image.entity";
import { promises as fs } from "fs";
import { MapperService } from "@mappers/mapper.service";
import { ProductMapper } from "@mappers/implementations/product.mapper";

@Injectable()
export class ProductService implements OnModuleInit {
    private productRepository: Repository<Product>;
    private productImageRepository: Repository<ProductImage>;
    private productMapper: ProductMapper;

    constructor(
        private readonly entityManager: EntityManager,
        @Inject(MapperService) private readonly mapperService: MapperService,
    ) { }

    public onModuleInit(): void {
        this.productRepository = this.entityManager.getRepository(Product);
        this.productImageRepository =
            this.entityManager.getRepository(ProductImage);
        this.productMapper = this.mapperService.getMapper("Product");
    }

    public async getProducts(): Promise<ProductDTO[]> {
        try {
            const products: Product[] = await this.productRepository.find({
                relations: { images: true },
            });

            console.log(products, "products");

            return products.map((product) => {
                return this.productMapper.entityToDTO(product);
            });
        } catch (e) {
            throw new Error("Error fetching products");
        }
    }

    public async createProduct(
        product: ProductDTO,
        files: Array<Express.Multer.File>,
    ): Promise<ProductDTO> {
        try {
            const productToSave = this.productMapper.dtoToEntity(product);

            console.log(productToSave, "productToSave");

            const productImages = await this.buildProductImages(files);
            console.log(productImages, "filesToSave");

            productToSave.images = productImages;

            const productFromDB: Product =
                await this.productRepository.save(productToSave);

            return this.productMapper.entityToDTO(productFromDB);
        } catch (e) {
            console.error(e);
            throw new Error("Product failed to save! " + (e as Error).message);
        }
    }

    public async updateProduct(
        productDTO: ProductDTO,
        files: Array<Express.Multer.File>,
    ) {
        // TODO that should be transactional
        // Maybe locking is also a good idea
        try {
            console.log(productDTO, "productDTO DTO DTO");
            const productToSave = this.productMapper.dtoToEntity(productDTO);

            console.log(productToSave, "productToSave");

            const productImages = await this.buildProductImages(files);
            console.log(productImages, "filesToSave");
            console.log(productToSave, "productToSave");

            productToSave.images = productImages;
            // TODO FIX
            const product = await this.productRepository.save(productToSave);

            return this.productMapper.entityToDTO(product);
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

    public async deleteProduct(id: string) {
        try {
            // TODO we do nothing with Orders referencing it
            await this.productRepository.delete(id);
        } catch (error) {
            throw new Error("Error deleting product" + error);
        }
    }
}
