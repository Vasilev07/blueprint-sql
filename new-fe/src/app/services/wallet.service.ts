import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject, takeUntil } from "rxjs";
import { WebsocketService } from "./websocket.service";
import { UserService } from "src/typescript-api-client/src/api/api";

export const SUPER_LIKE_COST_FE = 200;

@Injectable({
    providedIn: "root",
})
export class WalletService {
    private balanceSubject = new BehaviorSubject<string>("0");
    public balance$: Observable<string> = this.balanceSubject.asObservable();

    private canAffordSuperLikeSubject = new BehaviorSubject<boolean>(false);
    public canAffordSuperLike$: Observable<boolean> =
        this.canAffordSuperLikeSubject.asObservable();

    private destroy$ = new Subject<void>();

    constructor(
        private websocketService: WebsocketService,
        private userService: UserService,
    ) {
        this.initializeBalance();
        this.setupWebSocketListeners();
    }

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

    private setupWebSocketListeners(): void {
        this.websocketService
            .onBalanceUpdate()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (payload) => {
                    const token = localStorage.getItem("id_token");
                    if (token) {
                        try {
                            const userPayload = JSON.parse(
                                atob(token.split(".")[1]),
                            );
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

    private updateCanAffordSuperLike(balance: string): void {
        const balanceNum = parseFloat(balance || "0");
        const canAfford = balanceNum >= SUPER_LIKE_COST_FE;
        this.canAffordSuperLikeSubject.next(canAfford);
    }

    getSuperLikeCost(): number {
        return SUPER_LIKE_COST_FE;
    }

    getBalance(): string {
        return this.balanceSubject.value;
    }

    canAffordSuperLike(): boolean {
        return this.canAffordSuperLikeSubject.value;
    }

    canAfford(amount: number): boolean {
        const balanceNum = parseFloat(this.balanceSubject.value || "0");
        return balanceNum >= amount;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
