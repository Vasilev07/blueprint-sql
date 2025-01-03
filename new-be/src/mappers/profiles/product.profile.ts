import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, forMember, mapFrom, Mapper } from "@automapper/core";
import { Product } from "../../entities/product.entity";
import { ProductDto } from "../../models/product.dto";
import { ProductImageDto } from "../../models/product-image.dto";
import { ProductImage } from "@entities/product-image.entity";

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
                ProductDto,
                forMember(
                    (dest) => dest.images,
                    mapFrom((source: Product) =>
                        source.images?.map(
                            (image: ProductImage): ProductImageDto => {
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
                            },
                        ),
                    ),
                ),
            );
            createMap(
                mapper,
                ProductDto,
                Product,
                // forMember((dest: Product) => dest.images, ignore()),
            );
        };
    }
}
