import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus } from "src/entities/order.entity";
import { ProductDTO } from "./product.dto";
import { AddressDTO } from "./address.dto";
import { ContactInformationDTO } from "./contact-information.dto";

export class OrderDTO {
    @ApiPropertyOptional()
    id?: number;

    @ApiProperty()
    status: OrderStatus;

    @ApiProperty()
    total: number;

    @ApiProperty()
    address: AddressDTO;

    @ApiProperty()
    contactInformation: ContactInformationDTO;

    @ApiProperty({ type: [ProductDTO] })
    products: ProductDTO[];
}
