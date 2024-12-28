import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { ProductDTO } from "../models/product-dto";
import { Product } from "@entities/product.entity";

@Injectable()
export class ProductService {
    private productRepository: Repository<Product>;

    constructor(
        entityManager: EntityManager,
        @InjectMapper() private mapper: Mapper,
    ) {
        this.productRepository = entityManager.getRepository(Product);
    }

    async getProducts(): Promise<ProductDTO[]> {
        try {
            const products: Product[] = await this.productRepository.find();
            return products.map((product: Product) =>
                this.mapper.map(product, Product, ProductDTO),
            );
        } catch (e) {
            throw new Error("Error fetching products");
        }
    }

    async createProduct(product: ProductDTO): Promise<ProductDTO> {
        try {
            console.log(product);
            const productToSave: Product = this.mapper.map(
                product,
                ProductDTO,
                Product,
            );

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
            await this.productRepository.update(productDTO.id, productDTO);

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
