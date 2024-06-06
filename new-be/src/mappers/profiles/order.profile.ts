import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, Mapper } from "@automapper/core";
import { Order } from "../../entities/order.entity";
import { OrderDTO } from "../../models/order-dto";

@Injectable()
export class OrderProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper) => {
            createMap(mapper, Order, OrderDTO);
            createMap(mapper, OrderDTO, Order);
        };
    }
}
