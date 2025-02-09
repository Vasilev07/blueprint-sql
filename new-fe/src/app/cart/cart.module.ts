import { NgModule } from "@angular/core";
import { CartComponent } from "./cart.component";
import { CartRoutingModule } from "./cart-routing.module";
import { CardModule } from "primeng/card";
import { NgForOf } from "@angular/common";

@NgModule({
    imports: [
        CartRoutingModule,
        CardModule,
        NgForOf,
        CardModule,
    ],
    declarations: [CartComponent],
})
export class CartModule {
}
