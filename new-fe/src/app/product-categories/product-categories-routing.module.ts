import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ProductCategoriesComponent } from "./product-categories.component";

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: "", component: ProductCategoriesComponent },
        ]),
    ],
    exports: [RouterModule],
})
export class ProductCategoriesRoutingModule {}
