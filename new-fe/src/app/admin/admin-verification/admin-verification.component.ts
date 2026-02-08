import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { Subject, takeUntil } from "rxjs";
import { MessageService, ConfirmationService } from "primeng/api";
import { UserService } from "src/typescript-api-client/src/api/api";

import { VerificationRequestDTO } from "src/typescript-api-client/src/model/verification-request-dto";

import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { SelectModule } from "primeng/select";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { TagModule } from "primeng/tag";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToastModule } from "primeng/toast";

@Component({
    selector: "app-admin-verification",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,
        TableModule,
        ButtonModule,
        DialogModule,
        SelectModule,
        InputTextModule,
        TextareaModule,
        TagModule,
        ProgressSpinnerModule,
        ToastModule,
    ],
    templateUrl: "./admin-verification.component.html",
    styleUrls: ["./admin-verification.component.scss"],
})
export class AdminVerificationComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    verificationRequests: VerificationRequestDTO[] = [];
    filteredRequests: VerificationRequestDTO[] = [];
    isLoading = false;
    selectedRequest: VerificationRequestDTO | null = null;
    showPhotoDialog = false;
    showReviewDialog = false;
    showRejectionDialog = false;
    showRevokeDialog = false;

    // Photo URL cache
    photoUrlCache = new Map<number, SafeUrl>();

    // Review form
    reviewForm = {
        status: "",
        rejectionReason: "",
    };

    // Filters
    statusFilter = "";
    searchTerm = "";

    statusOptions = [
        { label: "All", value: "" },
        { label: "Pending", value: "pending" },
        { label: "In Review", value: "in_review" },
        { label: "Verified", value: "verified" },
        { label: "Rejected", value: "rejected" },
    ];

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private sanitizer: DomSanitizer,
    ) {}

    ngOnInit(): void {
        this.loadVerificationRequests();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadVerificationRequests(): void {
        this.isLoading = true;

        this.userService
            .getAllVerificationRequests(this.statusFilter || "")
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (requests: VerificationRequestDTO[]) => {
                    console.log("Loaded verification requests:", requests);
                    this.verificationRequests = requests || [];
                    this.applyFilters();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error(
                        "Error loading verification requests:",
                        error,
                    );
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load verification requests",
                    });
                    this.verificationRequests = [];
                    this.filteredRequests = [];
                    this.isLoading = false;
                },
            });
    }

    applyFilters(): void {
        let filtered = [...this.verificationRequests];

        // Apply status filter
        if (this.statusFilter && this.statusFilter.trim() !== "") {
            filtered = filtered.filter(
                (request) => request.status === this.statusFilter,
            );
        }

        // Apply search filter
        if (this.searchTerm && this.searchTerm.trim() !== "") {
            const searchLower = this.searchTerm.toLowerCase();
            filtered = filtered.filter(
                (request) =>
                    (request.user?.fullName &&
                        request.user.fullName
                            .toLowerCase()
                            .includes(searchLower)) ||
                    (request.user?.email &&
                        request.user.email.toLowerCase().includes(searchLower)),
            );
        }

        this.filteredRequests = filtered;
        console.log(
            "Filtered requests:",
            this.filteredRequests.length,
            "out of",
            this.verificationRequests.length,
        );
    }

    onStatusFilterChange(): void {
        this.applyFilters();
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    openPhotoDialog(request: VerificationRequestDTO): void {
        this.selectedRequest = request;
        this.showPhotoDialog = true;
        // Load the photo with authentication
        if (request.id) {
            this.loadVerificationPhoto(request.id);
        }
    }

    openReviewDialog(request: VerificationRequestDTO): void {
        this.selectedRequest = request;
        this.reviewForm.status = "";
        this.reviewForm.rejectionReason = "";
        this.showReviewDialog = true;
    }

    openRejectionDialog(request: VerificationRequestDTO): void {
        this.selectedRequest = request;
        this.reviewForm.status = "rejected";
        this.reviewForm.rejectionReason = "";
        this.showRejectionDialog = true;
    }

    openRevokeDialog(request: VerificationRequestDTO): void {
        this.selectedRequest = request;
        this.reviewForm.status = "rejected";
        this.reviewForm.rejectionReason = "";
        this.showRevokeDialog = true;
    }

    approveRequest(request: VerificationRequestDTO): void {
        this.selectedRequest = request;
        this.reviewForm.status = "verified";
        this.reviewForm.rejectionReason = "";
        this.submitReview();
    }

    submitReview(): void {
        const request = this.selectedRequest;
        if (!request || request.id === undefined) return;

        const reviewData = {
            status: this.reviewForm.status as "verified" | "rejected",
            rejectionReason: this.reviewForm.rejectionReason || undefined,
        };

        this.userService
            .reviewVerificationRequest(request.id!, reviewData)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Verification request reviewed successfully",
                    });
                    this.closeDialogs();
                    this.loadVerificationRequests();
                },
                error: (error) => {
                    console.error(
                        "Error reviewing verification request:",
                        error,
                    );
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to review verification request",
                    });
                },
            });
    }

    revokeVerification(): void {
        if (!this.selectedRequest) return;

        this.reviewForm.status = "rejected";
        this.submitReview();
    }

    closeDialogs(): void {
        this.showPhotoDialog = false;
        this.showReviewDialog = false;
        this.showRejectionDialog = false;
        this.showRevokeDialog = false;
        this.selectedRequest = null;
    }

    getStatusSeverity(
        status: string,
    ): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
        switch (status) {
            case "pending":
                return "warn";
            case "in_review":
                return "info";
            case "verified":
                return "success";
            case "rejected":
                return "danger";
            default:
                return "info";
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case "pending":
                return "Pending";
            case "in_review":
                return "In Review";
            case "verified":
                return "Verified";
            case "rejected":
                return "Rejected";
            default:
                return status;
        }
    }

    getVerificationPhotoUrl(requestId: number): SafeUrl | null {
        return this.photoUrlCache.get(requestId) || null;
    }

    loadVerificationPhoto(requestId: number): void {
        // Check if already loaded
        if (this.photoUrlCache.has(requestId)) {
            return;
        }

        // Use the generated API service which handles authentication automatically
        this.userService
            .getVerificationPhoto(requestId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob) => {
                    const objectUrl = URL.createObjectURL(blob);
                    const safeUrl =
                        this.sanitizer.bypassSecurityTrustUrl(objectUrl);
                    this.photoUrlCache.set(requestId, safeUrl);
                },
                error: (error) => {
                    console.error("Error loading verification photo:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load verification photo",
                    });
                },
            });
    }

    viewUserProfile(userId: number): void {
        // Navigate to user profile
        window.open(`/profile/${userId}`, "_blank");
    }

    canReview(request: VerificationRequestDTO): boolean {
        return request.status === "pending" || request.status === "in_review";
    }

    canRevoke(request: VerificationRequestDTO): boolean {
        return request.status === "verified";
    }
}
