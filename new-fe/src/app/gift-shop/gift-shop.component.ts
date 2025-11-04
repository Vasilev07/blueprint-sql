import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { GiftService, UserService, WalletService } from "src/typescript-api-client/src/api/api";
import { MessageService } from "primeng/api";
import { AuthService } from "../services/auth.service";

interface GiftOption {
    name: string; // human-readable label
    emoji: string; // emoji character for UI display
    value: string; // emoji value sent to backend
    amount: number; // preset amount in tokens
}

@Component({
    selector: "app-gift-shop",
    templateUrl: "./gift-shop.component.html",
    styleUrls: ["./gift-shop.component.scss"],
    providers: [MessageService],
})
export class GiftShopComponent implements OnInit {
    giftForm: FormGroup;
    availableGifts: GiftOption[] = [];
    selectedGift: GiftOption | null = null;
    users: any[] = [];
    filteredUsers: any[] = [];
    searchTerm: string = "";
    isLoading: boolean = false;
    isSending: boolean = false;
    showSendGiftDialog: boolean = false;
    
    // Balance and deposit
    balance: string = "0";
    showDepositDialog = false;
    isDepositing = false;
    depositForm: any = {
        amount: null as number | null,
        cardNumber: "",
        cardHolder: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
    };


    constructor(
        private fb: FormBuilder,
        private giftService: GiftService,
        private userService: UserService,
        private walletService: WalletService,
        private messageService: MessageService,
        private authService: AuthService
    ) {
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
        // Backend now accepts emojis directly
        // Each gift has a preset amount: 100, 200, 300, 400, etc.
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
        this.isLoading = false;
    }

    loadUsers(): void {
        const currentUserId = this.authService.getUserId();
        this.userService
            .getAll(1, 1000, "all", "recent", "", "", 0, 100, "", "", false)
            .subscribe({
                next: (response: any) => {
                    // Filter out current user
                    this.users = (response.users || []).filter(
                        (u: any) => u.id !== currentUserId
                    );
                    this.filteredUsers = [...this.users];
                },
                error: (error) => {
                    console.error("Error loading users:", error);
                },
            });
    }

    selectGift(gift: GiftOption): void {
        this.selectedGift = gift;
        // Set both emoji and preset amount
        this.giftForm.patchValue({ 
            giftEmoji: gift.value,
            amount: gift.amount,
            receiverId: null,
            message: ""
        });
        // Open the send gift dialog
        this.showSendGiftDialog = true;
    }

    searchUsers(event: any): void {
        const query = event.query?.toLowerCase() || "";
        this.filteredUsers = this.users.filter(
            (user) =>
                user.firstname?.toLowerCase().includes(query) ||
                user.lastname?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query)
        );
    }

    getUserDisplay(user: any): string {
        if (!user) return "";
        return `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email || "Unknown";
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

        this.isSending = true;
        const formValue = this.giftForm.value;
        
        // Ensure receiverId is a number
        if (typeof formValue.receiverId === 'object' && formValue.receiverId !== null) {
            formValue.receiverId = formValue.receiverId.id;
        }
        
        // Convert amount to string as backend expects
        if (typeof formValue.amount === 'number') {
            formValue.amount = formValue.amount.toString();
        }

        this.giftService.sendGift(formValue).subscribe({
            next: (response) => {
                this.balance = response.senderBalance?.toString() || this.balance;
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: `Gift sent successfully! Your new balance is ${this.getBalanceAsInteger()} tokens`,
                });
                this.closeSendGiftDialog();
                this.isSending = false;
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
                this.isSending = false;
            },
        });
    }

    closeSendGiftDialog(): void {
        this.showSendGiftDialog = false;
        this.selectedGift = null;
        this.giftForm.reset();
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

    getBalanceAfterSending(amount: number): number {
        return Math.floor(this.getBalanceAsNumber()) - amount;
    }

    openDepositDialog(): void {
        this.showDepositDialog = true;
    }

    closeDepositDialog(): void {
        this.showDepositDialog = false;
        this.isDepositing = false;
        this.depositForm = { amount: null, cardNumber: '', cardHolder: '', expiryMonth: '', expiryYear: '', cvv: '' };
    }

    formatCardNumber(event: any): void {
        let value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        this.depositForm.cardNumber = formattedValue;
    }

    submitDeposit(): void {
        if (this.depositForm.amount === null || this.depositForm.amount === undefined || this.depositForm.amount <= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Enter a positive amount' });
            return;
        }

        const amount = Math.floor(Number(this.depositForm.amount));
        this.isDepositing = true;

        this.walletService.deposit({ 
            amount: amount.toString(), 
            currency: 'USD', 
            paymentMethod: 'card' 
        }).subscribe({
            next: (response: any) => {
                this.balance = response.balance || this.balance;
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: `Successfully added ${amount} tokens. New balance: ${this.getBalanceAsInteger()} tokens` 
                });
                this.isDepositing = false;
                this.closeDepositDialog();
            },
            error: (error: any) => {
                console.error('Error depositing funds:', error);
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: error.error?.message || 'Failed to add tokens. Please try again.' 
                });
                this.isDepositing = false;
            },
        });
    }
}

