import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { GiftService, UserService } from "src/typescript-api-client/src/api/api";
import { MessageService } from "primeng/api";
import { AuthService } from "../services/auth.service";
import { environment } from "src/environments/environment";

interface GiftImage {
    name: string;
    url: string;
}

@Component({
    selector: "app-gift-shop",
    templateUrl: "./gift-shop.component.html",
    styleUrls: ["./gift-shop.component.scss"],
    providers: [MessageService],
})
export class GiftShopComponent implements OnInit {
    giftForm: FormGroup;
    availableGifts: GiftImage[] = [];
    selectedGift: GiftImage | null = null;
    users: any[] = [];
    filteredUsers: any[] = [];
    searchTerm: string = "";
    isLoading: boolean = false;
    isSending: boolean = false;
    apiUrl: string = environment.apiUrl;

    constructor(
        private fb: FormBuilder,
        private giftService: GiftService,
        private userService: UserService,
        private messageService: MessageService,
        private authService: AuthService
    ) {
        this.giftForm = this.fb.group({
            receiverId: [null, Validators.required],
            giftImageName: [null, Validators.required],
            amount: ["", [Validators.required, Validators.min(0.01)]],
            message: [""],
        });
    }

    ngOnInit(): void {
        this.loadAvailableGifts();
        this.loadUsers();
    }

    loadAvailableGifts(): void {
        this.isLoading = true;
        this.giftService.getAvailableGiftImages().subscribe({
            next: (response) => {
                this.availableGifts = (response.giftImages || []).map((imageName: string) => ({
                    name: imageName,
                    url: `${this.apiUrl}/gifts/image/${imageName}`,
                }));
                this.isLoading = false;
            },
            error: (error) => {
                console.error("Error loading gift images:", error);
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to load gift images",
                });
                this.isLoading = false;
            },
        });
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

    selectGift(gift: GiftImage): void {
        this.selectedGift = gift;
        this.giftForm.patchValue({ giftImageName: gift.name });
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

    handleImageError(event: any): void {
        event.target.src = "assets/images/placeholder.png"; // Fallback image
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

        this.giftService.sendGift(formValue).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: `Gift sent successfully! Your new balance is ${response.senderBalance}`,
                });
                this.giftForm.reset();
                this.selectedGift = null;
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
}

