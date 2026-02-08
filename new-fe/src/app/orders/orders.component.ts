import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { Subject, takeUntil } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { LayoutService } from "../layout/service/app.layout.service";
import { OrderService } from "../../typescript-api-client/src/api/api";
import {
    OrderDTO,
    ContactInformationDTO,
    AddressDTO,
} from "../../typescript-api-client/src/model/models";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { FileUploadModule } from "primeng/fileupload";
import { TagModule } from "primeng/tag";
import { ChartModule } from "primeng/chart";
import { CardModule } from "primeng/card";
import { DividerModule } from "primeng/divider";
import { ConfirmDialogModule } from "primeng/confirmdialog";

@Component({
    templateUrl: "./orders.component.html",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        ToastModule,
        ToolbarModule,
        FileUploadModule,
        TagModule,
        ChartModule,
        CardModule,
        DividerModule,
        ConfirmDialogModule,
    ],
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

    ngOnInit(): void {}

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

    deleteOrder(order: OrderDTO) {
        this.confirmationService.confirm({
            message: "Are you sure you want to delete this order?",
            header: "Confirm",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.orders = this.orders.filter((val) => val.id !== order.id);
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
        if (this.isEdit) {
            this.updateOrder();
        } else {
            this.createOrder();
        }
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
