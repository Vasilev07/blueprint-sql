import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, Subject, throwError } from "rxjs";
import { MessageService } from "primeng/api";
import { ForumHomeComponent } from "./forum-home.component";
import { ForumRoomsService } from "../../typescript-api-client/src/api/api";
import { ForumRoomDTO } from "src/typescript-api-client/src/model/forum-room-dto";

describe("ForumHomeComponent", () => {
    let component: ForumHomeComponent;
    let fixture: ComponentFixture<ForumHomeComponent>;

    let forumRoomsService: jest.Mocked<ForumRoomsService>;
    let router: jest.Mocked<Router>;
    let messageService: jest.Mocked<MessageService>;

    const roomsMock: ForumRoomDTO[] = [
        {
            id: 1,
            name: "Room 1",
            description: "First room",
            visibility: "public",
            memberCount: 10,
            status: "active",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
        },
        {
            id: 2,
            name: "Room 2",
            description: "Second room",
            visibility: "private",
            memberCount: 5,
            status: "archived",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
        },
    ];

    beforeEach(async () => {
        forumRoomsService = {
            getRooms: jest.fn().mockReturnValue(of(roomsMock)),
            getMyRooms: jest.fn().mockReturnValue(of([])),
            createRoom: jest.fn(),
        } as any;

        router = {
            navigate: jest.fn().mockResolvedValue(true),
        } as any;

        messageService = {
            add: jest.fn(),
        } as any;

        await TestBed.configureTestingModule({
            imports: [ForumHomeComponent],
            providers: [
                { provide: ForumRoomsService, useValue: forumRoomsService },
                { provide: Router, useValue: router },
                { provide: MessageService, useValue: messageService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ForumHomeComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should load rooms and myRooms on init", () => {
        const roomsSpy = jest.spyOn(forumRoomsService, "getRooms");
        const myRoomsSpy = jest.spyOn(forumRoomsService, "getMyRooms");

        fixture.detectChanges();

        expect(roomsSpy).toHaveBeenCalledWith("", "active");
        expect(myRoomsSpy).toHaveBeenCalled();

        expect(component.rooms().length).toBe(2);
    });

    it("should set loading correctly when loading rooms succeeds", () => {
        const subject = new Subject<ForumRoomDTO[]>();
        forumRoomsService.getRooms = jest
            .fn()
            .mockReturnValue(subject.asObservable());

        fixture.detectChanges();

        expect(component.loading()).toBe(true);

        subject.next(roomsMock);
        subject.complete();

        expect(component.loading()).toBe(false);
        expect(component.rooms()).toEqual(roomsMock);
    });

    it("should handle error when loading rooms fails", () => {
        forumRoomsService.getRooms = jest
            .fn()
            .mockReturnValue(throwError(() => new Error("Failed")));

        fixture.detectChanges();

        expect(component.loading()).toBe(false);
        expect(messageService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "error",
                summary: "Error",
            }),
        );
    });

    it("should navigate to room on openRoom", async () => {
        fixture.detectChanges();

        component.openRoom(1);

        expect(router.navigate).toHaveBeenCalledWith(["/forum/room", 1]);
    });
});
