import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject, takeUntil } from "rxjs";
import { WebsocketService } from "./websocket.service";
import { UserService } from "src/typescript-api-client/src/api/api";

export const SUPER_LIKE_COST_FE = 200; // Cost in tokens for super like

@Injectable({
    providedIn: "root",
})
export class WalletService {
    private balanceSubject = new BehaviorSubject<string>("0");
    public balance$: Observable<string> = this.balanceSubject.asObservable();

    private canAffordSuperLikeSubject = new BehaviorSubject<boolean>(false);
    public canAffordSuperLike$: Observable<boolean> = this.canAffordSuperLikeSubject.asObservable();

    private destroy$ = new Subject<void>();

    constructor(
        private websocketService: WebsocketService,
        private userService: UserService,
    ) {
        this.initializeBalance();
        this.setupWebSocketListeners();
    }

    /**
     * Initialize balance from user service
     */
    private initializeBalance(): void {
        this.userService.getUser().subscribe({
            next: (user: any) => {
                const balance = user.balance || "0";
                this.balanceSubject.next(balance);
                this.updateCanAffordSuperLike(balance);
            },
            error: (error) => {
                console.error("Error loading balance:", error);
            },
        });
    }

    /**
     * Set up WebSocket listeners for real-time balance updates
     */
    private setupWebSocketListeners(): void {
        this.websocketService.onBalanceUpdate()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (payload) => {
                    // Update balance if it's for the current user
                    const token = localStorage.getItem("id_token");
                    if (token) {
                        try {
                            const userPayload = JSON.parse(atob(token.split(".")[1]));
                            if (payload.userId === userPayload.id) {
                                this.balanceSubject.next(payload.balance);
                                this.updateCanAffordSuperLike(payload.balance);
                            }
                        } catch (error) {
                            console.error("Error parsing token:", error);
                        }
                    }
                },
            });
    }

    /**
     * Update can afford super like based on current balance
     */
    private updateCanAffordSuperLike(balance: string): void {
        const balanceNum = parseFloat(balance || "0");
        const canAfford = balanceNum >= SUPER_LIKE_COST_FE;
        this.canAffordSuperLikeSubject.next(canAfford);
    }

    /**
     * Get super like cost
     */
    getSuperLikeCost(): number {
        return SUPER_LIKE_COST_FE;
    }

    /**
     * Get current balance
     */
    getBalance(): string {
        return this.balanceSubject.value;
    }

    /**
     * Check if user can afford super like
     */
    canAffordSuperLike(): boolean {
        return this.canAffordSuperLikeSubject.value;
    }

    /**
     * Check if user can afford an amount
     */
    canAfford(amount: number): boolean {
        const balanceNum = parseFloat(this.balanceSubject.value || "0");
        return balanceNum >= amount;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

