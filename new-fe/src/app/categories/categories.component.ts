import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ConfirmationService, MessageService } from "primeng/api";
import { ProductService } from "../../typescript-api-client/src/clients/product.service";

@Component({
    templateUrl: "categories.component.html",
    providers: [MessageService, ConfirmationService],
})
export class CategoriesComponent implements OnInit {
    public visible: boolean = false;
    public isEdit: boolean = false;
    public categoryForm: FormGroup<any> = this.fb.group({
        name: ["", Validators.required],
        weight: ["", Validators.required],
        price: ["", Validators.required],
        // category: ["", Validators.required],
    });
    selectedCategories: any[] = [];
    categories: any[] = [];

    constructor(
        private readonly messageService: MessageService,
        private readonly confirmationService: ConfirmationService,
        private productService: ProductService,
        public fb: FormBuilder,
    ) {}

    public ngOnInit(): void {
        console.log("CategoriesComponent initialized");
        this.selectedCategories = [];
    }

    public openNew() {
        this.visible = true;
    }

    test() {
        console.log("test");
    }

    deleteSelectedCategories() {}

    editCategory(product: any) {}

    deleteCategory(product: any) {}

    hideDialog() {}

    saveCategory() {}
}
