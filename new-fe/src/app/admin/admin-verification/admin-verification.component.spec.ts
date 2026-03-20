import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { MessageService, ConfirmationService } from "primeng/api";
import { DomSanitizer } from "@angular/platform-browser";
import { AdminVerificationComponent } from "./admin-verification.component";
import { UserService } from "src/typescript-api-client/src/api/api";
import { VerificationRequestDTO } from "src/typescript-api-client/src/model/verification-request-dto";

describe("AdminVerificationComponent", () => {
    let fixture: ComponentFixture<AdminVerificationComponent>;
    let component: AdminVerificationComponent;
    let userService: jest.Mocked<
        Pick<
            UserService,
            "getAllVerificationRequests" | "reviewVerificationRequest" | "getVerificationPhoto"
        >
    >;

    beforeEach(async () => {
        userService = {
            getAllVerificationRequests: jest
                .fn()
                .mockReturnValue(of([]) as any),
            reviewVerificationRequest: jest
                .fn()
                .mockReturnValue(of(void 0) as any),
            getVerificationPhoto: jest
                .fn()
                .mockReturnValue(of(new Blob()) as any),
        };

        const messageService: jest.Mocked<MessageService> = {
            add: jest.fn(),
            clear: jest.fn(),
            onAdd: of(),
            onClear: of(),
        } as any;

        const confirmationService: jest.Mocked<ConfirmationService> = {
            confirm: jest.fn(),
            close: jest.fn(),
        } as any;

        const sanitizer: jest.Mocked<DomSanitizer> = {
            bypassSecurityTrustUrl: jest.fn((v: any) => v),
        } as any;

        await TestBed.configureTestingModule({
            imports: [AdminVerificationComponent],
            providers: [
                { provide: UserService, useValue: userService },
                { provide: MessageService, useValue: messageService },
                { provide: ConfirmationService, useValue: confirmationService },
                { provide: DomSanitizer, useValue: sanitizer },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminVerificationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should load verification requests on init and clear loading spinner", fakeAsync(() => {
        const requests: VerificationRequestDTO[] = [
            {
                id: 1,
                status: "pending",
                createdAt: new Date().toISOString(),
                user: { id: 10, email: "u@test.com", fullName: "User" } as any,
            },
        ];
        userService.getAllVerificationRequests.mockReturnValue(
            of(requests) as any,
        );

        component.loadVerificationRequests();
        expect(component.isLoading()).toBe(true);

        tick();
        fixture.detectChanges();

        expect(component.isLoading()).toBe(false);
        expect(component.verificationRequests()).toEqual(requests);
        expect(component.filteredRequests().length).toBe(1);
    }));

    it("should stop loading spinner on error and show message", fakeAsync(() => {
        const messageService = TestBed.inject(
            MessageService,
        ) as jest.Mocked<MessageService>;

        userService.getAllVerificationRequests.mockReturnValue(
            throwError(() => new Error("fail")) as any,
        );

        component.loadVerificationRequests();
        expect(component.isLoading()).toBe(true);

        tick();
        fixture.detectChanges();

        expect(component.isLoading()).toBe(false);
        expect(component.verificationRequests()).toEqual([]);
        expect(component.filteredRequests()).toEqual([]);
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "error",
                summary: "Error",
            }),
        );
    }));

    it("applyFilters should filter by status and search term", () => {
        const requests: VerificationRequestDTO[] = [
            {
                id: 1,
                status: "pending",
                createdAt: new Date().toISOString(),
                user: { id: 1, fullName: "Alice", email: "alice@test.com" } as any,
            },
            {
                id: 2,
                status: "verified",
                createdAt: new Date().toISOString(),
                user: { id: 2, fullName: "Bob", email: "bob@test.com" } as any,
            },
        ];
        component.verificationRequests.set(requests);

        component.statusFilter = "pending";
        component.searchTerm = "ali";
        component.applyFilters();

        expect(component.filteredRequests().length).toBe(1);
        expect(component.filteredRequests()[0].id).toBe(1);
    });

    it("openPhotoDialog should set selectedRequest and open dialog", () => {
        const request: VerificationRequestDTO = {
            id: 5,
            status: "pending",
            createdAt: new Date().toISOString(),
            user: { id: 50, email: "p@test.com" } as any,
        };
        component.openPhotoDialog(request);
        expect(component.selectedRequest()).toEqual(request);
        expect(component.showPhotoDialog()).toBe(true);
        expect(userService.getVerificationPhoto).toHaveBeenCalledWith(5);
    });

    it("closeDialogs should reset dialog visibility and selectedRequest", () => {
        component.showPhotoDialog.set(true);
        component.showReviewDialog.set(true);
        component.showRejectionDialog.set(true);
        component.showRevokeDialog.set(true);
        component.selectedRequest.set({ id: 1 } as any);

        component.closeDialogs();

        expect(component.showPhotoDialog()).toBe(false);
        expect(component.showReviewDialog()).toBe(false);
        expect(component.showRejectionDialog()).toBe(false);
        expect(component.showRevokeDialog()).toBe(false);
        expect(component.selectedRequest()).toBeNull();
    });

    it("getStatusLabel and getStatusSeverity should map correctly", () => {
        expect(component.getStatusLabel("pending")).toBe("Pending");
        expect(component.getStatusLabel("verified")).toBe("Verified");
        expect(component.getStatusSeverity("pending")).toBe("warn");
        expect(component.getStatusSeverity("verified")).toBe("success");
    });

    it("canReview and canRevoke should depend on status", () => {
        const pending: VerificationRequestDTO = {
            id: 1,
            status: "pending",
            createdAt: "",
        } as any;
        const verified: VerificationRequestDTO = {
            id: 2,
            status: "verified",
            createdAt: "",
        } as any;

        expect(component.canReview(pending)).toBe(true);
        expect(component.canReview(verified)).toBe(false);
        expect(component.canRevoke(verified)).toBe(true);
        expect(component.canRevoke(pending)).toBe(false);
    });
});

