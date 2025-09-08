import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ConfirmationService, MessageService } from "primeng/api";
import { CategoryService } from "../../typescript-api-client/src/api/api";
import { CategoryDTO } from "../../typescript-api-client/src/model/models";
import { Subject, takeUntil } from "rxjs";

@Component({
    templateUrl: "categories.component.html",
    providers: [MessageService, ConfirmationService, CategoryService],
})
export class CategoriesComponent implements OnInit, OnDestroy {
    public visible: boolean = false;
    public isEdit: boolean = false;
    public categoryForm: FormGroup<any> = this.fb.group({
        name: ["", Validators.required],
        description: ["", Validators.required],
    });
    public selectedCategories: CategoryDTO[] = [];
    public categories: CategoryDTO[] = [];

    private category?: CategoryDTO;
    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private readonly messageService: MessageService,
        private readonly confirmationService: ConfirmationService,
        private categoryService: CategoryService,
        public fb: FormBuilder,
    ) {}

    public ngOnInit(): void {
        console.log("CategoriesComponent initialized");
        this.selectedCategories = [];
        this.categoryService
            .getCategories()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: (categories: CategoryDTO[]) => {
                    console.log("categories", categories);
                    this.categories = categories;
                },
            });
    }

    public ngOnDestroy() {
        console.log("ngOnDestroy");
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public openNew() {
        this.visible = true;
    }

    public deleteSelectedCategories() {}

    public deleteCategory(category: CategoryDTO) {
        this.confirmationService.confirm({
            message: "Are you sure you want to delete " + category.name + "?",
            header: "Confirm",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.categoryService
                    .deleteCategory(category.id!.toString())
                    .pipe(takeUntil(this.ngUnsubscribe))
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: "success",
                                summary: "Successful",
                                detail: "Product Deleted",
                                life: 3000,
                            });

                            this.categories = this.categories.filter(
                                (val) => val.id !== category.id,
                            );
                        },
                    });
            },
        });
    }

    public hideDialog() {
        this.isEdit = false;
        this.visible = false;
    }

    public saveCategory() {
        this.isEdit
            ? this.updateCategory({
                  id: this.category?.id,
                  ...this.categoryForm.getRawValue(),
              })
            : this.createCategory(this.categoryForm.getRawValue());
    }

    public createCategory(category: CategoryDTO) {
        this.categoryService
            .createCategory(
                category,
                undefined,
                undefined
            )
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

    public editCategory(category: CategoryDTO) {
        this.isEdit = true;
        this.visible = true;
        this.category = { ...category };
        this.categoryForm.patchValue(category);
        console.log("category", category);
    }

    public updateCategory(category: CategoryDTO) {
        console.log(category, "category");
        this.categoryService
            .updateCategory(category.id!.toString(), category)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
                next: (categoryFromDb) => {
                    this.category = categoryFromDb;
                    const index = this.categories.findIndex(c => c.id === categoryFromDb.id);
                    if (index !== -1) {
                        this.categories[index] = categoryFromDb;
                        this.categories = [...this.categories];
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
}
