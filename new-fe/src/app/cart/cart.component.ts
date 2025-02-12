import { Component, OnDestroy, OnInit } from "@angular/core";
import { ProductDTO } from "../../typescript-api-client/src/models/productDTO";
import { OrderDTO } from "../../typescript-api-client/src/models/orderDTO";
import { Subject, takeUntil } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Component({
    selector: "cart",
    templateUrl: "./cart.component.html",
    styleUrls: ["./cart.component.scss"],
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
        this.http
            .get<OrderDTO[]>("http://localhost:3000/order")
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((orders: OrderDTO[]) => {
                this.orders = orders;
                console.log("Orders: ", orders);
                this.cartProducts =
                    orders
                        .filter((order) => order.id === 1)[0]!
                        .products.map((product) => {
                            const previewImage =
                                product?.images && product.images.length > 0
                                    ? this.sanitizer.bypassSecurityTrustResourceUrl(
                                          "data:image/jpeg;base64," +
                                              product!.images[0]!.data ?? "",
                                      )
                                    : "";

                            return {
                                ...product,
                                previewImage,
                            };
                        }) ?? [];

                console.log("Cart products: ", this.cartProducts);
                console.log("Orders: ", this.orders);
            });
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
