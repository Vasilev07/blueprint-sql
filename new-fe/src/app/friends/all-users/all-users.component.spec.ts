import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { MessageService } from "primeng/api";
import { AllUsersComponent } from "./all-users.component";
import {
    UserService,
    FriendsService,
} from "src/typescript-api-client/src/api/api";
import { UserDTO } from "src/typescript-api-client/src/model/models";
import { WebsocketService } from "../../services/websocket.service";

const asGetAllResponse = (v: unknown) => v as ReturnType<UserService["getAll"]>;
const asBatchStatusResponse = (v: unknown) =>
    v as ReturnType<FriendsService["getBatchFriendshipStatuses"]>;
const asSendRequestResponse = (v: unknown) =>
    v as ReturnType<FriendsService["sendFriendRequest"]>;

function createMockUser(overrides: Partial<UserDTO> = {}): UserDTO {
    return {
        id: 1,
        email: "alice@example.com",
        fullName: "Alice Smith",
        ...overrides,
    } as UserDTO;
}

describe("AllUsersComponent", () => {
    let fixture: ComponentFixture<AllUsersComponent>;
    let component: AllUsersComponent;
    let userService: jest.Mocked<
        Pick<UserService, "getAll" | "defaultHeaders">
    >;
    let friendsService: jest.Mocked<
        Pick<
            FriendsService,
            | "getBatchFriendshipStatuses"
            | "sendFriendRequest"
            | "defaultHeaders"
        >
    >;
    let messageService: jest.Mocked<Pick<MessageService, "add">>;
    let websocketService: jest.Mocked<
        Pick<WebsocketService, "onFriendRequestUpdated" | "onFriendListUpdated">
    >;

    const mockUsers: UserDTO[] = [
        createMockUser({
            id: 1,
            email: "alice@example.com",
            fullName: "Alice Smith",
        }),
        createMockUser({
            id: 2,
            email: "bob@example.com",
            fullName: "Bob Jones",
        }),
        createMockUser({
            id: 3,
            email: "charlie@example.com",
            fullName: "Charlie Brown",
        }),
    ];

    let friendRequestUpdated$: Subject<void>;
    let friendListUpdated$: Subject<void>;

    beforeEach(async () => {
        userService = {
            getAll: jest.fn().mockReturnValue(
                asGetAllResponse(
                    of({
                        users: mockUsers,
                    }),
                ),
            ),
            defaultHeaders: new Map() as unknown as UserService["defaultHeaders"],
        };

        friendsService = {
            getBatchFriendshipStatuses: jest.fn().mockReturnValue(
                asBatchStatusResponse(
                    of({
                        "1": "none",
                        "2": "accepted",
                        "3": "pending",
                    } as Record<string, string>),
                ),
            ),
            sendFriendRequest: jest
                .fn()
                .mockReturnValue(asSendRequestResponse(of(undefined))),
            defaultHeaders: new Map() as unknown as FriendsService["defaultHeaders"],
        };

        messageService = {
            add: jest.fn(),
        };

        friendRequestUpdated$ = new Subject<void>();
        friendListUpdated$ = new Subject<void>();
        websocketService = {
            onFriendRequestUpdated: jest
                .fn()
                .mockReturnValue(friendRequestUpdated$.asObservable()),
            onFriendListUpdated: jest
                .fn()
                .mockReturnValue(friendListUpdated$.asObservable()),
        };

        await TestBed.configureTestingModule({
            imports: [AllUsersComponent],
            providers: [
                { provide: UserService, useValue: userService },
                { provide: FriendsService, useValue: friendsService },
                { provide: MessageService, useValue: messageService },
                { provide: WebsocketService, useValue: websocketService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AllUsersComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should load users and friendship statuses on init", fakeAsync(() => {
        fixture.detectChanges();
        tick();

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
        expect(friendsService.getBatchFriendshipStatuses).toHaveBeenCalled();
        expect(component.users()).toEqual(mockUsers);
        expect(component.loading()).toBe(false);
        expect(component.friendRequests().get(1)).toBe("none");
        expect(component.friendRequests().get(2)).toBe("accepted");
        expect(component.friendRequests().get(3)).toBe("pending");
    }));

    it("should show loading overlay with @if when loading", () => {
        fixture.detectChanges();

        const overlay = fixture.nativeElement.querySelector(
            ".p-datatable-loading-overlay",
        );
        expect(overlay).toBeTruthy();
    });

    it("should render empty state with @empty when users is empty", fakeAsync(() => {
        userService.getAll.mockReturnValue(asGetAllResponse(of({ users: [] })));
        friendsService.getBatchFriendshipStatuses.mockReturnValue(
            asBatchStatusResponse(of({})),
        );
        fixture = TestBed.createComponent(AllUsersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        tick();

        const emptyRow = fixture.nativeElement.querySelector(".text-center");
        expect(emptyRow).toBeTruthy();
        expect(emptyRow?.textContent).toContain("No users found.");
    }));

    it("should render user list with @for when users exist", fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const rows = fixture.nativeElement.querySelectorAll(
            ".p-datatable-table tbody tr",
        );
        expect(rows.length).toBe(3);
        expect(fixture.nativeElement.textContent).toContain("Alice Smith");
        expect(fixture.nativeElement.textContent).toContain("Bob Jones");
        expect(fixture.nativeElement.textContent).toContain("Charlie Brown");
        expect(fixture.nativeElement.textContent).toContain(
            "alice@example.com",
        );
        expect(fixture.nativeElement.textContent).toContain("bob@example.com");
    }));

    it("should show Add Friend for none status, Friends for accepted, Request Sent for pending", fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain("Add Friend");
        expect(fixture.nativeElement.textContent).toContain("Friends");
        expect(fixture.nativeElement.textContent).toContain("Request Sent");
    }));

    it("should set currentUserId from token when present", () => {
        const payload = { id: 99 };
        const token = `header.${btoa(JSON.stringify(payload))}.sig`;
        jest.spyOn(Storage.prototype, "getItem").mockReturnValue(token);

        fixture = TestBed.createComponent(AllUsersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.currentUserId()).toBe(99);
    });

    it("getButtonClass returns correct class for each status", () => {
        component.friendRequests.set(
            new Map([
                [1, "pending"],
                [2, "accepted"],
                [3, "blocked"],
                [4, "none"],
            ]),
        );
        expect(component.getButtonClass(1)).toBe("p-button-warning");
        expect(component.getButtonClass(2)).toBe("p-button-success");
        expect(component.getButtonClass(3)).toBe("p-button-danger");
        expect(component.getButtonClass(4)).toBe("p-button-primary");
        expect(component.getButtonClass(999)).toBe("p-button-primary");
    });

    it("getButtonLabel returns correct label for each status", () => {
        component.friendRequests.set(
            new Map([
                [1, "pending"],
                [2, "accepted"],
                [3, "blocked"],
                [4, "none"],
            ]),
        );
        expect(component.getButtonLabel(1)).toBe("Request Sent");
        expect(component.getButtonLabel(2)).toBe("Friends");
        expect(component.getButtonLabel(3)).toBe("Blocked");
        expect(component.getButtonLabel(4)).toBe("Add Friend");
        expect(component.getButtonLabel(999)).toBe("Add Friend");
    });

    it("sendFriendRequest should not call API when userId is current user", () => {
        component.currentUserId.set(5);
        component.sendFriendRequest(5);

        expect(friendsService.sendFriendRequest).not.toHaveBeenCalled();
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "warn",
                summary: "Invalid Action",
                detail: "Cannot send friend request to yourself",
            }),
        );
    });

    it("sendFriendRequest should not call API when userId is falsy", () => {
        component.sendFriendRequest(0);
        expect(friendsService.sendFriendRequest).not.toHaveBeenCalled();
    });

    it("sendFriendRequest should call API and update friendRequests on success", fakeAsync(() => {
        component.currentUserId.set(1);
        component.users.set(mockUsers);
        component.friendRequests.set(new Map());

        component.sendFriendRequest(2);
        tick();

        expect(friendsService.sendFriendRequest).toHaveBeenCalledWith(2);
        expect(component.friendRequests().get(2)).toBe("pending");
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "success",
                summary: "Success",
                detail: "Friend request sent!",
            }),
        );
    }));

    it("sendFriendRequest should show error toast on API failure", fakeAsync(() => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        friendsService.sendFriendRequest.mockReturnValue(
            asSendRequestResponse(
                throwError(() => ({ error: { message: "Already friends" } })),
            ),
        );
        component.currentUserId.set(1);
        component.sendFriendRequest(2);
        tick();

        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "warn",
                summary: "Cannot Send Request",
            }),
        );
        consoleSpy.mockRestore();
    }));

    it("should reload friendship statuses when websocket emits onFriendRequestUpdated", fakeAsync(() => {
        fixture.detectChanges();
        tick();
        expect(friendsService.getBatchFriendshipStatuses).toHaveBeenCalledTimes(
            1,
        );

        friendRequestUpdated$.next();
        tick();

        expect(friendsService.getBatchFriendshipStatuses).toHaveBeenCalledTimes(
            2,
        );
    }));

    it("should reload friendship statuses when websocket emits onFriendListUpdated", fakeAsync(() => {
        fixture.detectChanges();
        tick();
        expect(friendsService.getBatchFriendshipStatuses).toHaveBeenCalledTimes(
            1,
        );

        friendListUpdated$.next();
        tick();

        expect(friendsService.getBatchFriendshipStatuses).toHaveBeenCalledTimes(
            2,
        );
    }));

    it("should show error toast when loadUsers fails", fakeAsync(() => {
        userService.getAll.mockReturnValue(
            asGetAllResponse(throwError(() => new Error("Network error"))),
        );
        fixture = TestBed.createComponent(AllUsersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        tick();

        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "error",
                summary: "Error",
                detail: "Failed to load users",
            }),
        );
        expect(component.loading()).toBe(false);
    }));

    it("should apply auth headers when id_token is in localStorage", () => {
        const payload = { id: 1 };
        const token = `header.${btoa(JSON.stringify(payload))}.sig`;
        jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) =>
            key === "id_token" ? token : null,
        );

        fixture = TestBed.createComponent(AllUsersComponent);
        fixture.detectChanges();

        expect(userService.defaultHeaders.get("Authorization")).toBe(
            `Bearer ${token}`,
        );
        expect(friendsService.defaultHeaders.get("Authorization")).toBe(
            `Bearer ${token}`,
        );
    });
});
