import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Subject, takeUntil } from "rxjs";
import { MessageService } from "primeng/api";
import { UserService, GiftService } from "src/typescript-api-client/src/api/api";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { MessageModule } from "primeng/message";

export interface GiftDialogUser {
    id: number;
    fullName?: string;
    name?: string;
}

@Component({
    selector: "app-send-gift-dialog",
    templateUrl: "./send-gift-dialog.component.html",
    styleUrls: ["./send-gift-dialog.component.scss"],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        DialogModule,
        TextareaModule,
        TooltipModule,
        MessageModule,
    ],
})
export class SendGiftDialogComponent implements OnInit, OnDestroy {
    @Input() visible: boolean = false;
    @Input() recipientUser: GiftDialogUser | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() giftSent = new EventEmitter<any>();

    private destroy$ = new Subject<void>();

    isSendingGift = false;
    giftForm: FormGroup;
    availableGifts: any[] = [];
    selectedGift: any | null = null;
    balance: string = "0";

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private giftService: GiftService,
        private messageService: MessageService,
    ) {
        this.giftForm = this.fb.group({
            giftEmoji: [null, Validators.required],
            amount: [null, [Validators.required]],
            message: [""],
        });
    }

    ngOnInit(): void {
        this.loadAvailableGifts();
        this.loadBalance();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get recipientName(): string {
        if (!this.recipientUser) return "User";
        return this.recipientUser.fullName || this.recipientUser.name || "User";
    }

    loadAvailableGifts(): void {
        this.availableGifts = [
            { name: "Flirty Drink", emoji: "🍹", value: "🍹", amount: 100 },
            { name: "Red Rose", emoji: "🌹", value: "🌹", amount: 200 },
            { name: "Sexy Cocktail", emoji: "🍸", value: "🍸", amount: 300 },
            { name: "Love Potion", emoji: "💋", value: "💋", amount: 400 },
            { name: "Naughty Toy", emoji: "🧸", value: "🧸", amount: 500 },
            { name: "Diamond Ring", emoji: "💎", value: "💎", amount: 600 },
            { name: "Luxury Lingerie", emoji: "👙", value: "👙", amount: 700 },
            { name: "Champagne", emoji: "🍾", value: "🍾", amount: 800 },
        ];
    }

    loadBalance(): void {
        this.userService.getUser().subscribe({
            next: (user: any) => {
                this.balance = user.balance || "0";
            },
            error: (error) => {
                console.error("Error loading balance:", error);
            },
        });
    }

    selectGift(gift: any): void {
        this.selectedGift = gift;
        this.giftForm.patchValue({
            giftEmoji: gift.value,
            amount: gift.amount,
            message: "",
        });
    }

    sendGift(): void {
        if (this.giftForm.invalid || !this.selectedGift || !this.recipientUser) {
            this.messageService.add({
                severity: "warn",
                summary: "Validation Error",
                detail: "Please select a gift",
            });
            return;
        }

        this.isSendingGift = true;
        const formValue = this.giftForm.value;

        // Convert amount to string as backend expects
        if (typeof formValue.amount === "number") {
            formValue.amount = formValue.amount.toString();
        }

        const giftData = {
            receiverId: Number(this.recipientUser.id),
            giftEmoji: formValue.giftEmoji,
            amount: formValue.amount,
            message: formValue.message || "",
        };

        this.giftService.sendGift(giftData).subscribe({
            next: (response) => {
                this.balance = response.senderBalance?.toString() || this.balance;
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: `Gift sent successfully! Your new balance is ${this.getBalanceAsInteger()} tokens`,
                });
                this.giftSent.emit(response);
                this.closeDialog();
                this.isSendingGift = false;
            },
            error: (error) => {
                console.error("Error sending gift:", error);
                const errorMsg =
                    error.error?.message || "Failed to send gift. Please try again.";
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: errorMsg,
                });
                this.isSendingGift = false;
            },
        });
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.selectedGift = null;
        this.giftForm.reset();
    }

    getBalanceAsInteger(): string {
        const balanceValue = parseFloat(this.balance || "0");
        return Math.floor(balanceValue).toString();
    }

    getBalanceAsNumber(): number {
        return parseFloat(this.balance || "0");
    }

    hasSufficientBalance(amount: number): boolean {
        return amount <= this.getBalanceAsNumber();
    }

    onHide(): void {
        this.closeDialog();
    }
}

