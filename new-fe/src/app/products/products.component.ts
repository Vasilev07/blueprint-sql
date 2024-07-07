import { Component, OnDestroy, OnInit } from "@angular/core";
import { ProductDTO } from "../../typescript-api-client/src/models/productDTO";
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { LayoutService } from "../layout/service/app.layout.service";

@Component({
    templateUrl: "./products.component.html",
    providers: [MessageService, ConfirmationService],
})
export class ProductsComponent implements OnInit, OnDestroy {
    product: ProductDTO | undefined = undefined;
    products: ProductDTO[] = [
        {
            id: 1,
            name: "Product 1",
            weight: 1,
            price: 10.99,
            order: {
                id: 1,
                status: "PENDING",
                total: 10.99,
                products: [],
            },
        },
        {
            id: 2,
            name: "Product 2",
            weight: 2,
            price: 20.99,
            order: {
                id: 2,
                status: "PENDING",
                total: 20.99,
                products: [],
            },
        },
        {
            id: 3,
            name: "Product 3",
            weight: 3,
            price: 30.99,
            order: {
                id: 3,
                status: "PENDING",
                total: 30.99,
                products: [],
            },
        },
        {
            id: 4,
            name: "Product 4",
            weight: 4,
            price: 40.99,
            order: {
                id: 4,
                status: "PENDING",
                total: 40.99,
                products: [],
            },
        },
        {
            id: 5,
            name: "Product 5",
            weight: 5,
            price: 50.99,
            order: {
                id: 5,
                status: "PENDING",
                total: 50.99,
                products: [],
            },
        },
    ];
    selectedProducts: ProductDTO[] = [];
    submitted: boolean = false;
    productDialog: boolean = false;
    statuses!: any[];
    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private readonly http: HttpClient,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        public layoutService: LayoutService,
    ) {}

    ngOnInit(): void {
        // this.http
        //     .get<ProductDTO[]>("http://localhost:3000/products")
        //     .pipe(takeUntil(this.ngUnsubscribe))
        //     .subscribe((products: ProductDTO[]) => {
        //         this.products = products;
        //     });

        this.statuses = [
            { label: "INSTOCK", value: "instock" },
            { label: "LOWSTOCK", value: "lowstock" },
            { label: "OUTOFSTOCK", value: "outofstock" },
        ];
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    openNew() {
        this.product = undefined;
        this.submitted = false;
        this.productDialog = true;
    }

    deleteSelectedProducts() {
        this.confirmationService.confirm({
            message: "Are you sure you want to delete the selected products?",
            header: "Confirm",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.products = this.products.filter(
                    (val) => !this.selectedProducts?.includes(val),
                );
                this.selectedProducts = [];
                this.messageService.add({
                    severity: "success",
                    summary: "Successful",
                    detail: "Products Deleted",
                    life: 3000,
                });
            },
        });
    }

    editProduct(product: ProductDTO) {
        this.product = { ...product };
        this.productDialog = true;
    }

    deleteProduct(product: ProductDTO) {
        this.confirmationService.confirm({
            message: "Are you sure you want to delete " + product.name + "?",
            header: "Confirm",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.products = this.products.filter(
                    (val) => val.id !== product.id,
                );
                this.product = undefined;
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
        this.productDialog = false;
        this.submitted = false;
    }

    saveProduct() {
        this.submitted = true;

        if (this.product?.name?.trim()) {
            if (this.product.id) {
                this.products[this.findIndexById(this.product.id)] =
                    this.product;
                this.messageService.add({
                    severity: "success",
                    summary: "Successful",
                    detail: "Product Updated",
                    life: 3000,
                });
            } else {
                this.products.push(this.product);
                this.messageService.add({
                    severity: "success",
                    summary: "Successful",
                    detail: "Product Created",
                    life: 3000,
                });
            }

            this.products = [...this.products];
            this.productDialog = false;
            this.product = undefined;
        }
    }

    findIndexById(id: number): number {
        let index = -1;
        for (let i = 0; i < this.products.length; i++) {
            if (this.products[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    getSeverity(status: string) {
        switch (status) {
            case "INSTOCK":
                return "success";
            case "LOWSTOCK":
                return "warning";
            case "OUTOFSTOCK":
                return "danger";
            default:
                return undefined;
        }
    }
}
