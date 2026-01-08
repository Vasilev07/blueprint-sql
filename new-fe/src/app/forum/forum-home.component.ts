import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { ForumRoomsService } from "../../typescript-api-client/src/api/api";
import {
    ForumRoomDTO,
    CreateForumRoomDTO,
} from "../../typescript-api-client/src/model/models";
import { MessageService } from "primeng/api";

@Component({
    selector: "app-forum-home",
    templateUrl: "./forum-home.component.html",
    styleUrls: ["./forum-home.component.scss"],
})
export class ForumHomeComponent implements OnInit, OnDestroy {
    rooms: ForumRoomDTO[] = [];
    myRooms: ForumRoomDTO[] = [];
    loading = false;
    showCreateDialog = false;
    newRoomName = "";
    newRoomDescription = "";
    newRoomVisibility: "public" | "private" | "restricted" = "public";
    newRoomMaxMembers: number | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private forumRoomsService: ForumRoomsService,
        private router: Router,
        private messageService: MessageService,
    ) {}

    ngOnInit(): void {
        this.loadRooms();
        this.loadMyRooms();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadRooms(): void {
        this.loading = true;
        this.forumRoomsService
            .getRooms("", "active")
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (rooms) => {
                    this.rooms = rooms || [];
                    this.loading = false;
                },
                error: (error) => {
                    console.error("Error loading rooms:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load forum rooms",
                    });
                    this.loading = false;
                },
            });
    }

    loadMyRooms(): void {
        this.forumRoomsService
            .getMyRooms()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (rooms) => {
                    this.myRooms = rooms || [];
                },
                error: (error) => {
                    console.error("Error loading my rooms:", error);
                },
            });
    }

    openRoom(roomId: number): void {
        this.router.navigate(["/forum/room", roomId]);
    }

    openCreateDialog(): void {
        this.showCreateDialog = true;
        this.newRoomName = "";
        this.newRoomDescription = "";
        this.newRoomVisibility = "public";
        this.newRoomMaxMembers = null;
    }

    createRoom(): void {
        if (!this.newRoomName.trim()) {
            this.messageService.add({
                severity: "warn",
                summary: "Warning",
                detail: "Room name is required",
            });
            return;
        }

        const dto: CreateForumRoomDTO = {
            name: this.newRoomName.trim(),
            description: this.newRoomDescription.trim() || undefined,
            visibility: this.newRoomVisibility,
            maxMembers: this.newRoomMaxMembers || undefined,
        };

        this.forumRoomsService
            .createRoom(dto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (room) => {
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Room created successfully",
                    });
                    this.showCreateDialog = false;
                    this.loadRooms();
                    this.loadMyRooms();
                    // Navigate to the new room
                    this.router.navigate(["/forum/room", room.id]);
                },
                error: (error) => {
                    console.error("Error creating room:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: error?.error?.message || "Failed to create room",
                    });
                },
            });
    }

    getVisibilityBadge(visibility: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
        switch (visibility) {
            case "public":
                return "success";
            case "private":
                return "warning";
            case "restricted":
                return "info";
            default:
                return undefined;
        }
    }
}

