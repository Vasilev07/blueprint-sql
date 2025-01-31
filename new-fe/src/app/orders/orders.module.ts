import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ChartModule } from "primeng/chart";
import { MenuModule } from "primeng/menu";
import { StyleClassModule } from "primeng/styleclass";
import { PanelMenuModule } from "primeng/panelmenu";
import { ButtonModule } from "primeng/button";
import { OrdersComponent } from "./orders.component";
import { OrdersRoutingModule } from "./orders-routing.module";
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
import { ConfirmationService, MessageService } from "primeng/api";
import { InputTextModule } from "primeng/inputtext";
import { CardModule } from "primeng/card";

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
        OrdersRoutingModule,
        FileUploadModule,
        RatingModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextModule,
        ReactiveFormsModule,
        CardModule,
    ],
    declarations: [OrdersComponent],
    providers: [ConfirmationService, MessageService],
})
export class OrdersModule {}
