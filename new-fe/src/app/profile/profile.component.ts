import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { MessageService } from "primeng/api";
import { Router } from "@angular/router";
import { OnlineStatusService } from "../services/online-status.service";
import {
    UserDTO,
    FriendDTO,
    UserPhotoDTO,
} from "src/typescript-api-client/src/model/models";
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
    photoBlobUrls: Map<number, string> = new Map();
    friends: FriendDTO[] = [];
    isLoading = false;
    isUploading = false;
    showEditDialog = false;
    editForm: any = {};

    genderOptions = [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
    ];

    constructor(
        private messageService: MessageService,
        private userService: UserService,
        private friendsService: FriendsService,
        private router: Router,
        public onlineStatusService: OnlineStatusService,
    ) {}

    ngOnInit(): void {
        this.loadCurrentUser();
        this.loadUserPhotos();
        this.loadFriends();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        
        // Revoke all blob URLs to free memory
        this.photoBlobUrls.forEach(url => URL.revokeObjectURL(url));
        this.photoBlobUrls.clear();
    }

    private loadCurrentUser(): void {
        this.userService
            .getUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user: any) => {
                    this.currentUser = user;
                },
                error: (error: any) => {
                    console.error("Error loading user profile:", error);
                    // Fallback to token parsing if API fails
                    const token = localStorage.getItem("id_token");
                    if (token) {
                        try {
                            const payload = JSON.parse(
                                atob(token.split(".")[1]),
                            );
                            this.currentUser = {
                                id: payload.id,
                                email: payload.email,
                                fullName: payload.name || "User",
                                password: "",
                                confirmPassword: "",
                                gender: payload.gender,
                                city: payload.city,
                            };
                        } catch (error: any) {
                            console.error("Error parsing token:", error);
                        }
                    }
                },
            });
    }

    loadUserPhotos(): void {
        this.isLoading = true;

        this.userService
            .getUserPhotos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (photos) => {
                    this.userPhotos = photos;
                    
                    // Load blob URLs for all photos
                    photos.forEach(photo => {
                        if (photo.id) {
                            this.loadPhotoBlobUrl(photo.id);
                        }
                    });
                    
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

    private loadPhotoBlobUrl(photoId: number): void {
        this.userService.getPhoto(photoId, 'response').subscribe({
            next: (response: any) => {
                const blob = response.body as Blob;
                const blobUrl = URL.createObjectURL(blob);
                this.photoBlobUrls.set(photoId, blobUrl);
            },
            error: (error) => {
                console.error(`Error loading photo ${photoId}:`, error);
            }
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

        this.userService
            .uploadPhoto(file)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (photo) => {
                    this.userPhotos.unshift(photo);
                    
                    // Load blob URL for the newly uploaded photo
                    if (photo.id) {
                        this.loadPhotoBlobUrl(photo.id);
                    }
                    
                    this.isUploading = false;
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Photo uploaded successfully",
                    });
                },
                error: (error) => {
                    console.error("Error uploading photo:", error);
                    this.isUploading = false;
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to upload photo",
                    });
                },
            });
    }

    getPhotoUrl(photoId: number): string {
        return this.photoBlobUrls.get(photoId) || '';
    }

    getUserInitials(): string {
        if (!this.currentUser) return "U";
        const nameParts = this.currentUser.fullName?.split(" ") || [];
        const first = nameParts[0]?.charAt(0) || "";
        const last = nameParts[1]?.charAt(0) || "";
        return (first + last).toUpperCase() || "U";
    }

    openEditDialog(): void {
        this.editForm = {
            gender: this.currentUser?.gender || null,
            city: this.currentUser?.city || "",
        };
        this.showEditDialog = true;
    }

    saveProfile(): void {
        this.userService
            .updateProfile({
                gender: this.editForm.gender,
                city: this.editForm.city,
            } as any)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    // Reload user data
                    this.loadCurrentUser();
                    this.showEditDialog = false;
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Profile updated successfully",
                    });
                },
                error: (error: any) => {
                    console.error("Error updating profile:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to update profile",
                    });
                },
            });
    }

    isOnline(userId: number | undefined): boolean {
        if (!userId) return false;

        // Find the friend's lastOnline timestamp
        const friend = this.friends.find((f) => f.friendId === userId);
        const lastOnline = friend?.user?.lastOnline;

        return this.onlineStatusService.isOnline(lastOnline);
    }

    startChat(friend: FriendDTO): void {
        // Navigate to chat conversation with this friend
        if (friend.friendId) {
            this.router.navigate(["/chat/conversation", friend.friendId]);
        }
    }
}
