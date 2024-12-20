import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { ProductDTO } from "../models/product-dto";
import { Product } from "@entities/product.entity";
import { CategoryType } from "../enums/categories.enum";

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

    async getProductsByCategoryType(
        categoryType: CategoryType,
    ): Promise<ProductDTO[]> {
        categoryType;
        try {
            const products: Product[] = await this.productRepository.find({
                // where: { category: { type: categoryType } },
                relations: ["category"],
            });
            return products.map((product: Product) =>
                this.mapper.map(product, Product, ProductDTO),
            );
        } catch (e) {
            throw new Error("Error fetching products by category type");
        }
    }
}
