import { Component, OnDestroy, OnInit } from "@angular/core";
import { ProductDTO } from "../../typescript-api-client/src/models/productDTO";
import { OrderDTO } from "../../typescript-api-client/src/models/orderDTO";
import { Subject, takeUntil } from "rxjs";
import { HttpClient } from "@angular/common/http";

@Component({
    selector: "cart",
    templateUrl: "./cart.component.html",
})
export class CartComponent implements OnInit, OnDestroy {
    public cartTotalPrice: number = 0;
    public orders: OrderDTO[] = [];
    public cartProducts: ProductDTO[] = [];

    private readonly ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private readonly http: HttpClient) {

    }

    public ngOnInit(): void {
        console.log("CartComponent initialized");
        this.http
            .get<OrderDTO[]>("http://localhost:3000/order")
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((orders: OrderDTO[]) => {
                this.orders = orders;
                this.cartProducts = orders[0]!.products ?? [];
            });
    }

    public ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    public checkout() {
        console.log("Checkout button clicked");
    }

}
