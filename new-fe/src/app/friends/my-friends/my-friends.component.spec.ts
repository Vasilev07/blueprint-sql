import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";
import { of, Subject } from "rxjs";
import { MyFriendsComponent } from "./my-friends.component";
import { FriendsService } from "src/typescript-api-client/src/api/api";
import { FriendDTO } from "src/typescript-api-client/src/model/models";
import { WebsocketService } from "../../services/websocket.service";
import { PresenceService } from "../../services/presence.service";

const asAcceptedFriendsResponse = (v: unknown) =>
    v as ReturnType<FriendsService["getAcceptedFriends"]>;

function createMockFriend(overrides: Partial<FriendDTO> = {}): FriendDTO {
    return {
        userId: 1,
        friendId: 2,
        status: "ACCEPTED" as FriendDTO.StatusEnum,
        user: {
            id: 1,
            firstname: "Alice",
            lastname: "Smith",
            email: "alice@example.com",
        },
        friend: {
            id: 2,
            firstname: "Bob",
            lastname: "Jones",
            email: "bob@example.com",
        },
        ...overrides,
    } as FriendDTO;
}

describe("MyFriendsComponent", () => {
    let fixture: ComponentFixture<MyFriendsComponent>;
    let component: MyFriendsComponent;
    let friendsService: jest.Mocked<Pick<FriendsService, "getAcceptedFriends">>;
    let websocketService: jest.Mocked<
        Pick<WebsocketService, "onFriendListUpdated">
    >;
    let presenceService: jest.Mocked<Pick<PresenceService, "isOnline">>;

    const mockFriends: FriendDTO[] = [
        createMockFriend({
            userId: 1,
            friendId: 2,
            user: {
                id: 1,
                firstname: "Alice",
                lastname: "Smith",
                email: "alice@example.com",
            },
            friend: {
                id: 2,
                firstname: "Bob",
                lastname: "Jones",
                email: "bob@example.com",
            },
        }),
        createMockFriend({
            userId: 2,
            friendId: 1,
            user: {
                id: 2,
                firstname: "Bob",
                lastname: "Jones",
                email: "bob@example.com",
            },
            friend: {
                id: 1,
                firstname: "Alice",
                lastname: "Smith",
                email: "alice@example.com",
            },
        }),
    ];

    let listUpdated$: Subject<void>;

    beforeEach(async () => {
        friendsService = {
            getAcceptedFriends: jest
                .fn()
                .mockReturnValue(asAcceptedFriendsResponse(of(mockFriends))),
        };

        listUpdated$ = new Subject<void>();
        websocketService = {
            onFriendListUpdated: jest
                .fn()
                .mockReturnValue(listUpdated$.asObservable()),
        };

        presenceService = {
            isOnline: jest.fn().mockReturnValue(false),
        };

        await TestBed.configureTestingModule({
            imports: [MyFriendsComponent],
            providers: [
                { provide: FriendsService, useValue: friendsService },
                { provide: WebsocketService, useValue: websocketService },
                { provide: PresenceService, useValue: presenceService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MyFriendsComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should load friends on init", fakeAsync(() => {
        fixture.detectChanges();
        tick();

        expect(friendsService.getAcceptedFriends).toHaveBeenCalled();
        expect(component.myFriends()).toEqual(mockFriends);
        expect(component.loading()).toBe(false);
    }));

    it("should show loading state with @if when loading", () => {
        const neverEmit$ = new Subject<FriendDTO[]>();
        friendsService.getAcceptedFriends.mockReturnValue(
            asAcceptedFriendsResponse(neverEmit$.asObservable()),
        );
        fixture = TestBed.createComponent(MyFriendsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        const loadingEl =
            fixture.nativeElement.querySelector(".loading-container");
        expect(loadingEl).toBeTruthy();
        expect(loadingEl?.textContent).toContain("Loading friends");
    });

    it("should render empty state with @if when myFriends is empty", fakeAsync(() => {
        friendsService.getAcceptedFriends.mockReturnValue(
            asAcceptedFriendsResponse(of([])),
        );
        fixture = TestBed.createComponent(MyFriendsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        tick();

        const emptyEl = fixture.nativeElement.querySelector(".text-center.p-4");
        expect(emptyEl).toBeTruthy();
        expect(emptyEl?.textContent).toContain("No friends yet");
        expect(fixture.nativeElement.querySelector(".friends-grid")).toBeNull();
    }));

    it("should render friends list with @for when friends exist", fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const grid = fixture.nativeElement.querySelector(".friends-grid");
        expect(grid).toBeTruthy();
        const cards = fixture.nativeElement.querySelectorAll(".friend-card");
        expect(cards.length).toBe(2);
        expect(fixture.nativeElement.textContent).toContain("Alice Smith");
        expect(fixture.nativeElement.textContent).toContain("Bob Jones");
        expect(fixture.nativeElement.textContent).toContain(
            "alice@example.com",
        );
        expect(fixture.nativeElement.textContent).toContain("Friends");
    }));

    it("should reload friends when websocket emits onFriendListUpdated", fakeAsync(() => {
        fixture.detectChanges();
        tick();

        expect(friendsService.getAcceptedFriends).toHaveBeenCalledTimes(1);

        listUpdated$.next();
        tick();

        expect(friendsService.getAcceptedFriends).toHaveBeenCalledTimes(2);
    }));

    it("getFriendDisplayName returns user name when user.id !== currentUserId", () => {
        component.currentUserId.set(2);
        const friend = createMockFriend();
        expect(component.getFriendDisplayName(friend)).toBe("Alice Smith");
    });

    it("getFriendDisplayName returns friend name when friend.id !== currentUserId", () => {
        component.currentUserId.set(1);
        const friend = createMockFriend();
        expect(component.getFriendDisplayName(friend)).toBe("Bob Jones");
    });

    it("getFriendDisplayName returns Unknown Friend when no other user", () => {
        component.currentUserId.set(1);
        const friend = createMockFriend({
            user: {
                id: 1,
                firstname: "Me",
                lastname: "Only",
                email: "me@example.com",
            },
            friend: undefined,
        });
        expect(component.getFriendDisplayName(friend)).toBe("Unknown Friend");
    });

    it("getFriendInitials returns initials from user when user.id !== currentUserId", () => {
        component.currentUserId.set(2);
        const friend = createMockFriend();
        expect(component.getFriendInitials(friend)).toBe("AS");
    });

    it("getFriendInitials returns F when no other user", () => {
        component.currentUserId.set(1);
        const friend = createMockFriend({
            user: {
                id: 1,
                firstname: "A",
                lastname: "B",
                email: "a@b.com",
            },
            friend: undefined,
        });
        expect(component.getFriendInitials(friend)).toBe("F");
    });

    it("getFriendEmail returns email from user when user.id !== currentUserId", () => {
        component.currentUserId.set(2);
        const friend = createMockFriend();
        expect(component.getFriendEmail(friend)).toBe("alice@example.com");
    });

    it("getFriendEmail returns email from friend when friend.id !== currentUserId", () => {
        component.currentUserId.set(1);
        const friend = createMockFriend();
        expect(component.getFriendEmail(friend)).toBe("bob@example.com");
    });

    it("should set currentUserId from token when present", () => {
        const payload = { id: 42 };
        const token = `header.${btoa(JSON.stringify(payload))}.sig`;
        jest.spyOn(Storage.prototype, "getItem").mockReturnValue(token);

        fixture = TestBed.createComponent(MyFriendsComponent);
        component = fixture.componentInstance;

        expect(component.currentUserId()).toBe(42);
    });

    it("should call presenceService.isOnline for each friend email", fakeAsync(() => {
        presenceService.isOnline.mockReturnValue(true);
        fixture.detectChanges();
        tick();

        expect(presenceService.isOnline).toHaveBeenCalledWith(
            "alice@example.com",
        );
        expect(presenceService.isOnline).toHaveBeenCalledWith(
            "bob@example.com",
        );
    }));
});
