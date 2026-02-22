import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Observable, of, Subject } from "rxjs";
import { MessagesComponent } from "./messages.component";
import { MessagesService } from "src/typescript-api-client/src/api/api";
import { AuthService } from "../services/auth.service";
import { WebsocketService } from "../services/websocket.service";
import { PresenceService } from "../services/presence.service";

type TabKey = "unread" | "read" | "vip";

/** Cast mock observable to API return type (Observable<HttpEvent<MessageDTO[]>>). */
const asMessagesResponse = (obs: Observable<unknown>) =>
    obs as ReturnType<MessagesService["findMessagesByTab"]>;

interface MockMessage {
    id: number;
    from: string;
    subject: string;
    content: string;
    createdAt: string;
    attachments?: string[];
    to?: string[];
}

function createMockMessage(overrides: Partial<MockMessage> = {}): MockMessage {
    return {
        id: 1,
        from: "sender@example.com",
        subject: "Test subject",
        content: "Test content",
        createdAt: "2024-01-15T12:00:00Z",
        ...overrides,
    };
}

describe("MessagesComponent", () => {
    let fixture: ComponentFixture<MessagesComponent>;
    let component: MessagesComponent;
    let messagesService: jest.Mocked<
        Pick<
            MessagesService,
            | "findMessagesByTab"
            | "findInboxByEmail"
            | "markAsRead"
            | "archive"
            | "_delete"
        >
    >;
    let authService: jest.Mocked<Pick<AuthService, "getUserEmail">>;
    let websocketService: jest.Mocked<
        Pick<WebsocketService, "subscribeToMessages" | "disconnect">
    >;
    let router: jest.Mocked<Pick<Router, "navigate">>;
    let presenceService: jest.Mocked<Pick<PresenceService, "isOnline">>;

    const mockMessages: MockMessage[] = [
        createMockMessage({ id: 1, from: "a@test.com", subject: "First" }),
        createMockMessage({ id: 2, from: "b@test.com", subject: "Second" }),
    ];

    beforeEach(async () => {
        messagesService = {
            findMessagesByTab: jest
                .fn()
                .mockReturnValue(asMessagesResponse(of(mockMessages))),
            findInboxByEmail: jest
                .fn()
                .mockReturnValue(asMessagesResponse(of(mockMessages))),
            markAsRead: jest.fn().mockReturnValue(of(undefined)),
            archive: jest.fn().mockReturnValue(of(undefined)),
            _delete: jest.fn().mockReturnValue(of(undefined)),
        };

        authService = {
            getUserEmail: jest.fn().mockReturnValue("user@example.com"),
        };

        const messageSubject = new Subject<void>();
        websocketService = {
            subscribeToMessages: jest
                .fn()
                .mockReturnValue(messageSubject.asObservable()),
            disconnect: jest.fn(),
        };

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        };

        presenceService = {
            isOnline: jest.fn().mockReturnValue(false),
        };

        await TestBed.configureTestingModule({
            imports: [MessagesComponent],
            providers: [
                { provide: MessagesService, useValue: messagesService },
                { provide: AuthService, useValue: authService },
                { provide: WebsocketService, useValue: websocketService },
                { provide: Router, useValue: router },
                { provide: HttpClient, useValue: {} },
                { provide: PresenceService, useValue: presenceService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MessagesComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should set currentUserEmail and load messages on init when user is logged in", () => {
        fixture.detectChanges();

        expect(component.currentUserEmail()).toBe("user@example.com");
        expect(messagesService.findMessagesByTab).toHaveBeenCalledWith({
            email: "user@example.com",
            tab: "unread",
        });
        expect(component.messages().length).toBe(2);
        expect(component.loading()).toBe(false);
    });

    it("should not load messages when currentUserEmail is empty", () => {
        authService.getUserEmail.mockReturnValue("");

        fixture.detectChanges();

        expect(component.currentUserEmail()).toBe("");
        expect(messagesService.findMessagesByTab).not.toHaveBeenCalled();
    });

    it("should show loading state while fetching", () => {
        const subject = new Subject<MockMessage[]>();
        messagesService.findMessagesByTab.mockReturnValue(
            asMessagesResponse(subject.asObservable()),
        );

        fixture.detectChanges();

        expect(component.loading()).toBe(true);

        subject.next(mockMessages);
        subject.complete();
        fixture.detectChanges();

        expect(component.loading()).toBe(false);
    });

    it("should render loading UI when loading() is true", () => {
        const subject = new Subject<MockMessage[]>();
        messagesService.findMessagesByTab.mockReturnValue(
            asMessagesResponse(subject.asObservable()),
        );

        fixture.detectChanges();

        const loadingEl = fixture.nativeElement.querySelector(".loading");
        expect(loadingEl).toBeTruthy();
        expect(loadingEl.textContent).toContain("Loading");

        subject.next([]);
        subject.complete();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector(".loading")).toBeNull();
    });

    it("should render empty state when not loading and no messages", () => {
        messagesService.findMessagesByTab.mockReturnValue(
            asMessagesResponse(of([])),
        );

        fixture.detectChanges();

        const emptyEl = fixture.nativeElement.querySelector(".no-messages");
        expect(emptyEl).toBeTruthy();
        expect(emptyEl.textContent).toContain("No Unread Messages");
    });

    it("should render messages list with @for when messages exist", () => {
        fixture.detectChanges();

        const list = fixture.nativeElement.querySelector(".messages-list");
        expect(list).toBeTruthy();

        const items = fixture.nativeElement.querySelectorAll(".message-item");
        expect(items.length).toBe(2);
        expect(fixture.nativeElement.textContent).toContain("First");
        expect(fixture.nativeElement.textContent).toContain("Second");
        expect(fixture.nativeElement.textContent).toContain("a@test.com");
        expect(fixture.nativeElement.textContent).toContain("b@test.com");
    });

    it("should render tabs with @for", () => {
        fixture.detectChanges();

        const tabButtons =
            fixture.nativeElement.querySelectorAll(".tab-button");
        expect(tabButtons.length).toBe(3);
        expect(fixture.nativeElement.textContent).toContain("Unread");
        expect(fixture.nativeElement.textContent).toContain("Read");
        expect(fixture.nativeElement.textContent).toContain("VIP");
    });

    it("should show unread badge when unreadCount > 0 on unread tab", () => {
        messagesService.findMessagesByTab.mockImplementation(
            (body: { tab: TabKey }) =>
                asMessagesResponse(
                    of(body.tab === "unread" ? mockMessages : []),
                ),
        );

        fixture.detectChanges();

        expect(component.unreadCount()).toBe(2);
        const badge = fixture.nativeElement.querySelector(".unread-badge");
        expect(badge).toBeTruthy();
        expect(badge?.textContent).toContain("2");
    });

    it("onTabChange should set activeTab and load messages for that tab", () => {
        fixture.detectChanges();

        component.onTabChange("read");
        fixture.detectChanges();

        expect(component.activeTab()).toBe("read");
        expect(messagesService.findMessagesByTab).toHaveBeenCalledWith({
            email: "user@example.com",
            tab: "read",
        });
    });

    it("composeMessage should navigate to compose", () => {
        fixture.detectChanges();

        component.composeMessage();

        expect(router.navigate).toHaveBeenCalledWith(["/messages/compose"]);
    });

    it("viewMessage should navigate to view with message id", () => {
        fixture.detectChanges();

        component.viewMessage(42);

        expect(router.navigate).toHaveBeenCalledWith(["/messages/view", 42]);
    });

    it("markAsRead should call messagesService.markAsRead", () => {
        const message = createMockMessage({ id: 10 });
        fixture.detectChanges();

        component.markAsRead(message as any);

        expect(messagesService.markAsRead).toHaveBeenCalledWith(10);
    });

    it("archiveMessage should call service and remove message from list", () => {
        fixture.detectChanges();
        expect(component.messages().length).toBe(2);

        component.archiveMessage(component.messages()[0] as any);
        fixture.detectChanges();

        expect(messagesService.archive).toHaveBeenCalledWith(1);
        expect(component.messages().length).toBe(1);
        expect(component.messages()[0].id).toBe(2);
    });

    it("deleteMessage should call service and remove message from list", () => {
        fixture.detectChanges();

        component.deleteMessage(component.messages()[1] as any);
        fixture.detectChanges();

        expect(messagesService._delete).toHaveBeenCalledWith(2);
        expect(component.messages().length).toBe(1);
        expect(component.messages()[0].id).toBe(1);
    });

    it("should subscribe to websocket on init and disconnect on destroy", () => {
        fixture.detectChanges();

        expect(websocketService.subscribeToMessages).toHaveBeenCalled();

        fixture.destroy();

        expect(websocketService.disconnect).toHaveBeenCalled();
    });

    it("should reload messages when websocket emits", () => {
        const messageSubject = new Subject<void>();
        websocketService.subscribeToMessages.mockReturnValue(
            messageSubject.asObservable(),
        );
        messagesService.findMessagesByTab.mockReturnValue(
            asMessagesResponse(of(mockMessages)),
        );

        fixture.detectChanges();
        const initialCalls = (messagesService.findMessagesByTab as jest.Mock)
            .mock.calls.length;

        messageSubject.next();
        fixture.detectChanges();

        expect(
            (messagesService.findMessagesByTab as jest.Mock).mock.calls.length,
        ).toBeGreaterThan(initialCalls);
    });
});
