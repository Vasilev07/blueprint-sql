import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Order } from "@entities/order.entity";
import { OrderDTO } from "../../models/order.dto";
import { BaseMapper } from "@mappers/base.mapper";
import { ProductMapper } from "@mappers/implementations/product.mapper";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class OrderMapper implements BaseMapper<Order, OrderDTO>, OnModuleInit {
    private productMapper: ProductMapper;

    constructor(
        @Inject(MapperService) private readonly mappersService: MapperService,
    ) {}

    onModuleInit(): any {
        this.productMapper = this.mappersService.getMapper("Product");
        console.log("kuku");
    }

    public entityToDTO(entity: Order): OrderDTO {
        console.log("MAPPER");
        console.log(entity, "entity");

        return {
            id: entity.id,
            status: entity.status,
            total: entity.total,
            products:
                entity?.products?.map((product) =>
                    this.productMapper.entityToDTO(product),
                ) ?? [],
            address: { ...entity.address },
            contactInformation: { ...entity.contactInformation },
        };
    }

    public dtoToEntity(dto: OrderDTO): Order {
        return {
            id: dto.id,
            status: dto.status,
            total: dto.total,
            products:
                dto?.products?.map((product) =>
                    this.productMapper.dtoToEntity(product),
                ) ?? [],
            address: { ...dto.address },
            contactInformation: { ...dto.contactInformation },
        };
    }
}
