import { Component, OnInit, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from "@angular/forms";
import {
    GiftService,
    UserService,
    WalletService,
} from "src/typescript-api-client/src/api/api";
import { MessageService } from "primeng/api";
import { AuthService } from "../services/auth.service";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TextareaModule } from "primeng/textarea";
import { InputNumberModule } from "primeng/inputnumber";
import { AutoCompleteModule } from "primeng/autocomplete";
import { AvatarModule } from "primeng/avatar";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";
import { DialogModule } from "primeng/dialog";

interface GiftOption {
    name: string;
    emoji: string;
    value: string;
    amount: number;
}

@Component({
    selector: "app-gift-shop",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InputTextModule,
        ButtonModule,
        CardModule,
        TextareaModule,
        InputNumberModule,
        AutoCompleteModule,
        AvatarModule,
        ProgressSpinnerModule,
        ToastModule,
        DialogModule,
    ],
    templateUrl: "./gift-shop.component.html",
    styleUrls: ["./gift-shop.component.scss"],
    providers: [MessageService],
})
export class GiftShopComponent implements OnInit {
    private fb = inject(FormBuilder);
    private giftService = inject(GiftService);
    private userService = inject(UserService);
    private walletService = inject(WalletService);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);

    giftForm: FormGroup;

    readonly availableGifts = signal<GiftOption[]>([]);
    readonly selectedGift = signal<GiftOption | null>(null);
    readonly users = signal<any[]>([]);
    readonly filteredUsers = signal<any[]>([]);
    readonly isLoading = signal(false);
    readonly isSending = signal(false);
    readonly showSendGiftDialog = signal(false);
    readonly balance = signal("0");
    readonly showDepositDialog = signal(false);
    readonly isDepositing = signal(false);
    depositForm = {
        amount: null as number | null,
        cardNumber: "",
        cardHolder: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
    };

    readonly balanceAsInteger = computed(() =>
        Math.floor(parseFloat(this.balance() || "0")).toString(),
    );
    readonly balanceAsNumber = computed(() =>
        parseFloat(this.balance() || "0"),
    );

    constructor() {
        this.giftForm = this.fb.group({
            receiverId: [null, Validators.required],
            giftEmoji: [null, Validators.required],
            amount: [null, [Validators.required]],
            message: [""],
        });
    }

    ngOnInit(): void {
        this.loadAvailableGifts();
        this.loadUsers();
        this.loadBalance();
    }

    loadAvailableGifts(): void {
        this.availableGifts.set([
            { name: "Flirty Drink", emoji: "🍹", value: "🍹", amount: 100 },
            { name: "Red Rose", emoji: "🌹", value: "🌹", amount: 200 },
            { name: "Sexy Cocktail", emoji: "🍸", value: "🍸", amount: 300 },
            { name: "Love Potion", emoji: "💋", value: "💋", amount: 400 },
            { name: "Naughty Toy", emoji: "🧸", value: "🧸", amount: 500 },
            { name: "Diamond Ring", emoji: "💎", value: "💎", amount: 600 },
            { name: "Luxury Lingerie", emoji: "👙", value: "👙", amount: 700 },
            { name: "Champagne", emoji: "🍾", value: "🍾", amount: 800 },
        ]);
        this.isLoading.set(false);
    }

    loadUsers(): void {
        const currentUserId = this.authService.getUserId();
        this.userService
            .getAll(1, 1000, "all", "recent", "", "", 0, 100, "", "", false)
            .subscribe({
                next: (response: any) => {
                    const list = (response.users || []).filter(
                        (u: any) => u.id !== currentUserId,
                    );
                    this.users.set(list);
                    this.filteredUsers.set([...list]);
                },
                error: (error) => {
                    console.error("Error loading users:", error);
                },
            });
    }

    selectGift(gift: GiftOption): void {
        this.selectedGift.set(gift);
        this.giftForm.patchValue({
            giftEmoji: gift.value,
            amount: gift.amount,
            receiverId: null,
            message: "",
        });
        this.showSendGiftDialog.set(true);
    }

    searchUsers(event: any): void {
        const query = event.query?.toLowerCase() || "";
        const list = this.users().filter(
            (user) =>
                user.firstname?.toLowerCase().includes(query) ||
                user.lastname?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query),
        );
        this.filteredUsers.set(list);
    }

    getUserDisplay(user: any): string {
        if (!user) return "";
        return (
            `${user.firstname || ""} ${user.lastname || ""}`.trim() ||
            user.email ||
            "Unknown"
        );
    }

    onSubmit(): void {
        if (this.giftForm.invalid) {
            this.messageService.add({
                severity: "warn",
                summary: "Validation Error",
                detail: "Please fill in all required fields correctly",
            });
            return;
        }

        this.isSending.set(true);
        const formValue = this.giftForm.value;

        if (
            typeof formValue.receiverId === "object" &&
            formValue.receiverId !== null
        ) {
            formValue.receiverId = formValue.receiverId.id;
        }

        if (typeof formValue.amount === "number") {
            formValue.amount = formValue.amount.toString();
        }

        this.giftService.sendGift(formValue).subscribe({
            next: (response) => {
                this.balance.set(
                    response.senderBalance?.toString() || this.balance(),
                );
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: `Gift sent successfully! Your new balance is ${this.balanceAsInteger()} tokens`,
                });
                this.closeSendGiftDialog();
                this.isSending.set(false);
            },
            error: (error) => {
                console.error("Error sending gift:", error);
                const errorMsg =
                    error.error?.message ||
                    "Failed to send gift. Please try again.";
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: errorMsg,
                });
                this.isSending.set(false);
            },
        });
    }

    closeSendGiftDialog(): void {
        this.showSendGiftDialog.set(false);
        this.selectedGift.set(null);
        this.giftForm.reset();
    }

    loadBalance(): void {
        this.userService.getUser().subscribe({
            next: (user: any) => {
                this.balance.set(user.balance || "0");
            },
            error: (error) => {
                console.error("Error loading balance:", error);
            },
        });
    }

    getBalanceAsInteger(): string {
        return this.balanceAsInteger();
    }

    hasSufficientBalance(amount: number): boolean {
        return amount <= this.balanceAsNumber();
    }

    getBalanceAfterSending(amount: number): number {
        return Math.floor(this.balanceAsNumber()) - amount;
    }

    openDepositDialog(): void {
        this.showDepositDialog.set(true);
    }

    closeDepositDialog(): void {
        this.showDepositDialog.set(false);
        this.isDepositing.set(false);
        this.depositForm = {
            amount: null,
            cardNumber: "",
            cardHolder: "",
            expiryMonth: "",
            expiryYear: "",
            cvv: "",
        };
    }

    formatCardNumber(event: any): void {
        const value = event.target.value
            .replace(/\s+/g, "")
            .replace(/[^0-9]/gi, "");
        const formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
        this.depositForm.cardNumber = formattedValue;
    }

    submitDeposit(): void {
        const form = this.depositForm;
        if (
            form.amount === null ||
            form.amount === undefined ||
            form.amount <= 0
        ) {
            this.messageService.add({
                severity: "warn",
                summary: "Validation",
                detail: "Enter a positive amount",
            });
            return;
        }

        const amount = Math.floor(Number(form.amount));
        this.isDepositing.set(true);

        this.walletService
            .deposit({
                amount: amount.toString(),
                currency: "USD",
                paymentMethod: "card",
            })
            .subscribe({
                next: (response: any) => {
                    this.balance.set(response.balance || this.balance());
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: `Successfully added ${amount} tokens. New balance: ${this.balanceAsInteger()} tokens`,
                    });
                    this.isDepositing.set(false);
                    this.closeDepositDialog();
                },
                error: (error: any) => {
                    console.error("Error depositing funds:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail:
                            error.error?.message ||
                            "Failed to add tokens. Please try again.",
                    });
                    this.isDepositing.set(false);
                },
            });
    }
}
