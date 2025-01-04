import { Injectable } from "@nestjs/common";
import { Order } from "@entities/order.entity";
import { OrderDTO } from "../../models/order.dto";
import { BaseMapper } from "@mappers/base.mapper";

@Injectable()
export class OrderMapper implements BaseMapper<Order, OrderDTO> {
    public entityToDTO(entity: Order): OrderDTO {
        return {
            id: entity.id,
            status: entity.status,
            total: entity.total,
            products: [],
        };
    }

    public dtoToEntity(dto: OrderDTO): Order {
        return {
            id: dto.id,
            status: dto.status,
            total: dto.total,
            products: [],
        };
    }
}
