import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { MessageService } from "primeng/api";
import { MessageComposeComponent } from "./message-compose.component";
import { MessagesService } from "src/typescript-api-client/src/api/api";
import { UserService } from "src/typescript-api-client/src/api/api";
import { AuthService } from "../services/auth.service";
import { UserDTO } from "src/typescript-api-client/src/model/models";

const mockUsers: UserDTO[] = [
    { id: 1, email: "a@test.com" } as UserDTO,
    { id: 2, email: "b@test.com" } as UserDTO,
];

/** Cast mock observable to API return type for getAll. */
const asUserListResponse = (obs: unknown) =>
    obs as ReturnType<UserService["getAll"]>;

/** Cast mock observable to API return type for create. */
const asCreateResponse = (obs: unknown) =>
    obs as ReturnType<MessagesService["create"]>;

describe("MessageComposeComponent", () => {
    let fixture: ComponentFixture<MessageComposeComponent>;
    let component: MessageComposeComponent;
    let userService: jest.Mocked<Pick<UserService, "getAll">>;
    let messagesService: jest.Mocked<Pick<MessagesService, "create">>;
    let authService: jest.Mocked<
        Pick<AuthService, "getUserId" | "getUserEmail">
    >;
    let messageService: jest.Mocked<Pick<MessageService, "add">>;
    let router: jest.Mocked<Pick<Router, "navigate">>;

    beforeEach(async () => {
        userService = {
            getAll: jest
                .fn()
                .mockReturnValue(asUserListResponse(of({ users: mockUsers }))),
        };

        messagesService = {
            create: jest.fn().mockReturnValue(asCreateResponse(of(undefined))),
        };

        authService = {
            getUserId: jest.fn().mockReturnValue(100),
            getUserEmail: jest.fn().mockReturnValue("me@test.com"),
        };

        messageService = {
            add: jest.fn(),
        };

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        };

        await TestBed.configureTestingModule({
            imports: [MessageComposeComponent],
            providers: [
                { provide: UserService, useValue: userService },
                { provide: MessagesService, useValue: messagesService },
                { provide: AuthService, useValue: authService },
                { provide: MessageService, useValue: messageService },
                { provide: Router, useValue: router },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageComposeComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should set currentUserId and load users on init", () => {
        fixture.detectChanges();

        expect(authService.getUserId).toHaveBeenCalled();
        expect(component.currentUserId()).toBe(100);
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
        expect(component.users()).toEqual(mockUsers);
    });

    it("isFormValid should be false when recipients, subject or content are empty", () => {
        fixture.detectChanges();

        expect(component.isFormValid()).toBe(false);

        component.selectedRecipients.set(["a@test.com"]);
        fixture.detectChanges();
        expect(component.isFormValid()).toBe(false);

        component.subject.set("Hi");
        component.content.set("Body");
        fixture.detectChanges();
        expect(component.isFormValid()).toBe(true);
    });

    it("isFormValid should be false when subject or content are only whitespace", () => {
        component.selectedRecipients.set(["a@test.com"]);
        component.subject.set("  ");
        component.content.set("Body");
        fixture.detectChanges();
        expect(component.isFormValid()).toBe(false);

        component.subject.set("Hi");
        component.content.set("  ");
        fixture.detectChanges();
        expect(component.isFormValid()).toBe(false);
    });

    it("onCancel should navigate to /messages", () => {
        component.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(["/messages"]);
    });

    it("toggleCC should toggle showCC and clear selectedCC when hiding", () => {
        fixture.detectChanges();
        expect(component.showCC()).toBe(false);

        component.toggleCC();
        expect(component.showCC()).toBe(true);

        component.selectedCC.set(["cc@test.com"]);
        component.toggleCC();
        expect(component.showCC()).toBe(false);
        expect(component.selectedCC()).toEqual([]);
    });

    it("toggleBCC should toggle showBCC and clear selectedBCC when hiding", () => {
        fixture.detectChanges();
        expect(component.showBCC()).toBe(false);

        component.toggleBCC();
        expect(component.showBCC()).toBe(true);

        component.selectedBCC.set(["bcc@test.com"]);
        component.toggleBCC();
        expect(component.showBCC()).toBe(false);
        expect(component.selectedBCC()).toEqual([]);
    });

    it("onFileSelect should add files to attachments signal", () => {
        const file1 = new File(["x"], "a.txt");
        const file2 = new File(["y"], "b.txt");
        const event = {
            target: { files: [file1, file2] },
        } as unknown as Event;

        component.onFileSelect(event);

        expect(component.attachments()).toHaveLength(2);
        expect(component.attachments()[0].name).toBe("a.txt");
        expect(component.attachments()[1].name).toBe("b.txt");
    });

    it("clearAttachments should clear attachments", () => {
        component.attachments.set([
            new File([], "a.txt"),
            new File([], "b.txt"),
        ]);
        component.clearAttachments();
        expect(component.attachments()).toEqual([]);
    });

    it("removeAttachment should remove file at index", () => {
        const a = new File([], "a.txt");
        const b = new File([], "b.txt");
        const c = new File([], "c.txt");
        component.attachments.set([a, b, c]);

        component.removeAttachment(1);

        expect(component.attachments()).toHaveLength(2);
        expect(component.attachments()[0].name).toBe("a.txt");
        expect(component.attachments()[1].name).toBe("c.txt");
    });

    it("formatFileSize should return human-readable sizes", () => {
        expect(component.formatFileSize(0)).toBe("0 Bytes");
        expect(component.formatFileSize(1024)).toBe("1 KB");
        expect(component.formatFileSize(1536)).toBe("1.5 KB");
    });

    it("saveDraft should show info toast", () => {
        component.saveDraft();
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "info",
                summary: "Draft Saved",
            }),
        );
    });

    it("onSubmit without currentUserId should show error and not call create", () => {
        authService.getUserId.mockReturnValue(null);
        fixture.detectChanges();

        component.selectedRecipients.set(["a@test.com"]);
        component.subject.set("Sub");
        component.content.set("Content");
        component.onSubmit();

        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "error",
                detail: "User not found",
            }),
        );
        expect(messagesService.create).not.toHaveBeenCalled();
    });

    it("onSubmit when form valid should call create and on success navigate and show success", () => {
        fixture.detectChanges();
        component.selectedRecipients.set(["a@test.com"]);
        component.subject.set("Hello");
        component.content.set("Body");

        component.onSubmit();

        expect(component.loading()).toBe(true);
        expect(messagesService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                to: ["a@test.com"],
                subject: "Hello",
                content: "Body",
                from: "me@test.com",
                userId: 100,
            }),
        );

        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "success",
                detail: "Message sent successfully!",
            }),
        );
        expect(router.navigate).toHaveBeenCalledWith(["/messages"]);
    });

    it("onSubmit on create error should show error toast and set loading false", () => {
        const createSubject = new Subject<never>();
        messagesService.create.mockReturnValue(
            asCreateResponse(createSubject.asObservable()),
        );
        fixture.detectChanges();
        component.selectedRecipients.set(["a@test.com"]);
        component.subject.set("Hello");
        component.content.set("Body");

        component.onSubmit();

        expect(component.loading()).toBe(true);

        createSubject.error(new Error("Network error"));
        fixture.detectChanges();

        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "error",
                detail: "Failed to send message. Please try again.",
            }),
        );
        expect(component.loading()).toBe(false);
    });

    it("should render CC section with @if when showCC is true", () => {
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector(".cc-section")).toBeNull();

        component.showCC.set(true);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector(".cc-section")).toBeTruthy();
    });

    it("should render BCC section with @if when showBCC is true", () => {
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector(".bcc-section")).toBeNull();

        component.showBCC.set(true);
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector(".bcc-section"),
        ).toBeTruthy();
    });

    it("should render attachments list with @for when attachments has items", () => {
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector(".attachments-section"),
        ).toBeNull();

        component.attachments.set([
            new File(["a"], "doc.pdf", { type: "application/pdf" }),
        ]);
        fixture.detectChanges();

        const section = fixture.nativeElement.querySelector(
            ".attachments-section",
        );
        expect(section).toBeTruthy();
        expect(section?.textContent).toContain("Attachments (1)");
        const items =
            fixture.nativeElement.querySelectorAll(".attachment-item");
        expect(items.length).toBe(1);
        expect(items[0].textContent).toContain("doc.pdf");
    });
});
