import { Component, OnDestroy, OnInit } from "@angular/core";
import { ProductDTO, OrderDTO, ContactInformationDTO, AddressDTO } from "../../typescript-api-client/src/model/models";
import { HttpClient } from "@angular/common/http";
import { Subject, takeUntil } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { LayoutService } from "../layout/service/app.layout.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { OrderService } from "../../typescript-api-client/src/api/api";

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
    public orderForm: FormGroup<{
        contactInformation: FormGroup;
        addressInformation: FormGroup;
    }> = this.fb.group({
        contactInformation: this.fb.group({
            firstName: ["Georgi", Validators.required],
            lastName: ["Vasilev", Validators.required],
            email: ["gvas@gmail.com", Validators.required],
            phone: ["0885865090", Validators.required],
        }),
        addressInformation: this.fb.group({
            country: ["Bulgaria", Validators.required],
            city: ["Sofia", Validators.required],
            postCode: ["1000", Validators.required],
            address: ["jk.Drujbai", Validators.required],
        }),
    });

    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private readonly http: HttpClient,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        public layoutService: LayoutService,
        private readonly fb: FormBuilder,
        private readonly orderService: OrderService,
    ) {}

    ngOnInit(): void {
        this.http
            .get<OrderDTO[]>("http://localhost:3000/order")
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((orders: OrderDTO[]) => {
                this.orders = orders;
                // this.cartProducts = orders[0]!.products ?? [];
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    openNew() {
        this.order = undefined;
        this.visible = true;
        this.orderDialog = true;
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
        this.orderDialog = false;
    }

    saveOrder() {
        this.isEdit ? this.updateOrder() : this.createOrder();
    }

    editOrder(order: any) {
        console.log(order);
    }

    private createOrder() {
        console.log(this.orderForm.getRawValue());
        const formData = this.orderForm.getRawValue();

        const order: OrderDTO = {
            id: undefined,
            contactInformation:
                formData.contactInformation as ContactInformationDTO,
            address: formData.addressInformation as AddressDTO,
            status: "pending",
            total: 420,
            products: [],
        };

        this.orderService
            .createOrder(order)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(console.log);
    }

    private updateOrder() {}
}
