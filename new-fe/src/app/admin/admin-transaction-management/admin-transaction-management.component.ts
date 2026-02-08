import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { MessageService } from "primeng/api";
import { UserService } from "src/typescript-api-client/src/api/api";
import { WalletService } from "src/typescript-api-client/src/api/api";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { SelectModule } from "primeng/select";
import { InputTextModule } from "primeng/inputtext";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";

interface User {
    id?: number;
    firstname?: string;
    lastname?: string;
    email?: string;
    fullName?: string;
    balance?: string;
}

@Component({
    selector: "app-admin-transaction-management",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputNumberModule,
        SelectModule,
        InputTextModule,
        ProgressSpinnerModule,
        ToastModule,
    ],
    templateUrl: "./admin-transaction-management.component.html",
    styleUrls: ["./admin-transaction-management.component.scss"],
})
export class AdminTransactionManagementComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    users: User[] = [];
    filteredUsers: User[] = [];
    isLoading = false;
    selectedUser: User | null = null;
    showDepositDialog = false;
    showTransferDialog = false;

    // Deposit form
    depositForm = {
        userId: 0,
        amount: null as number | null,
    };

    // Transfer form
    transferForm = {
        fromUserId: 0,
        toUserId: 0,
        amount: null as number | null,
    };

    // Filters
    searchTerm = "";

    constructor(
        private userService: UserService,
        private walletService: WalletService,
        private messageService: MessageService,
    ) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadUsers(): void {
        this.isLoading = true;

        this.walletService
            .listUsersWithBalance()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const withFullName = (response.users || []).map(
                        (u: any) => ({
                            ...u,
                            fullName:
                                `${u.firstname || ""} ${u.lastname || ""}`.trim(),
                        }),
                    );
                    this.users = withFullName;
                    this.applyFilters();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error("Error loading users with balances:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load users with balances",
                    });
                    this.isLoading = false;
                },
            });
    }

    applyFilters(): void {
        let filtered = [...this.users];

        // Apply search filter
        if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filtered = filtered.filter(
                (user) =>
                    user.fullName?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower),
            );
        }

        this.filteredUsers = filtered;
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    openDepositDialog(user: User): void {
        this.selectedUser = user;
        this.depositForm = {
            userId: user.id || 0,
            amount: null,
        };
        this.showDepositDialog = true;
    }

    openTransferDialog(user: User): void {
        this.selectedUser = user;
        this.transferForm = {
            fromUserId: user.id || 0,
            toUserId: 0,
            amount: null,
        };
        this.showTransferDialog = true;
    }

    submitDeposit(): void {
        if (
            !this.depositForm.userId ||
            this.depositForm.amount === null ||
            this.depositForm.amount === undefined
        ) {
            this.messageService.add({
                severity: "warn",
                summary: "Validation",
                detail: "Please fill in all required fields",
            });
            return;
        }

        const amount = Number(this.depositForm.amount);
        if (isNaN(amount) || amount <= 0) {
            this.messageService.add({
                severity: "warn",
                summary: "Validation",
                detail: "Amount must be a positive number",
            });
            return;
        }

        this.walletService
            .adminDeposit({
                userId: this.depositForm.userId,
                amount: amount.toString(),
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: `Successfully deposited ${amount} tokens. New balance: ${response.balance}`,
                    });
                    this.closeDialogs();
                    this.loadUsers();
                },
                error: (error) => {
                    console.error("Error depositing funds:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail:
                            error.error?.message || "Failed to deposit funds",
                    });
                },
            });
    }

    submitTransfer(): void {
        if (
            !this.transferForm.fromUserId ||
            !this.transferForm.toUserId ||
            this.transferForm.amount === null ||
            this.transferForm.amount === undefined
        ) {
            this.messageService.add({
                severity: "warn",
                summary: "Validation",
                detail: "Please fill in all required fields",
            });
            return;
        }

        if (this.transferForm.fromUserId === this.transferForm.toUserId) {
            this.messageService.add({
                severity: "warn",
                summary: "Validation",
                detail: "Cannot transfer to the same user",
            });
            return;
        }

        const amount = Number(this.transferForm.amount);
        if (isNaN(amount) || amount <= 0) {
            this.messageService.add({
                severity: "warn",
                summary: "Validation",
                detail: "Amount must be a positive number",
            });
            return;
        }

        this.walletService
            .adminTransfer({
                fromUserId: this.transferForm.fromUserId,
                toUserId: this.transferForm.toUserId,
                amount: amount.toString(),
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: `Successfully transferred ${amount} tokens. From balance: ${response.fromBalance}, To balance: ${response.toBalance}`,
                    });
                    this.closeDialogs();
                    this.loadUsers();
                },
                error: (error) => {
                    console.error("Error transferring funds:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail:
                            error.error?.message || "Failed to transfer funds",
                    });
                },
            });
    }

    closeDialogs(): void {
        this.showDepositDialog = false;
        this.showTransferDialog = false;
        this.selectedUser = null;
        this.depositForm = { userId: 0, amount: null };
        this.transferForm = { fromUserId: 0, toUserId: 0, amount: null };
    }

    viewUserProfile(userId?: number): void {
        if (userId) {
            window.open(`/profile/${userId}`, "_blank");
        }
    }
}
