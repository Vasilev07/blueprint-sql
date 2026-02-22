import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of, Subject, throwError } from "rxjs";
import { MessageService } from "primeng/api";
import { MessageViewComponent } from "./message-view.component";
import { MessagesService } from "src/typescript-api-client/src/api/api";

interface MockMessage {
    id: number;
    from: string;
    subject: string;
    content: string;
    createdAt: string;
    to?: string[];
    attachments?: string[];
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

/** Cast mock observable to API return type for findById (Observable<HttpEvent<MessageDTO>>). */
const asMessageResponse = (obs: unknown) =>
    obs as ReturnType<MessagesService["findById"]>;

describe("MessageViewComponent", () => {
    let fixture: ComponentFixture<MessageViewComponent>;
    let component: MessageViewComponent;
    let messagesService: jest.Mocked<
        Pick<MessagesService, "findById" | "markAsRead" | "archive" | "_delete">
    >;
    let messageService: jest.Mocked<Pick<MessageService, "add">>;
    let router: jest.Mocked<Pick<Router, "navigate">>;

    const mockMessage = createMockMessage({
        id: 42,
        from: "a@test.com",
        subject: "Hello",
        content: "Body text",
        to: ["b@test.com"],
        attachments: ["file1.pdf"],
    });

    beforeEach(async () => {
        messagesService = {
            findById: jest
                .fn()
                .mockReturnValue(asMessageResponse(of(mockMessage))),
            markAsRead: jest.fn().mockReturnValue(of(undefined)),
            archive: jest.fn().mockReturnValue(of(undefined)),
            _delete: jest.fn().mockReturnValue(of(undefined)),
        };

        messageService = {
            add: jest.fn(),
        };

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        };

        await TestBed.configureTestingModule({
            imports: [MessageViewComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get: (key: string) =>
                                    key === "id" ? "42" : null,
                            },
                        },
                    },
                },
                { provide: Router, useValue: router },
                { provide: MessagesService, useValue: messagesService },
                { provide: MessageService, useValue: messageService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageViewComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should load message on init from route id", () => {
        fixture.detectChanges();

        expect(messagesService.findById).toHaveBeenCalledWith(42);
        expect(component.message()).toEqual(mockMessage);
        expect(component.loading()).toBe(false);
        expect(messagesService.markAsRead).toHaveBeenCalledWith(42);
    });

    it("should show loading state while fetching", () => {
        const subject = new Subject<MockMessage>();
        messagesService.findById.mockReturnValue(
            asMessageResponse(subject.asObservable()),
        );

        fixture.detectChanges();

        expect(component.loading()).toBe(true);

        subject.next(mockMessage);
        subject.complete();
        fixture.detectChanges();

        expect(component.loading()).toBe(false);
    });

    it("should render loading UI when loading() is true", () => {
        const subject = new Subject<MockMessage>();
        messagesService.findById.mockReturnValue(
            asMessageResponse(subject.asObservable()),
        );

        fixture.detectChanges();

        const loadingEl = fixture.nativeElement.querySelector(".loading");
        expect(loadingEl).toBeTruthy();
        expect(loadingEl.textContent).toContain("Loading");

        subject.next(mockMessage);
        subject.complete();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector(".loading")).toBeNull();
    });

    it("should render message detail with @if when message is loaded", () => {
        fixture.detectChanges();

        const detail = fixture.nativeElement.querySelector(".message-detail");
        expect(detail).toBeTruthy();
        expect(fixture.nativeElement.textContent).toContain("Hello");
        expect(fixture.nativeElement.textContent).toContain("Body text");
        expect(fixture.nativeElement.textContent).toContain("a@test.com");
        expect(fixture.nativeElement.textContent).toContain("b@test.com");
    });

    it("should render attachments with @for when message has attachments", () => {
        fixture.detectChanges();

        const list = fixture.nativeElement.querySelector(".attachment-list");
        expect(list).toBeTruthy();
        const items =
            fixture.nativeElement.querySelectorAll(".attachment-item");
        expect(items.length).toBe(1);
        expect(fixture.nativeElement.textContent).toContain("file1.pdf");
    });

    it("should show not found when route has no id", () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [MessageViewComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { paramMap: { get: () => null } },
                    },
                },
                { provide: Router, useValue: router },
                { provide: MessagesService, useValue: messagesService },
                { provide: MessageService, useValue: messageService },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(MessageViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(messagesService.findById).not.toHaveBeenCalled();
        const noMsg = fixture.nativeElement.querySelector(".no-message");
        expect(noMsg).toBeTruthy();
        expect(noMsg?.textContent).toContain("Message Not Found");
    });

    it("goBack should navigate to /messages", () => {
        fixture.detectChanges();

        component.goBack();

        expect(router.navigate).toHaveBeenCalledWith(["/messages"]);
    });

    it("archiveMessage should call archive and show toast then go back", () => {
        fixture.detectChanges();

        component.archiveMessage();

        expect(messagesService.archive).toHaveBeenCalledWith(42);
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "success",
                detail: "Message archived",
            }),
        );
        expect(router.navigate).toHaveBeenCalledWith(["/messages"]);
    });

    it("deleteMessage should call _delete and show toast then go back", () => {
        fixture.detectChanges();

        component.deleteMessage();

        expect(messagesService._delete).toHaveBeenCalledWith(42);
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "success",
                detail: "Message deleted",
            }),
        );
        expect(router.navigate).toHaveBeenCalledWith(["/messages"]);
    });

    it("should show error toast when findById fails", () => {
        messagesService.findById.mockReturnValue(
            throwError(() => new Error("Not found")) as ReturnType<
                MessagesService["findById"]
            >,
        );

        fixture.detectChanges();

        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "error",
                summary: "Error",
                detail: "Failed to load message",
            }),
        );
        expect(component.loading()).toBe(false);
        expect(component.message()).toBeNull();
    });
});
