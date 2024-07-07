import { Component, OnDestroy, OnInit } from "@angular/core";
import { ProductDTO } from "../../typescript-api-client/src/models/productDTO";
import { HttpClient } from "@angular/common/http";
import { Subject, takeUntil } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { LayoutService } from "../layout/service/app.layout.service";

@Component({
    templateUrl: "./products.component.html",
    providers: [MessageService, ConfirmationService],
})
export class ProductsComponent implements OnInit, OnDestroy {
    product: ProductDTO | undefined = undefined;
    products: ProductDTO[] = [];
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
        this.http
            .get<ProductDTO[]>("http://localhost:3000/products")
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((products: ProductDTO[]) => {
                this.products = products;
            });

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
}
