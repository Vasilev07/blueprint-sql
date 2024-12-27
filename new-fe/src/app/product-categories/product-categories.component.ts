import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ConfirmationService, MessageService } from "primeng/api";
import { ProductService } from "../../typescript-api-client/src/clients/product.service";

@Component({
    templateUrl: "product-categories.component.html",
    providers: [],
})
export class ProductCategoriesComponent implements OnInit {
    public visible: boolean = false;
    public isEdit: boolean = false;
    public productCategoryForm: FormGroup<any> = this.fb.group({
        name: ["", Validators.required],
        weight: ["", Validators.required],
        price: ["", Validators.required],
        // category: ["", Validators.required],
    });

    constructor(
        private readonly messageService: MessageService,
        private readonly confirmationService: ConfirmationService,
        private productService: ProductService,
        public fb: FormBuilder,
    ) {}

    public ngOnInit(): void {
        console.log("ProductCategoriesComponent initialized");
    }

    public openNew() {
        this.productCategory = undefined;
        this.visible = true;
    }

    test() {
        console.log("test");
    }
}
