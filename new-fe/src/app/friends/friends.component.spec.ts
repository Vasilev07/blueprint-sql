import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, Subject } from "rxjs";
import { FriendsComponent } from "./friends.component";
import { AuthService } from "../services/auth.service";
import {
    UserService,
    FriendsService,
} from "src/typescript-api-client/src/api/api";
import { MessageService, ConfirmationService } from "primeng/api";
import { WebsocketService } from "../services/websocket.service";
import { PresenceService } from "../services/presence.service";

describe("FriendsComponent", () => {
    let fixture: ComponentFixture<FriendsComponent>;
    let component: FriendsComponent;
    let authService: jest.Mocked<Pick<AuthService, "getUserEmail">>;

    beforeEach(async () => {
        authService = {
            getUserEmail: jest.fn().mockReturnValue("user@example.com"),
        };

        const wsSubject = new Subject<void>();
        const mockWebsocket = {
            onFriendRequestUpdated: () => of(),
            onFriendListUpdated: () => of(),
            onFriendRequestCreated: () => wsSubject.asObservable(),
        };
        const mockFriendsService = {
            getIncomingRequests: jest.fn().mockReturnValue(of([])),
            getBatchFriendshipStatuses: jest.fn().mockReturnValue(of({})),
            getAcceptedFriends: jest.fn().mockReturnValue(of([])),
            sendFriendRequest: jest.fn().mockReturnValue(of(undefined)),
            respondToRequest: jest.fn().mockReturnValue(of(undefined)),
            defaultHeaders: new Map(),
        };
        const mockUserService = {
            getAll: jest.fn().mockReturnValue(of({ users: [] })),
            defaultHeaders: new Map(),
        };

        await TestBed.configureTestingModule({
            imports: [FriendsComponent],
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: UserService, useValue: mockUserService },
                { provide: FriendsService, useValue: mockFriendsService },
                MessageService,
                ConfirmationService,
                { provide: WebsocketService, useValue: mockWebsocket },
                {
                    provide: PresenceService,
                    useValue: { isOnline: jest.fn().mockReturnValue(false) },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FriendsComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should set currentUserEmail from AuthService on init", () => {
        fixture.detectChanges();
        expect(authService.getUserEmail).toHaveBeenCalled();
        expect(component.currentUserEmail()).toBe("user@example.com");
    });

    it("should show user email in header when currentUserEmail is set", () => {
        fixture.detectChanges();
        const userEl = fixture.nativeElement.querySelector(".tabbar-user");
        expect(userEl).toBeTruthy();
        expect(userEl?.textContent).toContain("user@example.com");
    });

    it("should not show tabbar-user when currentUserEmail is empty", () => {
        authService.getUserEmail.mockReturnValue("");
        fixture = TestBed.createComponent(FriendsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        const userEl = fixture.nativeElement.querySelector(".tabbar-user");
        expect(userEl).toBeFalsy();
    });

    it("should set activeTab from onTabChange", () => {
        expect(component.activeTab()).toBe("all");
        component.onTabChange("requests");
        expect(component.activeTab()).toBe("requests");
        component.onTabChange("friends");
        expect(component.activeTab()).toBe("friends");
        component.onTabChange(undefined);
        expect(component.activeTab()).toBe("all");
    });

    it("should set incomingRequestsCount from onRequestCountChange", () => {
        expect(component.incomingRequestsCount()).toBe(0);
        component.onRequestCountChange(3);
        expect(component.incomingRequestsCount()).toBe(3);
        component.onRequestCountChange(0);
        expect(component.incomingRequestsCount()).toBe(0);
    });

    it("should show tab badge when incomingRequestsCount > 0", () => {
        component.incomingRequestsCount.set(5);
        fixture.detectChanges();
        const badge = fixture.nativeElement.querySelector(".tab-badge");
        expect(badge).toBeTruthy();
        expect(badge?.textContent).toContain("5");
    });

    it("should not show tab badge when incomingRequestsCount is 0", () => {
        component.incomingRequestsCount.set(0);
        fixture.detectChanges();
        const badge = fixture.nativeElement.querySelector(".tab-badge");
        expect(badge).toBeFalsy();
    });

    it("should render card with tabbar and Friends title", () => {
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector(".card")).toBeTruthy();
        expect(
            fixture.nativeElement.querySelector(".tabbar-title")?.textContent,
        ).toContain("Friends");
        expect(fixture.nativeElement.querySelector("p-tabs")).toBeTruthy();
    });
});
