import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, forMember, Mapper, mapWith } from "@automapper/core";
import { Order } from "../../entities/order.entity";
import { OrderDto } from "../../models/order.dto";
import { ProductDto } from "../../models/product.dto";
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
                OrderDto,
                forMember(
                    (destination) => destination.products,
                    mapWith(ProductDto, Product, (source) => source.products),
                ),
            );
            createMap(
                mapper,
                OrderDto,
                Order,
                forMember(
                    (destination) => destination.products,
                    mapWith(Product, ProductDto, (source) => source.products),
                ),
            );
        };
    }
}
