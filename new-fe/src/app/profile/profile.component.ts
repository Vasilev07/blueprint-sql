import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { MessageService } from "primeng/api";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "../services/auth.service";
import { UserDTO, FriendDTO, UserPhotoDTO } from "src/typescript-api-client/src/model/models";
import {
    UserService,
    FriendsService,
} from "src/typescript-api-client/src/api/api";


@Component({
    selector: "app-profile",
    templateUrl: "./profile.component.html",
    styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    currentUser: UserDTO | null = null;
    userPhotos: UserPhotoDTO[] = [];
    friends: FriendDTO[] = [];
    isLoading = false;
    isUploading = false;

    constructor(
        private messageService: MessageService,
        private http: HttpClient,
        private authService: AuthService,
        private userService: UserService,
        private friendsService: FriendsService,
    ) {}

    ngOnInit(): void {
        this.loadCurrentUser();
        this.loadUserPhotos();
        this.loadFriends();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


    private loadCurrentUser(): void {
        const token = localStorage.getItem("id_token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                this.currentUser = {
                    id: payload.id,
                    email: payload.email,
                    fullName: payload.name || "User",
                    password: "",
                    confirmPassword: "",
                };
            } catch (error) {
                console.error("Error parsing token:", error);
            }
        }
    }

    loadUserPhotos(): void {
        this.isLoading = true;

        this.userService.getUserPhotos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (photos) => {
                    this.userPhotos = photos;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error("Error loading photos:", error);
                    this.isLoading = false;
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load photos",
                    });
                },
            });
    }

    loadFriends(): void {
        this.friendsService
            .getAcceptedFriends()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (friends) => {
                    this.friends = friends;
                },
                error: (error) => {
                    console.error("Error loading friends:", error);
                },
            });
    }

    onPhotoUpload(event: any): void {
        const file = event.files[0];
        if (!file) return;

        this.isUploading = true;

        // Use fetch for file upload since the generated API client doesn't support FormData
        const formData = new FormData();
        formData.append("photo", file);

        const token = localStorage.getItem("id_token");
        fetch("http://localhost:3000/auth/photos/upload", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData,
        })
            .then((response) => response.json())
            .then((photo: UserPhotoDTO) => {
                this.userPhotos.unshift(photo);
                this.isUploading = false;
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Photo uploaded successfully",
                });
            })
            .catch((error) => {
                console.error("Error uploading photo:", error);
                this.isUploading = false;
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to upload photo",
                });
            });
    }

    getPhotoUrl(photoId: number): string {
        return `http://localhost:3000/auth/photos/${photoId}`;
    }

    getUserInitials(): string {
        if (!this.currentUser) return "U";
        const nameParts = this.currentUser.fullName?.split(" ") || [];
        const first = nameParts[0]?.charAt(0) || "";
        const last = nameParts[1]?.charAt(0) || "";
        return (first + last).toUpperCase() || "U";
    }
}
