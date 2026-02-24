import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { of, Subject } from "rxjs";
import { ProfileComponent } from "./profile.component";
import {
    UserService,
    FriendsService,
    WalletService,
    GiftService,
} from "src/typescript-api-client/src/api/api";
import { UserDTO } from "src/typescript-api-client/src/model/models";
import { MessageService, ConfirmationService } from "primeng/api";
import { OnlineStatusService } from "../services/online-status.service";
import { WebsocketService } from "../services/websocket.service";

describe("ProfileComponent", () => {
    let fixture: ComponentFixture<ProfileComponent>;
    let component: ProfileComponent;
    let userService: jest.Mocked<
        Pick<
            UserService,
            | "getUser"
            | "getUserProfile"
            | "getUserPhotos"
            | "getProfilePicture"
            | "getUserById"
            | "getUserPhotosByUserId"
            | "getProfilePictureByUserId"
            | "defaultHeaders"
        >
    >;
    let friendsService: jest.Mocked<Pick<FriendsService, "getAcceptedFriends">>;
    let walletService: jest.Mocked<Pick<WalletService, "deposit">>;
    let giftService: jest.Mocked<Pick<GiftService, "getReceivedGifts">>;
    let router: jest.Mocked<Pick<Router, "navigate">>;
    let routeParamMap: Subject<{ get: (key: string) => string | null }>;

    const mockUser: UserDTO = {
        id: 1,
        email: "user@test.com",
        fullName: "Test User",
        password: "",
        confirmPassword: "",
        gender: "male" as UserDTO.GenderEnum,
        city: "Sofia",
        balance: "100",
    } as UserDTO;

    const mockProfile = {
        bio: "Hello",
        city: "Sofia",
        location: "Sofia, Bulgaria",
        interests: ["music", "travel"],
        appearsInSearches: true,
        dateOfBirth: "1990-01-01",
    };

    beforeEach(async () => {
        routeParamMap = new Subject();
        const activatedRoute = {
            paramMap: routeParamMap.asObservable(),
        };

        userService = {
            getUser: jest.fn().mockReturnValue(of(mockUser)),
            getUserProfile: jest.fn().mockReturnValue(of(mockProfile)),
            getUserPhotos: jest.fn().mockReturnValue(of([])),
            getProfilePicture: jest
                .fn()
                .mockReturnValue(of({ body: new Blob() })),
            getUserById: jest.fn(),
            getUserPhotosByUserId: jest.fn(),
            getProfilePictureByUserId: jest.fn(),
            defaultHeaders: new HttpHeaders(),
        };

        friendsService = {
            getAcceptedFriends: jest.fn().mockReturnValue(of([])),
        };

        walletService = {
            deposit: jest.fn().mockReturnValue(of({ balance: "150" })),
        };

        giftService = {
            getReceivedGifts: jest.fn().mockReturnValue(of([])),
        };

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        };

        const messageService = { add: jest.fn() };
        const confirmationService = {
            confirm: jest.fn((opts) => opts?.accept?.()),
        };
        const onlineStatusService = {
            isOnline: jest.fn().mockReturnValue(false),
        };
        const websocketService = {
            onVerificationStatusChange: jest.fn().mockReturnValue(of()),
        };

        await TestBed.configureTestingModule({
            imports: [ProfileComponent],
            providers: [
                { provide: UserService, useValue: userService },
                { provide: FriendsService, useValue: friendsService },
                { provide: WalletService, useValue: walletService },
                { provide: GiftService, useValue: giftService },
                { provide: Router, useValue: router },
                { provide: ActivatedRoute, useValue: activatedRoute },
                {
                    provide: HttpClient,
                    useValue: { get: jest.fn().mockReturnValue(of([])) },
                },
                { provide: MessageService, useValue: messageService },
                { provide: ConfirmationService, useValue: confirmationService },
                { provide: OnlineStatusService, useValue: onlineStatusService },
                { provide: WebsocketService, useValue: websocketService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should have initial signal state", () => {
        expect(component.currentUser()).toBeNull();
        expect(component.viewingUser()).toBeNull();
        expect(component.userProfile()).toBeNull();
        expect(component.userPhotos()).toEqual([]);
        expect(component.friends()).toEqual([]);
        expect(component.isOwnProfile()).toBe(true);
        expect(component.viewingUserId()).toBeNull();
        expect(component.isLoading()).toBe(false);
        expect(component.balance()).toBe("0");
        expect(component.receivedGifts()).toEqual([]);
        expect(component.activeTabIndex()).toBe(0);
    });

    it("on own profile route should load user, profile, photos, friends, profile picture, gifts", () => {
        routeParamMap.next({ get: () => null });
        fixture.detectChanges();

        expect(component.isOwnProfile()).toBe(true);
        expect(userService.getUser).toHaveBeenCalled();
        expect(userService.getUserProfile).toHaveBeenCalled();
        expect(userService.getUserPhotos).toHaveBeenCalled();
        expect(friendsService.getAcceptedFriends).toHaveBeenCalled();
        expect(userService.getProfilePicture).toHaveBeenCalled();
        expect(giftService.getReceivedGifts).toHaveBeenCalled();
    });

    it("after load should set currentUser and balance from getUser", () => {
        routeParamMap.next({ get: () => null });
        fixture.detectChanges();

        expect(component.currentUser()).toEqual(mockUser);
        expect(component.balance()).toBe("100");
        expect(component.userProfile()).toEqual(mockProfile);
        expect(component.userPhotos()).toEqual([]);
        expect(component.friends()).toEqual([]);
    });

    it("on userId route should set isOwnProfile false and load other user profile", () => {
        const otherUser = { ...mockUser, id: 2, fullName: "Other User" };
        const getUserByIdResponse = {
            user: otherUser,
            profile: mockProfile,
        };
        userService.getUserById.mockReturnValue(
            of(getUserByIdResponse) as unknown as ReturnType<
                UserService["getUserById"]
            >,
        );
        userService.getUserPhotosByUserId.mockReturnValue(
            of([]) as unknown as ReturnType<
                UserService["getUserPhotosByUserId"]
            >,
        );
        userService.getProfilePictureByUserId.mockReturnValue(
            of({ body: new Blob() }) as unknown as ReturnType<
                UserService["getProfilePictureByUserId"]
            >,
        );

        routeParamMap.next({ get: () => "2" });
        fixture.detectChanges();

        expect(component.isOwnProfile()).toBe(false);
        expect(component.viewingUserId()).toBe(2);
        expect(userService.getUserById).toHaveBeenCalledWith(2);
        expect(component.currentUser()).toEqual(otherUser);
        expect(component.userProfile()).toEqual(mockProfile);
    });

    it("getUserInitials should return initials from currentUser", () => {
        component.currentUser.set(mockUser);
        expect(component.getUserInitials()).toBe("TU");
    });

    it("getUserInitials should return U when no currentUser", () => {
        component.currentUser.set(null);
        expect(component.getUserInitials()).toBe("U");
    });

    it("getBalanceAsInteger should return floored balance string", () => {
        component.balance.set("99.9");
        expect(component.getBalanceAsInteger()).toBe("99");
    });

    it("getBalanceAsNumber should return parsed balance", () => {
        component.balance.set("42.5");
        expect(component.getBalanceAsNumber()).toBe(42.5);
    });

    it("getPhotoUrl should return url from photoBlobUrls map", () => {
        const map = new Map<number, string>();
        map.set(1, "blob:http://test/1");
        component.photoBlobUrls.set(map);
        expect(component.getPhotoUrl(1)).toBe("blob:http://test/1");
        expect(component.getPhotoUrl(99)).toBe("");
    });

    it("hasProfilePicture should return true when profilePictureBlobUrl is set", () => {
        component.profilePictureBlobUrl.set(null);
        expect(component.hasProfilePicture()).toBe(false);
        component.profilePictureBlobUrl.set("blob:url");
        expect(component.hasProfilePicture()).toBe(true);
    });

    it("getProfilePictureUrl should return profile picture url", () => {
        component.profilePictureBlobUrl.set("blob:photo");
        expect(component.getProfilePictureUrl()).toBe("blob:photo");
    });

    it("isOnline should use onlineStatusService", () => {
        routeParamMap.next({ get: () => null });
        fixture.detectChanges();
        const onlineStatus = TestBed.inject(
            OnlineStatusService,
        ) as jest.Mocked<OnlineStatusService>;
        onlineStatus.isOnline.mockReturnValue(true);
        component.friends.set([
            {
                friendId: 2,
                user: { id: 2, firstname: "Friend", lastOnline: new Date() },
            },
        ] as any);
        expect(component.isOnline(2)).toBe(true);
    });

    it("openDepositDialog should set showDepositDialog to true", () => {
        expect(component.showDepositDialog()).toBe(false);
        component.openDepositDialog();
        expect(component.showDepositDialog()).toBe(true);
    });

    it("closeDepositDialog should reset deposit state", () => {
        component.showDepositDialog.set(true);
        component.isDepositing.set(true);
        component.depositForm = {
            amount: 10,
            cardNumber: "1234",
            cardHolder: "A",
            expiryMonth: "01",
            expiryYear: "25",
            cvv: "123",
        };
        component.closeDepositDialog();
        expect(component.showDepositDialog()).toBe(false);
        expect(component.isDepositing()).toBe(false);
        expect(component.depositForm.amount).toBeNull();
        expect(component.depositForm.cardNumber).toBe("");
    });

    it("openEditDialog should set editForm and show edit dialog when own profile", () => {
        component.currentUser.set(mockUser);
        component.userProfile.set(mockProfile);
        component.isOwnProfile.set(true);
        component.openEditDialog();
        expect(component.editForm.gender).toBe("male");
        expect(component.editForm.bio).toBe("Hello");
        expect(component.editForm.interests).toEqual(["music", "travel"]);
        expect(component.showEditDialog()).toBe(true);
    });

    it("openEditDialog should not open when not own profile and should show message", () => {
        const messageService = TestBed.inject(
            MessageService,
        ) as jest.Mocked<MessageService>;
        component.isOwnProfile.set(false);
        component.openEditDialog();
        expect(component.showEditDialog()).toBe(false);
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "error",
                detail: "You cannot edit another user's profile",
            }),
        );
    });

    it("addInterest should add trimmed interest to editForm", () => {
        component.editForm = { interests: [] };
        component.newInterest = "  hiking  ";
        component.addInterest();
        expect(component.editForm.interests).toEqual(["hiking"]);
        expect(component.newInterest).toBe("");
    });

    it("addInterest should not duplicate interest", () => {
        component.editForm = { interests: ["music"] };
        component.newInterest = "music";
        component.addInterest();
        expect(component.editForm.interests).toEqual(["music"]);
    });

    it("removeInterest should remove from editForm.interests", () => {
        component.editForm = { interests: ["a", "b", "c"] };
        component.removeInterest("b");
        expect(component.editForm.interests).toEqual(["a", "c"]);
    });

    it("openPhotoDialog should set selectedPhoto and show dialog", () => {
        const photo = { id: 1, name: "p.jpg", likesCount: 0 } as any;
        component.openPhotoDialog(photo);
        expect(component.selectedPhoto()).toEqual(photo);
        expect(component.showPhotoDialog()).toBe(true);
    });

    it("groupedReceivedGifts should return computed grouped array", () => {
        const gifts = [
            {
                senderId: 1,
                giftEmoji: "🎁",
                sender: { id: 1 },
                createdAt: "2024-01-01",
                amount: "10",
            },
            {
                senderId: 1,
                giftEmoji: "🎁",
                sender: { id: 1 },
                createdAt: "2024-01-02",
                amount: "5",
            },
        ] as any[];
        component.receivedGifts.set(gifts);
        const grouped = component.groupedReceivedGifts();
        expect(grouped.length).toBe(1);
        expect(grouped[0].gifts.length).toBe(2);
        expect(grouped[0].totalAmount).toBe("15.00000000");
        expect(grouped[0].giftEmoji).toBe("🎁");
    });

    it("getSenderNameFromSender should return name or Unknown", () => {
        expect(component.getSenderNameFromSender(null)).toBe("Unknown");
        expect(
            component.getSenderNameFromSender({
                firstname: "John",
                lastname: "Doe",
                email: "j@test.com",
            } as any),
        ).toBe("John Doe");
    });

    it("startChat should navigate to conversation", () => {
        component.startChat({ friendId: 3, user: {} } as any);
        expect(router.navigate).toHaveBeenCalledWith(["/chat/conversation", 3]);
    });

    it("startVideoCall should navigate with query params when viewing user", () => {
        component.viewingUserId.set(5);
        component.viewingUser.set({ fullName: "Video User" } as any);
        component.startVideoCall();
        expect(router.navigate).toHaveBeenCalledWith(["/video-call"], {
            queryParams: { recipientId: 5, recipientName: "Video User" },
        });
    });

    it("startVideoCall should show error when no viewing user", () => {
        const messageService = TestBed.inject(
            MessageService,
        ) as jest.Mocked<MessageService>;
        component.viewingUserId.set(null);
        component.startVideoCall();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "error",
                detail: "Unable to start call. User information not available.",
            }),
        );
    });

    it("getVerificationStatusText should return status text", () => {
        expect(component.getVerificationStatusText()).toBe("Not submitted");
        component.verificationStatus.set({
            verificationRequest: { status: "pending" },
        } as any);
        expect(component.getVerificationStatusText()).toBe("Pending Review");
        component.verificationStatus.set({
            verificationRequest: { status: "verified" },
        } as any);
        expect(component.getVerificationStatusText()).toBe("Verified ✓");
    });

    it("getVerificationStatusSeverity should return severity", () => {
        component.verificationStatus.set({
            verificationRequest: { status: "rejected" },
        } as any);
        expect(component.getVerificationStatusSeverity()).toBe("error");
        component.verificationStatus.set({
            verificationRequest: { status: "verified" },
        } as any);
        expect(component.getVerificationStatusSeverity()).toBe("success");
    });

    it("isVerificationPending should return true for pending and in_review", () => {
        component.verificationStatus.set(null);
        expect(component.isVerificationPending()).toBe(false);
        component.verificationStatus.set({
            verificationRequest: { status: "pending" },
        } as any);
        expect(component.isVerificationPending()).toBe(true);
        component.verificationStatus.set({
            verificationRequest: { status: "in_review" },
        } as any);
        expect(component.isVerificationPending()).toBe(true);
    });

    it("should render user name and own profile actions when isOwnProfile", () => {
        routeParamMap.next({ get: () => null });
        fixture.detectChanges();
        component.currentUser.set(mockUser);
        component.isOwnProfile.set(true);
        fixture.detectChanges();

        const nameEl = fixture.nativeElement.querySelector(".user-name");
        expect(nameEl?.textContent).toContain("Test User");
        expect(fixture.nativeElement.textContent).toContain("Edit Profile");
        expect(fixture.nativeElement.textContent).toContain("Add Tokens");
    });

    it("should render Video Call and Send Gift when not own profile", () => {
        component.currentUser.set({ ...mockUser, fullName: "Other" });
        component.isOwnProfile.set(false);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain("Video Call");
        expect(fixture.nativeElement.textContent).toContain("Send Gift");
    });

    it("should render photos tab content with empty state when no photos", () => {
        routeParamMap.next({ get: () => null });
        fixture.detectChanges();
        component.currentUser.set(mockUser);
        component.userPhotos.set([]);
        component.isOwnProfile.set(true);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain("PROFILE IMAGES");
        expect(fixture.nativeElement.textContent).toContain(
            "This gallery is still empty",
        );
    });

    it("should render friends list with @for when friends exist", () => {
        component.isOwnProfile.set(true);
        component.friends.set([
            { friendId: 2, user: { id: 2, firstname: "Alice" } },
            { friendId: 3, user: { id: 3, firstname: "Bob" } },
        ] as any[]);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain("FRIENDS 2");
        expect(fixture.nativeElement.textContent).toContain("Alice");
        expect(fixture.nativeElement.textContent).toContain("Bob");
    });

    it("formatCardNumber should format with spaces", () => {
        component.depositForm = { ...component.depositForm, cardNumber: "" };
        component.formatCardNumber({ target: { value: "4111111111111111" } });
        expect(component.depositForm.cardNumber).toBe("4111 1111 1111 1111");
    });
});
