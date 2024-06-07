import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, Mapper } from "@automapper/core";
import { Product } from "../../entities/product.entity";
import { ProductDTO } from "../../models/product-dto";

@Injectable()
export class ProductProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper) => {
            createMap(mapper, Product, ProductDTO);
            createMap(mapper, ProductDTO, Product);
        };
    }
}
