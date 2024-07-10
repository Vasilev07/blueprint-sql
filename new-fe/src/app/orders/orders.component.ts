import { Component, OnDestroy, OnInit, WritableSignal } from "@angular/core";
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

    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private readonly http: HttpClient,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        public layoutService: LayoutService,
    ) {}

    ngOnInit(): void {
        this.http
            .get<OrderDTO[]>("http://localhost:3000/orders")
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((orders: OrderDTO[]) => {
                this.orders = orders;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    openNew() {}

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

    hideDialog() {}

    saveProduct() {
        // this.submitted = true;
        //
        // if (this.product?.name?.trim()) {
        //     if (this.product.id) {
        //         this.orders[this.findIndexById(this.product.id)] = this.product;
        //         this.messageService.add({
        //             severity: "success",
        //             summary: "Successful",
        //             detail: "Product Updated",
        //             life: 3000,
        //         });
        //     } else {
        //         this.orders.push(this.product);
        //         this.messageService.add({
        //             severity: "success",
        //             summary: "Successful",
        //             detail: "Product Created",
        //             life: 3000,
        //         });
        //     }
        //
        //     this.orders = [...this.orders];
        //     this.productDialog = false;
        //     this.product = undefined;
        // }
    }

    findIndexById(id: number): number {
        let index = -1;
        for (let i = 0; i < this.orders.length; i++) {
            if (this.orders[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    editOrder(order: any) {
        console.log(order);
    }
}
