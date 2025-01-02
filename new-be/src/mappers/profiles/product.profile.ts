import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, forMember, mapFrom, Mapper } from "@automapper/core";
import { Product } from "../../entities/product.entity";
import { ProductDTO } from "../../models/product-dto";

@Injectable()
export class ProductProfile extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper) => {
            createMap(
                mapper,
                Product,
                ProductDTO,
                forMember(
                    (dest) => dest.images,
                    mapFrom((source) =>
                        source.images.map((image) => {
                            try {
                                return {
                                    id: image.id,
                                    name: image.name,
                                    data: Buffer.from(image.data).toString(
                                        "base64",
                                    ),
                                };
                            } catch (error) {
                                console.log(error);
                                return undefined;
                            }
                        }),
                    ),
                ),
            );
            createMap(mapper, ProductDTO, Product);
        };
    }
}
