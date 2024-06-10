import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { ProductDTO } from "../models/product-dto";
import { Product } from "../entities/product.entity";

@Injectable()
export class ProductService {
    constructor(
        private entityManager: EntityManager,
        @InjectMapper() private mapper: Mapper,
    ) {}

    async createProduct(product: ProductDTO): Promise<ProductDTO> {
        try {
            const productToSave = this.mapper.map(product, ProductDTO, Product);

            const productFromDB = await this.entityManager.save(productToSave);

            return this.mapper.map(productFromDB, Product, ProductDTO);
        } catch (e) {
            throw new Error("Product failed to save!");
        }
    }
}
