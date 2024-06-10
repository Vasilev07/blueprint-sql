import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { ProductDTO } from "../models/product-dto";
import { Product } from "../entities/product.entity";

@Injectable()
export class ProductService {
    private productRepository: Repository<Product>;

    constructor(
        entityManager: EntityManager,
        @InjectMapper() private mapper: Mapper,
    ) {
        this.productRepository = entityManager.getRepository(Product);
    }

    async createProduct(product: ProductDTO): Promise<ProductDTO> {
        try {
            const productToSave = this.mapper.map(product, ProductDTO, Product);

            const productFromDB =
                await this.productRepository.save(productToSave);

            return this.mapper.map(productFromDB, Product, ProductDTO);
        } catch (e) {
            throw new Error("Product failed to save!");
        }
    }

    async getProducts(): Promise<ProductDTO[]> {
        try {
            const products: Product[] = await this.productRepository.find();
            return products.map((product) =>
                this.mapper.map(product, Product, ProductDTO),
            );
        } catch (e) {
            throw new Error("Error fetching products");
        }
    }
}
