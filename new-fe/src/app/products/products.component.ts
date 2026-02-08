import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { ProductService } from "../../typescript-api-client/src/api/api";
import { FileUpload, FileUploadEvent } from "primeng/fileupload";
import type { FileSelectEvent } from "primeng/types/fileupload";
import { DomSanitizer } from "@angular/platform-browser";
import { ProductDTO } from "../../typescript-api-client/src/model/models";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { FileUploadModule } from "primeng/fileupload";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { RatingModule } from "primeng/rating";
import { DividerModule } from "primeng/divider";
import { ImageModule } from "primeng/image";

@Component({
    templateUrl: "./products.component.html",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        FileUploadModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        DividerModule,
        ImageModule,
    ],
    providers: [MessageService, ConfirmationService],
})
export class ProductsComponent implements OnInit, OnDestroy {
    public product: ProductDTO | undefined = undefined;
    public products: any[] = [];
    public selectedProducts: ProductDTO[] = [];
    public statuses!: any[];
    public visible: boolean = false;
    public isEdit: boolean = false;
    public productForm: FormGroup<any> = this.fb.group({
        name: ["", Validators.required],
        weight: ["", Validators.required],
        price: ["", Validators.required],
        // category: ["", Validators.required],
    });
    public files: File[] = [];
    @ViewChild("fileUpload") public fileUpload?: FileUpload;

    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        private productService: ProductService,
        public fb: FormBuilder,
        private sanitizer: DomSanitizer,
    ) {}

    public ngOnInit(): void {
        this.productService
            .getAll()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: (products: ProductDTO[]) => {
                    console.log("products", products);
                    this.products = products.map((product: ProductDTO) => {
                        const previewImage =
                            product.images && product.images.length > 0
                                ? this.sanitizer.bypassSecurityTrustResourceUrl(
                                      "data:image/jpeg;base64," +
                                          product.images![0]!.data,
                                  )
                                : undefined;
                        console.log("prod.images", product.images);
                        return {
                            ...product,
                            previewImage,
                        };
                    });
                },
            });
    }

    public ngOnDestroy() {
        console.log("ngOnDestroy");
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public openNew() {
        this.product = undefined;
        this.visible = true;
    }

    public deleteSelectedProducts() {
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

    public deleteProduct(product: ProductDTO) {
        console.log("product", product);
        this.confirmationService.confirm({
            message: "Are you sure you want to delete " + product.name + "?",
            header: "Confirm",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.productService
                    .deleteProduct(product.id!.toString())
                    .subscribe({
                        next: () => {
                            this.products = this.products.filter(
                                (val) => val.id !== product.id,
                            );
                            this.product = undefined;
                        },
                        complete: () => {
                            this.messageService.add({
                                severity: "success",
                                summary: "Successful",
                                detail: "Product Deleted",
                                life: 3000,
                            });
                        },
                    });
            },
        });
    }

    public hideDialog() {
        this.isEdit = false;
        this.visible = false;
    }

    public saveProduct() {
        if (this.isEdit) {
            this.updateProduct({
                id: this.product?.id,
                ...this.productForm.getRawValue(),
            });
        } else {
            this.createProduct(this.productForm.getRawValue());
        }
    }

    public createProduct(product: ProductDTO) {
        this.productService
            .createProduct(JSON.stringify(product), this.files)
            .subscribe({
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

        // this.productService.uploadFile(this.files[0]).subscribe(console.log);
    }

    public editProduct(product: ProductDTO) {
        this.isEdit = true;
        this.visible = true;
        const loadedFiles = product.images
            ? product.images?.map((image: any) => {
                  // TODO Extract to a util function
                  const binaryData = atob(image.data);
                  const buffer = new ArrayBuffer(binaryData.length);
                  const view = new Uint8Array(buffer);
                  for (let i = 0; i < binaryData.length; i++) {
                      view[i] = binaryData.charCodeAt(i);
                  }
                  const blob = new Blob([view], { type: "image/jpeg" });
                  return new File([blob], image.name, { type: "image/jpeg" });
              })
            : [];
        this.files = loadedFiles;

        console.log("files", this.files);
        this.product = { ...product };
        this.productForm.patchValue(product);
        console.log("product", product);
    }

    public updateProduct(product: ProductDTO) {
        console.log("product before http call", product);
        const productData = {
            ...product,
            id: undefined, // Remove id from the data since it's in the path
        };
        this.productService
            .updateProduct(
                product.id!.toString(),
                JSON.stringify(productData),
                this.files,
            )
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: (productFromDb) => {
                    this.product = productFromDb;
                    const index = this.products.findIndex(
                        (p) => p.id === productFromDb.id,
                    );
                    if (index !== -1) {
                        this.products[index] = {
                            ...productFromDb,
                            previewImage:
                                productFromDb.images &&
                                productFromDb.images.length > 0
                                    ? this.sanitizer.bypassSecurityTrustResourceUrl(
                                          "data:image/jpeg;base64," +
                                              productFromDb.images[0].data,
                                      )
                                    : undefined,
                        };
                        this.products = [...this.products];
                    }
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

    test() {
        console.log("test");
    }

    onUpload($event: FileUploadEvent) {
        console.log("event", $event);
    }

    onSelectedFilesChange(event: FileSelectEvent) {
        this.files = event.currentFiles;
        console.log(this.files, "this.files");
    }
}
