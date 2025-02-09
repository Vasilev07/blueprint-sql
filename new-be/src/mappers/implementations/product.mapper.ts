import { BaseMapper } from "@mappers/base.mapper";
import { Product } from "@entities/product.entity";
import { ProductDTO } from "../../models/product.dto";
import { ProductImage } from "@entities/product-image.entity";
import { Inject, Injectable } from "@nestjs/common";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class ProductMapper implements BaseMapper<Product, ProductDTO> {
    public entityToDTO(entity: Product): ProductDTO {
        console.log("MAPPER");
        return {
            id: entity.id,
            name: entity.name,
            price: entity.price,
            weight: entity.weight,
            images:
                entity.images.length > 0
                    ? entity.images.map((image: ProductImage) => {
                          return {
                              id: image.id,
                              name: image.name,
                              data: Buffer.from(image.data).toString("base64"),
                          };
                      })
                    : [],
        };
    }

    public dtoToEntity(dto: ProductDTO): Product {
        console.log("DTO TO ENTITY", dto);
        return {
            id: dto.id,
            name: dto.name,
            price: dto.price,
            weight: dto.weight,
            images: [],
        };
    }
}
