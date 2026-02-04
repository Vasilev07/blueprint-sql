import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { MessageService, ConfirmationService } from "primeng/api";
import { UserService } from "src/typescript-api-client/src/api/api";

import { VerificationRequestDTO } from "src/typescript-api-client/src/model/verification-request-dto";
import { ReviewVerificationRequestDTO } from "src/typescript-api-client/src/model/review-verification-request-dto";

@Component({
    selector: "app-admin-verification",
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
    ) { }

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
                    this.verificationRequests = requests;
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
                    this.isLoading = false;
                },
            });
    }

    applyFilters(): void {
        let filtered = [...this.verificationRequests];

        // Apply status filter
        if (this.statusFilter) {
            filtered = filtered.filter(
                (request) => request.status === this.statusFilter,
            );
        }

        // Apply search filter
        if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filtered = filtered.filter(
                (request) =>
                    request.user.firstname
                        .toLowerCase()
                        .includes(searchLower) ||
                    request.user.lastname.toLowerCase().includes(searchLower) ||
                    request.user.email.toLowerCase().includes(searchLower),
            );
        }

        this.filteredRequests = filtered;
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
        if (!this.selectedRequest) return;

        const reviewData = {
            status: this.reviewForm.status as 'verified' | 'rejected',
            rejectionReason: this.reviewForm.rejectionReason || undefined,
        };

        this.userService
            .reviewVerificationRequest(this.selectedRequest.id, reviewData)
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

    getStatusSeverity(status: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" {
        switch (status) {
            case "pending":
                return "warning";
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

    getVerificationPhotoUrl(requestId: number): string {
        return `/api/auth/admin/verifications/${requestId}/photo`;
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
