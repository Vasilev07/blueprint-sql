import { NgModule } from "@angular/core";
import { ProductsDropdownComponent } from "./products-dropdown.component";
import { OrderListModule } from "primeng/orderlist";
import { ToolbarModule } from "primeng/toolbar";

@NgModule({
    imports: [OrderListModule, ToolbarModule],
    declarations: [ProductsDropdownComponent],
})
export class ProductsDropdownModule {
}
