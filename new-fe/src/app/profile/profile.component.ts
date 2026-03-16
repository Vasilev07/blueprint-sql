import {
    Component,
    OnInit,
    OnDestroy,
    signal,
    computed,
    model,
    inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    FormControl,
    FormArray,
} from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TabsModule } from "primeng/tabs";
import { ButtonModule } from "primeng/button";
import { FileUploadModule } from "primeng/fileupload";
import { CardModule } from "primeng/card";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { InputNumberModule } from "primeng/inputnumber";
import { ChipModule } from "primeng/chip";
import { TooltipModule } from "primeng/tooltip";
import { DividerModule } from "primeng/divider";
import { DatePickerModule } from "primeng/datepicker";
import { MessageModule } from "primeng/message";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { SharedComponentsModule } from "../shared/components.module";
import { Subject, takeUntil } from "rxjs";
import { MessageService, ConfirmationService } from "primeng/api";
import { Router, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { OnlineStatusService } from "../services/online-status.service";
import { WebsocketService } from "../services/websocket.service";
import { environment } from "src/environments/environment";
import {
    UserDTO,
    FriendDTO,
    UserPhotoDTO,
    UserProfileDTO,
    UpdateUserProfileDTO,
    GiftDTO,
} from "src/typescript-api-client/src/model/models";
import {
    UserService,
    FriendsService,
    WalletService,
    GiftService,
} from "src/typescript-api-client/src/api/api";

@Component({
    selector: "app-profile",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        TabsModule,
        ButtonModule,
        FileUploadModule,
        CardModule,
        AvatarModule,
        BadgeModule,
        ProgressSpinnerModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        ToggleSwitchModule,
        InputNumberModule,
        ChipModule,
        TooltipModule,
        DividerModule,
        DatePickerModule,
        MessageModule,
        ToastModule,
        ConfirmDialogModule,
        SharedComponentsModule,
    ],
    templateUrl: "./profile.component.html",
    styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private userService = inject(UserService);
    private friendsService = inject(FriendsService);
    private walletService = inject(WalletService);
    private giftService = inject(GiftService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private http = inject(HttpClient);
    private fb = inject(FormBuilder);

    readonly onlineStatusService = inject(OnlineStatusService);
    private websocketService = inject(WebsocketService);

    // Signals – user & profile
    currentUser = signal<UserDTO | null>(null);
    viewingUser = signal<UserDTO | null>(null);
    userProfile = signal<UserProfileDTO | null>(null);
    userPhotos = signal<UserPhotoDTO[]>([]);
    photoBlobUrls = signal<Map<number, string>>(new Map());
    profilePictureBlobUrl = signal<string | null>(null);
    friends = signal<FriendDTO[]>([]);

    isLoading = signal(false);
    isUploading = signal(false);
    showEditDialog = model(false);
    showPhotoDialog = model(false);
    selectedPhoto = signal<UserPhotoDTO | null>(null);
    isOwnProfile = signal(true);
    viewingUserId = signal<number | null>(null);

    editFormGroup!: FormGroup<{
        gender: FormControl<string | null>;
        city: FormControl<string | null>;
        bio: FormControl<string | null>;
        location: FormControl<string | null>;
        interests: FormArray<FormControl<string | null>>;
        appearsInSearches: FormControl<boolean | null>;
        dateOfBirth: FormControl<Date | null>;
    }>;
    newInterestControl!: FormControl<string>;

    get interestsFormArray(): FormArray<FormControl<string | null>> {
        return this.editFormGroup.controls.interests;
    }

    // Verification
    verificationStatus = signal<unknown>(null);
    isVerificationUploading = signal(false);
    verificationPhoto: File | null = null;

    maxDate = new Date();

    // Wallet
    balance = signal<string>("0");
    showDepositDialog = model(false);
    isDepositing = signal(false);
    depositForm: {
        amount: number | null;
        cardNumber: string;
        cardHolder: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
    } = {
        amount: null,
        cardNumber: "",
        cardHolder: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
    };

    // Gifts
    receivedGifts = signal<GiftDTO[]>([]);
    isLoadingGifts = signal(false);
    showSendGiftDialog = model(false);
    recipientUserForGift = signal<{
        id: number;
        fullName?: string;
        name?: string;
    } | null>(null);

    // Tabs
    activeTabIndex = model(0);

    readonly genderOptions = [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
    ];

    groupedReceivedGifts = computed(() => {
        const gifts = this.receivedGifts();
        const grouped = new Map<string, GiftDTO[]>();

        gifts.forEach((gift) => {
            const senderId = gift.senderId || gift.sender?.id || 0;
            const key = `${senderId}_${gift.giftEmoji}`;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(gift);
        });

        return Array.from(grouped.entries()).map(([_key, g]) => {
            const first = g[0];
            const senderId = first.senderId || first.sender?.id || 0;
            const totalAmount = g
                .reduce((sum, gift) => sum + parseFloat(gift.amount || "0"), 0)
                .toFixed(8);
            const latestDate = g.reduce((latest, gift) => {
                const d = new Date(gift.createdAt);
                return d > latest ? d : latest;
            }, new Date(g[0].createdAt));
            const messages = g
                .map((x) => x.message)
                .filter((msg): msg is string => !!msg && msg.trim() !== "");

            return {
                giftEmoji: first.giftEmoji,
                senderId,
                sender: first.sender,
                gifts: g,
                totalAmount,
                latestDate,
                messages,
            };
        });
    });

    ngOnInit(): void {
        this.initEditForm();
        this.ensureAuthHeaders();
        this.route.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                const userId = params.get("userId");
                if (userId) {
                    this.viewingUserId.set(parseInt(userId, 10));
                    this.isOwnProfile.set(false);
                    this.loadOtherUserProfile(this.viewingUserId()!);
                } else {
                    this.isOwnProfile.set(true);
                    this.viewingUserId.set(null);
                    this.loadCurrentUser();
                    this.loadUserProfile();
                    this.loadUserPhotos();
                    this.loadFriends();
                    this.loadProfilePicture();
                    this.setupVerificationNotifications();
                    this.loadReceivedGifts();
                }
            });
    }

    private initEditForm(): void {
        this.editFormGroup = new FormGroup({
            gender: new FormControl<string | null>(null),
            city: new FormControl<string | null>(null),
            bio: new FormControl<string | null>(null),
            location: new FormControl<string | null>(null),
            interests: new FormArray<FormControl<string | null>>([]),
            appearsInSearches: new FormControl<boolean | null>(true),
            dateOfBirth: new FormControl<Date | null>(null),
        });
        this.newInterestControl = new FormControl<string>("", {
            nonNullable: true,
        });
    }

    private ensureAuthHeaders(): void {
        const token = localStorage.getItem("id_token");
        if (token) {
            this.userService.defaultHeaders =
                this.userService.defaultHeaders.set(
                    "Authorization",
                    `Bearer ${token}`,
                );
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.photoBlobUrls().forEach((url) => {
            try {
                URL.revokeObjectURL(url);
            } catch {
                // ignore in tests or when URL was not created by createObjectURL
            }
        });
        this.photoBlobUrls.set(new Map());
        const pp = this.profilePictureBlobUrl();
        if (pp) {
            try {
                URL.revokeObjectURL(pp);
            } catch {
                // ignore in tests or when URL was not created by createObjectURL
            }
        }
    }

    private loadCurrentUser(): void {
        this.userService
            .getUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user: UserDTO & { balance?: string }) => {
                    this.currentUser.set(user);
                    this.balance.set(user.balance ?? "0");
                },
                error: (error: unknown) => {
                    console.error("Error loading user profile:", error);
                    const token = localStorage.getItem("id_token");
                    if (token) {
                        try {
                            const payload = JSON.parse(
                                atob(token.split(".")[1]),
                            );
                            this.currentUser.set({
                                id: payload.id,
                                email: payload.email,
                                fullName: payload.name || "User",
                                password: "",
                                confirmPassword: "",
                                gender: payload.gender,
                                city: payload.city,
                            });
                        } catch (e) {
                            console.error("Error parsing token:", e);
                        }
                    }
                },
            });
    }

    loadUserPhotos(): void {
        this.isLoading.set(true);
        this.userService
            .getUserPhotos()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (photos) => {
                    this.userPhotos.set(photos);
                    photos.forEach((photo) => {
                        if (photo.id) this.loadPhotoBlobUrl(photo.id);
                    });
                    this.isLoading.set(false);
                },
                error: (error) => {
                    console.error("Error loading photos:", error);
                    this.isLoading.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load photos",
                    });
                },
            });
    }

    private loadPhotoBlobUrl(photoId: number): void {
        this.userService.getPhoto(photoId, "response").subscribe({
            next: (response) => {
                const blob = response.body;
                if (!blob) return;
                const blobUrl = URL.createObjectURL(blob);
                this.photoBlobUrls.update((m) => {
                    const next = new Map(m);
                    next.set(photoId, blobUrl);
                    return next;
                });
            },
            error: (error) => {
                console.error(`Error loading photo ${photoId}:`, error);
            },
        });
    }

    loadFriends(): void {
        this.friendsService
            .getAcceptedFriends()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (list) => this.friends.set(list),
                error: (error) =>
                    console.error("Error loading friends:", error),
            });
    }

    onPhotoUpload(event: { files: File[] }): void {
        if (!this.isOwnProfile()) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot upload photos to another user's profile",
            });
            return;
        }
        const file = event.files[0];
        if (!file) return;
        this.isUploading.set(true);
        this.userService
            .uploadPhoto(file)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (photo) => {
                    this.userPhotos.update((p) => [photo, ...p]);
                    if (photo.id) this.loadPhotoBlobUrl(photo.id);
                    this.isUploading.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Photo uploaded successfully",
                    });
                },
                error: (error) => {
                    console.error("Error uploading photo:", error);
                    this.isUploading.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to upload photo",
                    });
                },
            });
    }

    getPhotoUrl(photoId: number): string {
        return this.photoBlobUrls().get(photoId) ?? "";
    }

    getUserInitials(): string {
        const user = this.currentUser();
        if (!user) return "U";
        const parts = user.fullName?.split(" ") ?? [];
        const first = parts[0]?.charAt(0) ?? "";
        const last = parts[1]?.charAt(0) ?? "";
        return (first + last).toUpperCase() || "U";
    }

    loadUserProfile(): void {
        this.userService
            .getUserProfile()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (profile) => this.userProfile.set(profile),
                error: (error: unknown) =>
                    console.error("Error loading user profile:", error),
            });
    }

    openEditDialog(): void {
        if (!this.isOwnProfile()) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot edit another user's profile",
            });
            return;
        }
        const profile = this.userProfile();
        const user = this.currentUser();
        this.editFormGroup.patchValue({
            gender: user?.gender ?? null,
            city: profile?.city ?? "",
            bio: profile?.bio ?? "",
            location: profile?.location ?? "",
            appearsInSearches: profile?.appearsInSearches !== false,
            dateOfBirth: profile?.dateOfBirth
                ? new Date(profile.dateOfBirth)
                : null,
        });
        this.interestsFormArray.clear();
        (profile?.interests ?? []).forEach((interest) =>
            this.interestsFormArray.push(
                new FormControl(interest, { nonNullable: true }),
            ),
        );
        this.newInterestControl.setValue("");
        this.showEditDialog.set(true);
        this.loadVerificationStatus();
    }

    onEditDialogShow(): void {
        this.editFormGroup.markAsPristine();
        setTimeout(() => this.editFormGroup.markAsPristine(), 0);
        requestAnimationFrame(() => this.editFormGroup.markAsPristine());
    }

    private getEditFormRawValue(): Record<string, unknown> {
        const raw = this.editFormGroup.getRawValue();
        return {
            ...raw,
            interests: (raw.interests ?? []).map((v) => v ?? ""),
        } as Record<string, unknown>;
    }

    hasEditFormChanges(): boolean {
        return this.editFormGroup.dirty;
    }

    saveProfile(): void {
        if (!this.isOwnProfile()) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot save changes to another user's profile",
            });
            return;
        }
        const raw = this.getEditFormRawValue();
        const user = this.currentUser();
        if (!user) return;
        const profilePayload: UserDTO = {
            ...user,
            gender: (raw["gender"] as string) ?? user.gender ?? undefined,
        } as UserDTO;
        this.userService
            .updateProfile(profilePayload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    const update: UpdateUserProfileDTO = {
                        bio: (raw["bio"] as string) ?? undefined,
                        city: (raw["city"] as string) ?? undefined,
                        location: (raw["location"] as string) ?? undefined,
                        interests: (raw["interests"] as string[]) ?? undefined,
                        appearsInSearches: raw["appearsInSearches"] as boolean,
                        dateOfBirth: raw["dateOfBirth"]
                            ? (raw["dateOfBirth"] as Date).toISOString()
                            : undefined,
                    };
                    this.userService
                        .updateUserProfile(update)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.loadCurrentUser();
                                this.loadUserProfile();
                                this.showEditDialog.set(false);
                                this.messageService.add({
                                    severity: "success",
                                    summary: "Success",
                                    detail: "Profile updated successfully",
                                });
                            },
                            error: (error: unknown) => {
                                console.error(
                                    "Error updating user profile:",
                                    error,
                                );
                                this.messageService.add({
                                    severity: "error",
                                    summary: "Error",
                                    detail: "Failed to update profile",
                                });
                            },
                        });
                },
                error: (error: unknown) => {
                    console.error("Error updating profile:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to update profile",
                    });
                },
            });
    }

    addInterest(): void {
        const trimmed = this.newInterestControl.value?.trim();
        if (!trimmed) return;
        const interests = this.interestsFormArray.value;
        if (interests.includes(trimmed)) return;
        this.interestsFormArray.push(
            new FormControl(trimmed, { nonNullable: true }),
        );
        this.newInterestControl.setValue("");
    }

    removeInterest(index: number): void {
        this.interestsFormArray.removeAt(index);
    }

    isOnline(userId: number | undefined): boolean {
        if (!userId) return false;
        const friend = this.friends().find((f) => f.friendId === userId);
        return this.onlineStatusService.isOnline(friend?.user?.lastOnline);
    }

    startChat(friend: FriendDTO): void {
        if (friend.friendId) {
            this.router.navigate(["/chat/conversation", friend.friendId]);
        }
    }

    loadProfilePicture(): void {
        this.userService
            .getProfilePicture("response")
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const blob = response.body;
                    if (!blob) return;
                    const prev = this.profilePictureBlobUrl();
                    if (prev) URL.revokeObjectURL(prev);
                    this.profilePictureBlobUrl.set(URL.createObjectURL(blob));
                },
                error: (error: { status?: number }) => {
                    if (error.status !== 404) {
                        console.error("Error loading profile picture:", error);
                    }
                },
            });
    }

    onProfilePictureUpload(event: { files: File[] }): void {
        if (!this.isOwnProfile()) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot upload a profile picture for another user",
            });
            return;
        }
        const file = event.files[0];
        if (!file) return;
        this.isUploading.set(true);
        this.userService
            .uploadProfilePicture(file)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user) => {
                    this.currentUser.set(user);
                    this.loadProfilePicture();
                    this.isUploading.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Profile picture uploaded successfully",
                    });
                },
                error: (error) => {
                    console.error("Error uploading profile picture:", error);
                    this.isUploading.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to upload profile picture",
                    });
                },
            });
    }

    setPhotoAsProfilePicture(photoId: number): void {
        if (!this.isOwnProfile()) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot set profile picture for another user",
            });
            return;
        }
        this.userService
            .setProfilePicture(photoId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user) => {
                    this.currentUser.set(user);
                    this.loadProfilePicture();
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Profile picture updated successfully",
                    });
                },
                error: (error) => {
                    console.error("Error setting profile picture:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to update profile picture",
                    });
                },
            });
    }

    getProfilePictureUrl(): string {
        return this.profilePictureBlobUrl() ?? "";
    }

    hasProfilePicture(): boolean {
        return !!this.profilePictureBlobUrl();
    }

    loadOtherUserProfile(userId: number): void {
        this.isLoading.set(true);
        this.userPhotos.set([]);
        this.photoBlobUrls().forEach((url) => URL.revokeObjectURL(url));
        this.photoBlobUrls.set(new Map());
        const pp = this.profilePictureBlobUrl();
        if (pp) {
            URL.revokeObjectURL(pp);
            this.profilePictureBlobUrl.set(null);
        }
        this.userService
            .getUserById(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const user = response.user;
                    const profile = response.profile;
                    if (!user || !profile) return;
                    const balance = (user as UserDTO & { balance?: string })
                        .balance;
                    this.viewingUser.set(user);
                    this.currentUser.set(user);
                    this.userProfile.set(profile);
                    this.balance.set(balance ?? "0");
                    this.loadOtherUserPhotos(userId);
                    this.loadOtherUserProfilePicture(userId);
                    this.loadReceivedGifts();
                    this.isLoading.set(false);
                },
                error: (error: unknown) => {
                    console.error("Error loading user profile:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load user profile",
                    });
                    this.isLoading.set(false);
                    this.router.navigate(["/profile"]);
                },
            });
    }

    loadOtherUserPhotos(userId: number): void {
        this.userService
            .getUserPhotosByUserId(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (photos) => {
                    this.userPhotos.set(photos);
                    photos.forEach((p) => {
                        if (p.id) this.loadPhotoBlobUrl(p.id);
                    });
                },
                error: (error: { status?: number }) => {
                    console.error("Error loading photos:", error);
                    if (error.status === 403) {
                        this.messageService.add({
                            severity: "warn",
                            summary: "Access Denied",
                            detail: "You must be friends to view this user's photos",
                            life: 5000,
                        });
                    }
                },
            });
    }

    loadOtherUserProfilePicture(userId: number): void {
        this.userService
            .getProfilePictureByUserId(userId, "response")
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const blob = response.body;
                    if (!blob) return;
                    const prev = this.profilePictureBlobUrl();
                    if (prev) URL.revokeObjectURL(prev);
                    this.profilePictureBlobUrl.set(URL.createObjectURL(blob));
                },
                error: (error: { status?: number }) => {
                    if (error.status !== 404) {
                        console.error("Error loading profile picture:", error);
                    }
                },
            });
    }

    openPhotoDialog(photo: UserPhotoDTO): void {
        this.selectedPhoto.set(photo);
        this.showPhotoDialog.set(true);
    }

    togglePhotoLike(photo: UserPhotoDTO): void {
        if (!photo.id) return;
        if (photo.isLikedByCurrentUser) {
            this.userService.unlikePhoto(photo.id).subscribe({
                next: (response) => {
                    photo.likesCount = response.likesCount;
                    photo.isLikedByCurrentUser = false;
                },
                error: (error) => {
                    console.error("Error unliking photo:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to unlike photo",
                    });
                },
            });
        } else {
            this.userService.likePhoto(photo.id).subscribe({
                next: (response) => {
                    photo.likesCount = response.likesCount;
                    photo.isLikedByCurrentUser = true;
                },
                error: (error) => {
                    console.error("Error liking photo:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to like photo",
                    });
                },
            });
        }
    }

    deletePhoto(photoId: number): void {
        this.confirmationService.confirm({
            message: "Are you sure you want to delete this photo?",
            header: "Confirm Delete",
            icon: "pi pi-exclamation-triangle",
            accept: () => {
                this.userService.deletePhoto(photoId).subscribe({
                    next: () => {
                        this.userPhotos.update((p) =>
                            p.filter((x) => x.id !== photoId),
                        );
                        this.messageService.add({
                            severity: "success",
                            summary: "Deleted",
                            detail: "Photo deleted successfully",
                        });
                        this.loadCurrentUser();
                    },
                    error: (error) => {
                        console.error("Error deleting photo:", error);
                        this.messageService.add({
                            severity: "error",
                            summary: "Error",
                            detail: "Failed to delete photo",
                        });
                    },
                });
            },
        });
    }

    loadVerificationStatus(): void {
        this.userService.getVerificationStatus().subscribe({
            next: (status) => this.verificationStatus.set(status),
            error: (error) =>
                console.error("Error loading verification status:", error),
        });
    }

    onVerificationPhotoSelect(event: { files: File[] }): void {
        const file = event.files[0];
        if (file) this.verificationPhoto = file;
    }

    uploadVerificationPhoto(): void {
        if (!this.verificationPhoto) {
            this.messageService.add({
                severity: "warn",
                summary: "No File",
                detail: "Please select a verification photo first",
            });
            return;
        }
        this.isVerificationUploading.set(true);
        this.userService
            .uploadVerificationPhoto(this.verificationPhoto)
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Verification photo uploaded successfully!",
                    });
                    this.verificationPhoto = null;
                    this.loadVerificationStatus();
                },
                error: (error) => {
                    console.error("Error uploading verification photo:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to upload verification photo",
                    });
                },
                complete: () => this.isVerificationUploading.set(false),
            });
    }

    getVerificationStatusText(): string {
        const status = this.verificationStatus() as {
            verificationRequest?: { status?: string };
        } | null;
        if (!status) return "Not submitted";
        switch (status.verificationRequest?.status) {
            case "pending":
                return "Pending Review";
            case "in_review":
                return "Under Review";
            case "verified":
                return "Verified ✓";
            case "rejected":
                return "Rejected";
            default:
                return "Not submitted";
        }
    }

    getVerificationStatusSeverity():
        | "error"
        | "success"
        | "info"
        | "warn"
        | "secondary"
        | "contrast" {
        const status = this.verificationStatus() as {
            verificationRequest?: { status?: string };
        } | null;
        if (!status) return "info";
        switch (status.verificationRequest?.status) {
            case "pending":
                return "warn";
            case "in_review":
                return "info";
            case "verified":
                return "success";
            case "rejected":
                return "error";
            default:
                return "info";
        }
    }

    isVerificationPending(): boolean {
        const status = this.verificationStatus() as {
            verificationRequest?: { status?: string };
        } | null;
        const s = status?.verificationRequest?.status;
        return s === "pending" || s === "in_review";
    }

    getVerificationRejectionReason(): string | undefined {
        const status = this.verificationStatus() as {
            verificationRequest?: { rejectionReason?: string };
        } | null;
        return status?.verificationRequest?.rejectionReason;
    }

    isVerificationVerified(): boolean {
        const status = this.verificationStatus() as {
            isVerified?: boolean;
        } | null;
        return !!status?.isVerified;
    }

    private setupVerificationNotifications(): void {
        this.websocketService
            .onVerificationStatusChange()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    this.messageService.add({
                        severity:
                            notification.status === "verified"
                                ? "success"
                                : "warn",
                        summary: "Verification Update",
                        detail: notification.message,
                        life: 8000,
                    });
                    this.loadVerificationStatus();
                },
                error: (error) =>
                    console.error(
                        "Error receiving verification notification:",
                        error,
                    ),
            });
    }

    getBalanceAsInteger(): string {
        return Math.floor(parseFloat(this.balance() || "0")).toString();
    }

    openDepositDialog(): void {
        this.showDepositDialog.set(true);
    }

    closeDepositDialog(): void {
        this.showDepositDialog.set(false);
        this.isDepositing.set(false);
        this.depositForm = {
            amount: null,
            cardNumber: "",
            cardHolder: "",
            expiryMonth: "",
            expiryYear: "",
            cvv: "",
        };
    }

    formatCardNumber(event: Event): void {
        const value = ((event.target as HTMLInputElement)?.value ?? "")
            .replace(/\s+/g, "")
            .replace(/[^0-9]/gi, "");
        this.depositForm.cardNumber =
            value.match(/.{1,4}/g)?.join(" ") ?? value;
    }

    submitDeposit(): void {
        const amount = this.depositForm.amount;
        if (amount == null || amount <= 0) {
            this.messageService.add({
                severity: "warn",
                summary: "Validation",
                detail: "Enter a positive amount",
            });
            return;
        }
        const amt = Math.floor(Number(amount));
        this.isDepositing.set(true);
        this.walletService
            .deposit({
                amount: amt.toString(),
                currency: "USD",
                paymentMethod: "card",
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: { balance?: string }) => {
                    this.balance.set(response.balance ?? this.balance());
                    if (this.isOwnProfile()) this.loadCurrentUser();
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: `Successfully added ${amt} tokens. New balance: ${this.getBalanceAsInteger()} tokens`,
                    });
                    this.isDepositing.set(false);
                    this.closeDepositDialog();
                },
                error: (error: { error?: { message?: string } }) => {
                    console.error("Error depositing funds:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail:
                            error.error?.message ??
                            "Failed to add tokens. Please try again.",
                    });
                    this.isDepositing.set(false);
                },
            });
    }

    loadReceivedGifts(): void {
        this.isLoadingGifts.set(true);
        if (this.isOwnProfile()) {
            this.giftService
                .getReceivedGifts(100)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (gifts) => {
                        this.receivedGifts.set(gifts);
                        this.isLoadingGifts.set(false);
                        if (gifts.length === 0) this.activeTabIndex.set(6);
                    },
                    error: (error) => {
                        console.error("Error loading received gifts:", error);
                        this.isLoadingGifts.set(false);
                    },
                });
        } else if (this.viewingUserId()) {
            const url = `${environment.apiUrl}/gifts/user/${this.viewingUserId()}/received`;
            this.http
                .get<GiftDTO[]>(url, { params: { limit: 100 } })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (gifts) => {
                        this.receivedGifts.set(gifts ?? []);
                        this.isLoadingGifts.set(false);
                    },
                    error: (error) => {
                        console.error(
                            "Error loading received gifts for user:",
                            error,
                        );
                        this.receivedGifts.set([]);
                        this.isLoadingGifts.set(false);
                    },
                });
        } else {
            this.isLoadingGifts.set(false);
        }
    }

    getSenderName(gift: GiftDTO): string {
        if (!gift.sender) return "Unknown";
        const first = gift.sender.firstname ?? "";
        const last = gift.sender.lastname ?? "";
        return (`${first} ${last}`.trim() || gift.sender.email) ?? "Unknown";
    }

    getSenderNameFromSender(sender: GiftDTO["sender"]): string {
        if (!sender) return "Unknown";
        const first = sender.firstname ?? "";
        const last = sender.lastname ?? "";
        return (`${first} ${last}`.trim() || sender.email) ?? "Unknown";
    }

    openSendGiftDialog(): void {
        const uid = this.viewingUserId();
        if (!uid) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to send gift. User information not available.",
            });
            return;
        }
        this.recipientUserForGift.set({
            id: uid,
            fullName: this.viewingUser()?.fullName,
            name: this.viewingUser()?.fullName,
        });
        this.showSendGiftDialog.set(true);
    }

    onGiftSent(): void {
        this.recipientUserForGift.set(null);
        this.loadReceivedGifts();
    }

    getBalanceAsNumber(): number {
        return parseFloat(this.balance() || "0");
    }

    startVideoCall(): void {
        const uid = this.viewingUserId();
        if (!uid) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to start call. User information not available.",
            });
            return;
        }
        const name = this.viewingUser()?.fullName ?? "Unknown User";
        this.router.navigate(["/video-call"], {
            queryParams: { recipientId: uid, recipientName: name },
        });
    }
}
