import { Component, OnDestroy, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subject, takeUntil } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { LayoutService } from "../layout/service/app.layout.service";
import { ProductDTO } from "../../typescript-api-client/src/models/productDTO";
import { ProductService } from "../../typescript-api-client/src/clients/product.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

@Component({
    templateUrl: "./products.component.html",
    providers: [MessageService, ConfirmationService],
})
export class ProductsComponent implements OnInit, OnDestroy {
    product: ProductDTO | undefined = undefined;
    products: ProductDTO[] = [];
    selectedProducts: ProductDTO[] = [];
    statuses!: any[];
    visible: boolean = false;
    productForm: FormGroup<any> = this.fb.group({
        name: ["", Validators.required],
        weight: ["", Validators.required],
        price: ["", Validators.required],
        category: ["", Validators.required],
    });

    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();
    private isEdit: boolean = false;

    constructor(
        private readonly http: HttpClient,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        public layoutService: LayoutService,
        public productService: ProductService,
        public fb: FormBuilder,
    ) {}

    ngOnInit(): void {
        this.productService
            .getAll()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((products) => {
                console.log("products", products);
                this.products = products;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    openNew() {
        this.product = undefined;
        this.visible = true;
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
        this.isEdit = false;
        this.visible = false;
    }

    saveProduct() {
        this.isEdit
            ? this.editProduct(this.productForm.getRawValue())
            : this.createProduct(this.productForm.getRawValue());
    }

    createProduct(product: ProductDTO) {
        this.productService.createProduct(product).subscribe({
            next: (product: ProductDTO) => {
                this.product = product;
                this.products = [...this.products, product];
            },
            complete: () => {
                this.messageService.add({
                    severity: "success",
                    summary: "Successful",
                    detail: "Product Created",
                    life: 3000,
                });

                this.hideDialog();
            },
        });
    }

    editProduct(product: ProductDTO) {
        this.isEdit = true;
        this.visible = true;
        this.product = { ...product };
        this.productForm.patchValue(product);

        this.productService
            .updateProduct(product)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: () => {
                    // TODO Check that
                    this.product = product;
                    this.products = [...this.products, product];
                },
                complete: () => {
                    this.messageService.add({
                        severity: "success",
                        summary: "Successful",
                        detail: "Product Updated",
                        life: 3000,
                    });

                    this.hideDialog();
                },
            });
    }
}
