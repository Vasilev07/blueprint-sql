import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subject, takeUntil } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { ProductService } from "../../typescript-api-client/src/clients/product.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import {
    FileSelectEvent,
    FileUpload,
    FileUploadEvent,
} from "primeng/fileupload";
import { DomSanitizer } from "@angular/platform-browser";
import { ProductDTO } from "../../typescript-api-client/src/models/productDTO";

@Component({
    templateUrl: "./products.component.html",
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
        private readonly http: HttpClient,
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
                            // images: product.images.map((image: ProductImageDTO) => {
                            //     return new File([image.data], image.name)
                            // }),
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
        this.isEdit
            ? this.updateProduct({
                  id: this.product?.id,
                  ...this.productForm.getRawValue(),
              })
            : this.createProduct(this.productForm.getRawValue());
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
        console.log("loadedFiles", loadedFiles);
        this.fileUpload?.files.push(...loadedFiles);

        console.log("files", this.files);
        this.product = { ...product };
        this.productForm.patchValue(product);
        console.log("product", product);
    }

    public updateProduct(product: ProductDTO) {
        console.log("product before http call", product);
        this.productService
            .updateProduct(product.id!.toString(), product)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: (productFromDb) => {
                    productFromDb;
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
