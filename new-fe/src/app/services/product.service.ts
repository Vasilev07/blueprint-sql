import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ProductDTO } from "../../typescript-api-client/src/models/productDTO";

@Injectable({
    providedIn: "root",
})
export class ProductService {
    constructor(private http: HttpClient) {}

    getProductsSmall() {
        return this.http
            .get<any>("assets/demo/data/products-small.json")
            .toPromise()
            .then((res) => res.data)
            .then((data) => data);
    }

    getProducts(): Promise<ProductDTO[]> {
        return this.http
            .get<any>("assets/demo/data/products.json")
            .toPromise()
            .then((res) => res.data)
            .then((data) => data);
    }

    getProductsMixed() {
        return this.http
            .get<any>("assets/demo/data/products-mixed.json")
            .toPromise()
            .then((res) => res.data)
            .then((data) => data);
    }

    getProductsWithOrdersSmall() {
        return this.http
            .get<any>("assets/demo/data/products-orders-small.json")
            .toPromise()
            .then((res) => res.data)
            .then((data) => data);
    }
}
