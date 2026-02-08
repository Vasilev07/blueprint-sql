import { NgModule } from "@angular/core";
import { CartComponent } from "./cart.component";
import { CartRoutingModule } from "./cart-routing.module";
import { CardModule } from "primeng/card";
import { CurrencyPipe, NgForOf } from "@angular/common";
import { DividerModule } from "primeng/divider";
import { InputNumberModule } from "primeng/inputnumber";
import { FormsModule } from "@angular/forms";
import { ImageModule } from "primeng/image";

@NgModule({
    imports: [
        CartComponent,
        CartRoutingModule,
        CardModule,
        NgForOf,
        CardModule,
        DividerModule,
        InputNumberModule,
        FormsModule,
        ImageModule,
        CurrencyPipe,
    ],
    declarations: [],
})
export class CartModule {}
