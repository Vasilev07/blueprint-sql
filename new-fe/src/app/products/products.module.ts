import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ChartModule } from "primeng/chart";
import { MenuModule } from "primeng/menu";
import { StyleClassModule } from "primeng/styleclass";
import { PanelMenuModule } from "primeng/panelmenu";
import { ButtonModule } from "primeng/button";
import { ProductsComponent } from "./products.component";
import { ProductsRoutingModule } from "./products-routing.module";
import { TableModule } from "primeng/table";
import { PaginatorModule } from "primeng/paginator";
import { CommonModule } from "@angular/common";
import { FileUploadModule } from "primeng/fileupload";
import { RatingModule } from "primeng/rating";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { Ripple } from "primeng/ripple";
import { ConfirmationService } from "primeng/api";
import { DividerModule } from "primeng/divider";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ChartModule,
        MenuModule,
        TableModule,
        StyleClassModule,
        PanelMenuModule,
        ButtonModule,
        PaginatorModule,
        ProductsRoutingModule,
        FileUploadModule,
        RatingModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextModule,
        Ripple,
        ReactiveFormsModule,
        DividerModule,
    ],
    declarations: [ProductsComponent],
    providers: [ConfirmationService],
})
export class ProductsModule {}
