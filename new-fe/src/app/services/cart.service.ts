import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

interface CartItem {
    productId: string;
    quantity: number;
}

@Injectable({
    providedIn: "root",
})
export class CartService {
    private readonly LOCAL_STORAGE_KEY = "bp_cart";

    // BehaviorSubject holds the current array of cart items
    private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
    /** Expose as observable so components can subscribe (read-only) */
    public cartItems$ = this.cartItemsSubject.asObservable();

    constructor() {
        this.loadCartFromStorage();
    }

    public getCartItems(): CartItem[] {
        // TODO This is a bit questionable
        return this.cartItemsSubject.value;
    }

    public addItem(newItem: CartItem): void {
        const items = [...this.cartItemsSubject.value];
        const existing = items.find(
            (item) => item.productId === newItem.productId,
        );

        if (existing) {
            // TODO REFACTOR
            existing.quantity += newItem.quantity;
        } else {
            items.push(newItem);
        }

        this.cartItemsSubject.next(items);
        this.saveCartToStorage();
    }

    public removeItem(productId: string): void {
        const updated = this.cartItemsSubject.value.filter(
            (item) => item.productId !== productId,
        );
        this.cartItemsSubject.next(updated);
        this.saveCartToStorage();
    }

    public updateQuantity(productId: string, quantity: number): void {
        const items = [...this.cartItemsSubject.value];
        const target = items.find((item) => item.productId === productId);

        if (target) {
            // If quantity is 0 or less, remove it
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                target.quantity = quantity;
                this.cartItemsSubject.next(items);
                this.saveCartToStorage();
            }
        }
    }

    public clearCart(): void {
        this.cartItemsSubject.next([]);
        localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    }

    private loadCartFromStorage(): void {
        const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        if (data) {
            try {
                const parsed = JSON.parse(data) as CartItem[];
                this.cartItemsSubject.next(parsed);
            } catch (err) {
                console.error(
                    "Error parsing cart data from localStorage:",
                    err,
                );
                this.cartItemsSubject.next([]);
            }
        } else {
            this.cartItemsSubject.next([]);
        }
    }

    private saveCartToStorage(): void {
        const items = this.cartItemsSubject.value;
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
}
