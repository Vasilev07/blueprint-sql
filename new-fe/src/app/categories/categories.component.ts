import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ConfirmationService, MessageService } from "primeng/api";
import { CategoryService } from "../../typescript-api-client/src/clients/category.service";
import { CategoryDTO } from "../../typescript-api-client/src/models/categoryDTO";

@Component({
    templateUrl: "categories.component.html",
    providers: [MessageService, ConfirmationService, CategoryService],
})
export class CategoriesComponent implements OnInit {
    public visible: boolean = false;
    public isEdit: boolean = false;
    public categoryForm: FormGroup<any> = this.fb.group({
        name: ["", Validators.required],
        description: ["", Validators.required],
    });
    public selectedCategories: CategoryDTO[] = [];
    public categories: CategoryDTO[] = [];

    private category?: CategoryDTO;

    constructor(
        private readonly messageService: MessageService,
        private readonly confirmationService: ConfirmationService,
        private categoryService: CategoryService,
        public fb: FormBuilder,
    ) {}

    public ngOnInit(): void {
        console.log("CategoriesComponent initialized");
        this.selectedCategories = [];
        this.categoryService.getCategories().subscribe({
            next: (categories: CategoryDTO[]) => {
                console.log("categories", categories);
                this.categories = categories;
            },
        });
    }

    public openNew() {
        this.visible = true;
    }

    test() {
        console.log("test");
    }

    deleteSelectedCategories() {}

    editCategory(category: CategoryDTO) {
        this.isEdit = true;
        this.visible = true;
        this.category = { ...category };
        this.categoryForm.patchValue(category);
        console.log("category", category);
    }

    updateCategory(category: CategoryDTO) {}

    deleteCategory(category: CategoryDTO) {}

    hideDialog() {
        this.isEdit = false;
        this.visible = false;
    }

    saveCategory() {
        this.isEdit
            ? this.updateCategory({
                  id: this.category?.id,
                  ...this.categoryForm.getRawValue(),
              })
            : this.createCategory(this.categoryForm.getRawValue());
    }

    createCategory(category: CategoryDTO) {
        this.categoryService
            .createCategory({
                id: undefined,
                ...category,
                parent: undefined,
                children: undefined,
            })
            .subscribe({
                next: (category: CategoryDTO) => {
                    this.category = category;
                    this.categories = [...this.categories, category];
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
}
