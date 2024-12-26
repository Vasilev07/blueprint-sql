import { Component, OnInit } from "@angular/core";

@Component({
    templateUrl: "product-categories.component.html",
    providers: [],
})
export class ProductCategoriesComponent implements OnInit {
    public ngOnInit(): void {
        console.log("ProductCategoriesComponent initialized");
    }
}
