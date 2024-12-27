import { NgModule } from "@angular/core";
import { ProductCategoriesComponent } from "./product-categories.component";
import { Button } from "primeng/button";
import { PrimeTemplate } from "primeng/api";
import { Ripple } from "primeng/ripple";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { CurrencyPipe } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule } from "primeng/paginator";
import { ReactiveFormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";

@NgModule({
    imports: [
        Button,
        PrimeTemplate,
        Ripple,
        ToastModule,
        ToolbarModule,
        ConfirmDialogModule,
        CurrencyPipe,
        DialogModule,
        InputTextModule,
        PaginatorModule,
        ReactiveFormsModule,
        TableModule,
    ],
    declarations: [ProductCategoriesComponent],
    providers: [],
})
export class ProductCategoriesModule {}
