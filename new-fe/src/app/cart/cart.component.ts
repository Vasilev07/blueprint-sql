import { Component, OnDestroy, OnInit } from "@angular/core";
import { ProductDTO } from "../../typescript-api-client/src/model/models";
import { OrderDTO } from "../../typescript-api-client/src/model/models";
import { Subject, takeUntil } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Component({
    selector: "cart",
    templateUrl: "./cart.component.html",
})
export class CartComponent implements OnInit, OnDestroy {
    public cartTotalPrice: number = 0;
    public orders: OrderDTO[] = [];
    public cartProducts: ({ previewImage: SafeResourceUrl } & ProductDTO)[] =
        [];
    public vat: number = 0;
    public total: number = 0;
    public shippingCost: number = 0;
    public cartSubtotal: number = 0;
    public quantity: number = 1;

    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private readonly http: HttpClient,
        private sanitizer: DomSanitizer,
    ) {}

    public ngOnInit(): void {
        console.log("CartComponent initialized");

    }

    public ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public checkout() {
        console.log("Checkout button clicked");
    }

    removeItem(id: number | undefined) {}
}
