import { Component, OnDestroy, OnInit } from "@angular/core";
import { ProductDTO } from "../../typescript-api-client/src/models/productDTO";
import { HttpClient } from "@angular/common/http";
import { Subject, takeUntil } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { LayoutService } from "../layout/service/app.layout.service";
import { OrderDTO } from "../../typescript-api-client/src/models/orderDTO";

@Component({
    templateUrl: "./orders.component.html",
})
export class OrdersComponent implements OnInit, OnDestroy {
    public selectedOrders: any;
    public orders!: OrderDTO[];
    public orderDialog!: boolean;
    public isEdit!: boolean;
    public visible!: boolean;
    public order?: OrderDTO;

    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private readonly http: HttpClient,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        public layoutService: LayoutService,
    ) {
    }

    ngOnInit(): void {
        this.http
            .get<OrderDTO[]>("http://localhost:3000/order")
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((orders: OrderDTO[]) => {
                this.orders = orders;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    openNew() {
        this.order = undefined;
        this.visible = true;
    }

    deleteSelectedProducts() {
        this.confirmationService.confirm({
            message: "Are you sure you want to delete the selected orders?",
            header: "Confirm",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.orders = this.orders.filter(
                    (val) => !this.selectedOrders?.includes(val),
                );
                this.selectedOrders = [];
                this.messageService.add({
                    severity: "success",
                    summary: "Successful",
                    detail: "Products Deleted",
                    life: 3000,
                });
            },
        });
    }

    deleteOrder(product: ProductDTO) {
        this.confirmationService.confirm({
            message: "Are you sure you want to delete " + product.name + "?",
            header: "Confirm",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.orders = this.orders.filter(
                    (val) => val.id !== product.id,
                );
                this.messageService.add({
                    severity: "success",
                    summary: "Successful",
                    detail: "Product Deleted",
                    life: 3000,
                });
            },
        });
    }

    hideDialog() {
        this.isEdit = false;
        this.visible = false;
    }

    saveOrder() {
        this.isEdit ? this.updateOrder() : this.createOrder();
    }

    editOrder(order: any) {
        console.log(order);
    }

    private createOrder() {

    }

    private updateOrder() {

    }
}
