import { Component, OnDestroy, OnInit } from "@angular/core";
import { ProductDTO } from "../../typescript-api-client/src/models/productDTO";
import { LayoutService } from "../layout/service/app.layout.service";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

@Component({
    selector: "app-products",
    templateUrl: "./products.component.html",
})
export class ProductsComponent implements OnInit, OnDestroy {
    products: ProductDTO[] = [];
    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private readonly http: HttpClient,
        public layoutService: LayoutService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.http
            .get<ProductDTO[]>("http://localhost:3000/products")
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((products: ProductDTO[]) => {
                this.products = products;
                this.router.navigate(["/products"]);
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
