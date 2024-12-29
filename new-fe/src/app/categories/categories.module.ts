import { NgModule } from "@angular/core";
import { CategoriesComponent } from "./categories.component";
import { Button, ButtonModule } from "primeng/button";
import { ConfirmationService, PrimeTemplate } from "primeng/api";
import { Ripple } from "primeng/ripple";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule } from "primeng/paginator";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { ChartModule } from "primeng/chart";
import { MenuModule } from "primeng/menu";
import { StyleClassModule } from "primeng/styleclass";
import { PanelMenuModule } from "primeng/panelmenu";
import { FileUploadModule } from "primeng/fileupload";
import { RatingModule } from "primeng/rating";
import { TagModule } from "primeng/tag";
import { CategoriesRoutingModule } from "./categories-routing.module";

@NgModule({
    imports: [
        Button,
        PrimeTemplate,
        CurrencyPipe,
        PaginatorModule,
        TableModule,
        CommonModule,
        FormsModule,
        ChartModule,
        MenuModule,
        StyleClassModule,
        PanelMenuModule,
        ButtonModule,
        CategoriesRoutingModule,
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
    ],
    declarations: [CategoriesComponent],
    providers: [ConfirmationService],
})
export class CategoriesModule {}
