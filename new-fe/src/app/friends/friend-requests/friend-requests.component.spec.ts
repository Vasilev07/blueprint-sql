import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { MessageService } from "primeng/api";
import { FriendRequestsComponent } from "./friend-requests.component";
import { FriendsService } from "src/typescript-api-client/src/api/api";
import { FriendDTO } from "src/typescript-api-client/src/model/models";
import { WebsocketService } from "../../services/websocket.service";
import { PresenceService } from "../../services/presence.service";

const asIncomingResponse = (v: unknown) =>
    v as ReturnType<FriendsService["getIncomingRequests"]>;
const asRespondResponse = (v: unknown) =>
    v as ReturnType<FriendsService["respondToRequest"]>;

function createMockRequest(overrides: Partial<FriendDTO> = {}): FriendDTO {
    return {
        userId: 1,
        friendId: 1,
        status: "PENDING" as FriendDTO.StatusEnum,
        user: {
            id: 1,
            firstname: "Jane",
            lastname: "Doe",
            email: "jane@example.com",
        },
        ...overrides,
    } as FriendDTO;
}

describe("FriendRequestsComponent", () => {
    let fixture: ComponentFixture<FriendRequestsComponent>;
    let component: FriendRequestsComponent;
    let friendsService: jest.Mocked<
        Pick<
            FriendsService,
            "getIncomingRequests" | "respondToRequest" | "defaultHeaders"
        >
    >;
    let messageService: jest.Mocked<Pick<MessageService, "add">>;
    let websocketService: jest.Mocked<
        Pick<WebsocketService, "onFriendRequestCreated">
    >;
    let presenceService: jest.Mocked<Pick<PresenceService, "isOnline">>;

    const mockRequests: FriendDTO[] = [
        createMockRequest({
            userId: 1,
            friendId: 1,
            user: {
                id: 1,
                firstname: "Jane",
                lastname: "Doe",
                email: "jane@example.com",
            },
        }),
        createMockRequest({
            userId: 2,
            friendId: 2,
            user: {
                id: 2,
                firstname: "John",
                lastname: "Smith",
                email: "john@example.com",
            },
        }),
    ];

    beforeEach(async () => {
        friendsService = {
            getIncomingRequests: jest
                .fn()
                .mockReturnValue(asIncomingResponse(of(mockRequests))),
            respondToRequest: jest
                .fn()
                .mockReturnValue(asRespondResponse(of(undefined))),
            defaultHeaders:
                new Headers() as unknown as FriendsService["defaultHeaders"],
        };

        messageService = {
            add: jest.fn(),
        };

        const requestCreated$ = new Subject<void>();
        websocketService = {
            onFriendRequestCreated: jest
                .fn()
                .mockReturnValue(requestCreated$.asObservable()),
        };

        presenceService = {
            isOnline: jest.fn().mockReturnValue(false),
        };

        await TestBed.configureTestingModule({
            imports: [FriendRequestsComponent],
            providers: [
                { provide: FriendsService, useValue: friendsService },
                { provide: MessageService, useValue: messageService },
                { provide: WebsocketService, useValue: websocketService },
                { provide: PresenceService, useValue: presenceService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FriendRequestsComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should load incoming requests on init and emit request count", fakeAsync(() => {
        const incoming$ = new Subject<FriendDTO[]>();
        friendsService.getIncomingRequests.mockReturnValue(
            asIncomingResponse(incoming$.asObservable()),
        );
        fixture = TestBed.createComponent(FriendRequestsComponent);
        component = fixture.componentInstance;

        const emitted: number[] = [];
        component.requestCountChange.subscribe((count) => emitted.push(count));

        fixture.detectChanges();
        incoming$.next(mockRequests);
        incoming$.complete();
        tick();

        expect(friendsService.getIncomingRequests).toHaveBeenCalled();
        expect(component.incomingRequests()).toEqual(mockRequests);
        expect(emitted).toContain(2);
    }));

    it("should render empty state with @if when incomingRequests is empty", fakeAsync(() => {
        friendsService.getIncomingRequests.mockReturnValue(
            asIncomingResponse(of([])),
        );
        fixture = TestBed.createComponent(FriendRequestsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        tick();

        const emptyEl = fixture.nativeElement.querySelector(".text-center.p-4");
        expect(emptyEl).toBeTruthy();
        expect(emptyEl?.textContent).toContain("No pending friend requests");
        expect(
            fixture.nativeElement.querySelector(".friend-requests-list"),
        ).toBeNull();
    }));

    it("should render list with @for when incoming requests exist", () => {
        fixture.detectChanges();

        const list = fixture.nativeElement.querySelector(
            ".friend-requests-list",
        );
        expect(list).toBeTruthy();
        const items = fixture.nativeElement.querySelectorAll(
            ".friend-request-item",
        );
        expect(items.length).toBe(2);
        expect(fixture.nativeElement.textContent).toContain("Jane Doe");
        expect(fixture.nativeElement.textContent).toContain("John Smith");
        expect(fixture.nativeElement.textContent).toContain("jane@example.com");
        expect(fixture.nativeElement.textContent).toContain("Accept");
        expect(fixture.nativeElement.textContent).toContain("Decline");
    });

    it("should call acceptFriendRequest and refresh list on success", fakeAsync(() => {
        friendsService.respondToRequest.mockReturnValue(
            asRespondResponse(of(undefined)),
        );
        friendsService.getIncomingRequests.mockReturnValueOnce(
            asIncomingResponse(of([mockRequests[0]])),
        );

        fixture.detectChanges();
        tick();
        const acceptBtn =
            fixture.nativeElement.querySelector(".p-button-success");
        expect(acceptBtn).toBeTruthy();
        (acceptBtn as HTMLElement).click();
        tick();
        fixture.detectChanges();

        expect(friendsService.respondToRequest).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ status: "accepted" }),
        );
        expect(friendsService.getIncomingRequests).toHaveBeenCalledTimes(2);
        expect(component.incomingRequests()).toHaveLength(1);
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "success",
                detail: "Friend request accepted!",
            }),
        );
    }));

    it("should call declineFriendRequest and refresh list on success", fakeAsync(() => {
        friendsService.respondToRequest.mockReturnValue(
            asRespondResponse(of(undefined)),
        );
        friendsService.getIncomingRequests.mockReturnValueOnce(
            asIncomingResponse(of([mockRequests[1]])),
        );

        fixture.detectChanges();
        tick();
        const declineBtns =
            fixture.nativeElement.querySelectorAll(".p-button-danger");
        expect(declineBtns.length).toBeGreaterThanOrEqual(1);
        (declineBtns[0] as HTMLElement).click();
        tick();
        fixture.detectChanges();

        expect(friendsService.respondToRequest).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ status: "blocked" }),
        );
        expect(friendsService.getIncomingRequests).toHaveBeenCalledTimes(2);
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "info",
                detail: "Friend request declined",
            }),
        );
    }));

    it("should show error toast when accept fails", fakeAsync(() => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        friendsService.getIncomingRequests.mockReturnValue(
            asIncomingResponse(of(mockRequests)),
        );
        friendsService.respondToRequest.mockReturnValue(
            asRespondResponse(throwError(() => new Error("Network error"))),
        );

        fixture.detectChanges();
        tick();
        const acceptBtn =
            fixture.nativeElement.querySelector(".p-button-success");
        (acceptBtn as HTMLElement).click();
        tick();
        fixture.detectChanges();

        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "error",
                detail: "Failed to accept friend request",
            }),
        );
        consoleSpy.mockRestore();
    }));

    it("getUserFullName returns full name when user has firstname and lastname", () => {
        expect(
            component.getUserFullName({
                firstname: "Alice",
                lastname: "Brown",
            }),
        ).toBe("Alice Brown");
    });

    it("getUserFullName returns Unknown User when user is missing or incomplete", () => {
        expect(component.getUserFullName(null)).toBe("Unknown User");
        expect(component.getUserFullName(undefined)).toBe("Unknown User");
        expect(component.getUserFullName({})).toBe("Unknown User");
        expect(component.getUserFullName({ firstname: "Only" })).toBe(
            "Unknown User",
        );
    });

    it("getUserInitials returns initials when user has firstname and lastname", () => {
        expect(
            component.getUserInitials({
                firstname: "Alice",
                lastname: "Brown",
            }),
        ).toBe("AB");
    });

    it("getUserInitials returns U when user is missing or incomplete", () => {
        expect(component.getUserInitials(null)).toBe("U");
        expect(component.getUserInitials(undefined)).toBe("U");
        expect(component.getUserInitials({})).toBe("U");
    });

    it("should apply presence-dot online/offline based on presenceService.isOnline", () => {
        presenceService.isOnline.mockImplementation(
            (email) => email === "jane@example.com",
        );
        fixture.detectChanges();

        const dots = fixture.nativeElement.querySelectorAll(".presence-dot");
        expect(dots.length).toBe(2);
        expect(presenceService.isOnline).toHaveBeenCalledWith(
            "jane@example.com",
        );
        expect(presenceService.isOnline).toHaveBeenCalledWith(
            "john@example.com",
        );
    });
});
