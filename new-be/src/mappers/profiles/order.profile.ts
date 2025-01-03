import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, forMember, Mapper, mapWith } from "@automapper/core";
import { Order } from "../../entities/order.entity";
import { OrderDTO } from "../../models/order.dto";
import { ProductDTO } from "../../models/product.dto";
import { Product } from "../../entities/product.entity";

@Injectable()
export class OrderProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper) => {
            createMap(
                mapper,
                Order,
                OrderDTO,
                forMember(
                    (destination) => destination.products,
                    mapWith(ProductDTO, Product, (source) => source.products),
                ),
            );
            createMap(
                mapper,
                OrderDTO,
                Order,
                forMember(
                    (destination) => destination.products,
                    mapWith(Product, ProductDTO, (source) => source.products),
                ),
            );
        };
    }
}
