import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import { of, throwError, Subject } from "rxjs";
import { MessageService } from "primeng/api";
import { GiftShopComponent } from "./gift-shop.component";
import {
    GiftService,
    UserService,
    WalletService,
} from "src/typescript-api-client/src/api/api";
import { AuthService } from "../services/auth.service";

const asGetAllResponse = (v: unknown) => v as ReturnType<UserService["getAll"]>;
const asGetUserResponse = (v: unknown) =>
    v as ReturnType<UserService["getUser"]>;
const asSendGiftResponse = (v: unknown) =>
    v as ReturnType<GiftService["sendGift"]>;
const asDepositResponse = (v: unknown) =>
    v as ReturnType<WalletService["deposit"]>;

describe("GiftShopComponent", () => {
    let fixture: ComponentFixture<GiftShopComponent>;
    let component: GiftShopComponent;
    let giftService: jest.Mocked<
        Pick<GiftService, "sendGift" | "defaultHeaders">
    >;
    let userService: jest.Mocked<
        Pick<UserService, "getAll" | "getUser" | "defaultHeaders">
    >;
    let walletService: jest.Mocked<
        Pick<WalletService, "deposit" | "defaultHeaders">
    >;
    let messageService: jest.Mocked<Pick<MessageService, "add">>;
    let authService: jest.Mocked<Pick<AuthService, "getUserId">>;

    const mockUsers = [
        {
            id: 1,
            email: "alice@example.com",
            firstname: "Alice",
            lastname: "Smith",
        },
        {
            id: 2,
            email: "bob@example.com",
            firstname: "Bob",
            lastname: "Jones",
        },
    ];

    const currentUserId = 42;

    beforeEach(async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        userService = {
            getAll: jest
                .fn()
                .mockReturnValue(asGetAllResponse(of({ users: mockUsers }))),
            getUser: jest
                .fn()
                .mockReturnValue(
                    asGetUserResponse(
                        of({ balance: "500", id: currentUserId }),
                    ),
                ),
            defaultHeaders:
                new Map() as unknown as UserService["defaultHeaders"],
        };

        giftService = {
            sendGift: jest
                .fn()
                .mockReturnValue(
                    asSendGiftResponse(of({ senderBalance: 300 })),
                ),
            defaultHeaders:
                new Map() as unknown as GiftService["defaultHeaders"],
        };

        walletService = {
            deposit: jest
                .fn()
                .mockReturnValue(asDepositResponse(of({ balance: "1000" }))),
            defaultHeaders:
                new Map() as unknown as WalletService["defaultHeaders"],
        };

        messageService = {
            add: jest.fn(),
            messageObserver: new Subject(),
            clearObserver: new Subject(),
        } as unknown as jest.Mocked<Pick<MessageService, "add">>;
        authService = { getUserId: jest.fn().mockReturnValue(currentUserId) };

        await TestBed.configureTestingModule({
            imports: [GiftShopComponent],
            providers: [
                { provide: GiftService, useValue: giftService },
                { provide: UserService, useValue: userService },
                { provide: WalletService, useValue: walletService },
                { provide: MessageService, useValue: messageService },
                { provide: AuthService, useValue: authService },
            ],
        })
            .overrideComponent(GiftShopComponent, {
                set: {
                    providers: [
                        { provide: MessageService, useValue: messageService },
                    ],
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(GiftShopComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should have initial state", () => {
        expect(component.availableGifts()).toEqual([]);
        expect(component.selectedGift()).toBeNull();
        expect(component.users()).toEqual([]);
        expect(component.filteredUsers()).toEqual([]);
        expect(component.isLoading()).toBe(false);
        expect(component.isSending()).toBe(false);
        expect(component.showSendGiftDialog()).toBe(false);
        expect(component.balance()).toBe("0");
        expect(component.showDepositDialog()).toBe(false);
        expect(component.isDepositing()).toBe(false);
        expect(component.balanceAsInteger()).toBe("0");
        expect(component.balanceAsNumber()).toBe(0);
    });

    it("should call loadAvailableGifts, loadUsers, loadBalance on init", () => {
        fixture.detectChanges();

        expect(component.availableGifts().length).toBe(8);
        expect(component.availableGifts()[0]).toEqual({
            name: "Flirty Drink",
            emoji: "🍹",
            value: "🍹",
            amount: 100,
        });
        expect(component.isLoading()).toBe(false);

        expect(userService.getAll).toHaveBeenCalledWith(
            1,
            1000,
            "all",
            "recent",
            "",
            "",
            0,
            100,
            "",
            "",
            false,
        );
        expect(authService.getUserId).toHaveBeenCalled();
        expect(userService.getUser).toHaveBeenCalled();
    });

    it("should load users and filter out current user", fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const filtered = mockUsers.filter((u: any) => u.id !== currentUserId);
        expect(component.users()).toEqual(filtered);
        expect(component.filteredUsers()).toEqual(filtered);
    }));

    it("should load balance from getUser", fakeAsync(() => {
        fixture.detectChanges();
        tick();

        expect(component.balance()).toBe("500");
        expect(component.balanceAsInteger()).toBe("500");
    }));

    it("selectGift should set selectedGift, patch form, and open send dialog", () => {
        const gift = {
            name: "Red Rose",
            emoji: "🌹",
            value: "🌹",
            amount: 200,
        };
        component.selectGift(gift);

        expect(component.selectedGift()).toEqual(gift);
        expect(component.giftForm.get("giftEmoji")?.value).toBe("🌹");
        expect(component.giftForm.get("amount")?.value).toBe(200);
        expect(component.giftForm.get("receiverId")?.value).toBeNull();
        expect(component.showSendGiftDialog()).toBe(true);
    });

    it("searchUsers should filter users by firstname, lastname, email", () => {
        component.users.set([...mockUsers]);
        component.filteredUsers.set([...mockUsers]);

        component.searchUsers({ query: "alice" });
        expect(component.filteredUsers().length).toBe(1);
        expect(component.filteredUsers()[0].firstname).toBe("Alice");

        component.searchUsers({ query: "jones" });
        expect(component.filteredUsers().length).toBe(1);
        expect(component.filteredUsers()[0].lastname).toBe("Jones");

        component.searchUsers({ query: "bob@example" });
        expect(component.filteredUsers().length).toBe(1);
        expect(component.filteredUsers()[0].email).toBe("bob@example.com");

        component.searchUsers({ query: "xyz" });
        expect(component.filteredUsers().length).toBe(0);
    });

    it("getUserDisplay should return name or email or Unknown", () => {
        expect(component.getUserDisplay(null)).toBe("");
        expect(
            component.getUserDisplay({
                firstname: "Alice",
                lastname: "Smith",
                email: "a@b.com",
            }),
        ).toBe("Alice Smith");
        expect(
            component.getUserDisplay({
                firstname: "",
                lastname: "",
                email: "x@y.com",
            }),
        ).toBe("x@y.com");
        expect(
            component.getUserDisplay({
                firstname: "",
                lastname: "",
                email: "",
            }),
        ).toBe("Unknown");
    });

    it("onSubmit with invalid form should show validation message", () => {
        component.giftForm.patchValue({
            receiverId: null,
            giftEmoji: null,
            amount: null,
        });
        component.onSubmit();

        expect(messageService.add).toHaveBeenCalledWith({
            severity: "warn",
            summary: "Validation Error",
            detail: "Please fill in all required fields correctly",
        });
        expect(giftService.sendGift).not.toHaveBeenCalled();
    });

    it("onSubmit with valid form (receiverId object) should call sendGift and succeed", fakeAsync(() => {
        component.giftForm.patchValue({
            receiverId: { id: 2, firstname: "Bob", lastname: "Jones" },
            giftEmoji: "🌹",
            amount: 200,
            message: "Hi",
        });
        component.balance.set("500");

        component.onSubmit();
        tick();

        expect(component.isSending()).toBe(false);
        expect(giftService.sendGift).toHaveBeenCalled();
        const callArg = (giftService.sendGift as jest.Mock).mock.calls[0][0];
        expect(callArg.receiverId).toBe(2);
        expect(callArg.amount).toBe("200");
        expect(component.balance()).toBe("300");
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "success",
                summary: "Success",
            }),
        );
        expect(component.showSendGiftDialog()).toBe(false);
        expect(component.selectedGift()).toBeNull();
    }));

    it("onSubmit sendGift error should show error and set isSending false", fakeAsync(() => {
        giftService.sendGift.mockReturnValue(
            asSendGiftResponse(
                throwError(() => ({
                    error: { message: "Insufficient balance" },
                })),
            ),
        );
        component.giftForm.patchValue({
            receiverId: 2,
            giftEmoji: "🌹",
            amount: 200,
        });
        component.onSubmit();
        tick();

        expect(component.isSending()).toBe(false);
        expect(messageService.add).toHaveBeenCalledWith({
            severity: "error",
            summary: "Error",
            detail: "Insufficient balance",
        });
    }));

    it("closeSendGiftDialog should reset dialog and form", () => {
        component.selectedGift.set({
            name: "Rose",
            emoji: "🌹",
            value: "🌹",
            amount: 200,
        });
        component.showSendGiftDialog.set(true);
        component.giftForm.patchValue({
            receiverId: 1,
            giftEmoji: "🌹",
            amount: 200,
        });

        component.closeSendGiftDialog();

        expect(component.showSendGiftDialog()).toBe(false);
        expect(component.selectedGift()).toBeNull();
        expect(component.giftForm.get("receiverId")?.value).toBeNull();
    });

    it("hasSufficientBalance and getBalanceAfterSending should use balance", () => {
        component.balance.set("500");
        expect(component.hasSufficientBalance(200)).toBe(true);
        expect(component.hasSufficientBalance(500)).toBe(true);
        expect(component.hasSufficientBalance(501)).toBe(false);
        expect(component.getBalanceAfterSending(200)).toBe(300);
    });

    it("openDepositDialog and closeDepositDialog should toggle state", () => {
        component.openDepositDialog();
        expect(component.showDepositDialog()).toBe(true);

        component.depositForm = {
            amount: 100,
            cardNumber: "1234",
            cardHolder: "A",
            expiryMonth: "12",
            expiryYear: "25",
            cvv: "123",
        };
        component.closeDepositDialog();
        expect(component.showDepositDialog()).toBe(false);
        expect(component.isDepositing()).toBe(false);
        expect(component.depositForm.amount).toBeNull();
        expect(component.depositForm.cardNumber).toBe("");
    });

    it("formatCardNumber should format digits in groups of 4", () => {
        const event = {
            target: { value: "4111111111111111" },
        };
        component.formatCardNumber(event);
        expect(component.depositForm.cardNumber).toBe("4111 1111 1111 1111");

        component.formatCardNumber({
            target: { value: "4111 1111 1111 1111" },
        });
        expect(component.depositForm.cardNumber).toBe("4111 1111 1111 1111");
    });

    it("submitDeposit with invalid amount should show validation and not call API", () => {
        component.depositForm.amount = 0;
        component.submitDeposit();
        expect(messageService.add).toHaveBeenCalledWith({
            severity: "warn",
            summary: "Validation",
            detail: "Enter a positive amount",
        });
        expect(walletService.deposit).not.toHaveBeenCalled();

        (messageService.add as jest.Mock).mockClear();
        component.depositForm.amount = null;
        component.submitDeposit();
        expect(messageService.add).toHaveBeenCalled();
        expect(walletService.deposit).not.toHaveBeenCalled();
    });

    it("submitDeposit success should update balance and close dialog", fakeAsync(() => {
        component.depositForm.amount = 100;
        component.balance.set("500");
        component.showDepositDialog.set(true);

        component.submitDeposit();
        tick();

        expect(walletService.deposit).toHaveBeenCalledWith({
            amount: "100",
            currency: "USD",
            paymentMethod: "card",
        });
        expect(component.balance()).toBe("1000");
        expect(component.isDepositing()).toBe(false);
        expect(component.showDepositDialog()).toBe(false);
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "success",
                summary: "Success",
            }),
        );
    }));

    it("submitDeposit error should show error and set isDepositing false", fakeAsync(() => {
        walletService.deposit.mockReturnValue(
            asDepositResponse(
                throwError(() => ({ error: { message: "Card declined" } })),
            ),
        );
        component.depositForm.amount = 100;
        component.submitDeposit();
        tick();

        expect(component.isDepositing()).toBe(false);
        expect(messageService.add).toHaveBeenCalledWith({
            severity: "error",
            summary: "Error",
            detail: "Card declined",
        });
    }));
});
