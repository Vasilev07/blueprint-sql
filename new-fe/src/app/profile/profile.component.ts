import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
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
    templateUrl: "./profile.component.html",
    styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    currentUser: UserDTO | null = null;
    viewingUser: UserDTO | null = null;
    userProfile: UserProfileDTO | null = null;
    userPhotos: UserPhotoDTO[] = [];
    photoBlobUrls: Map<number, string> = new Map();
    profilePictureBlobUrl: string | null = null;
    friends: FriendDTO[] = [];
    isLoading = false;
    isUploading = false;
    showEditDialog = false;
    showPhotoDialog = false;
    selectedPhoto: UserPhotoDTO | null = null;
    editForm: any = {};
    isOwnProfile = true;
    viewingUserId: number | null = null;
    newInterest: string = "";

    // Verification properties
    verificationStatus: any = null;
    isVerificationUploading = false;
    verificationPhoto: File | null = null;
    
    // Date properties
    maxDate = new Date();

    // Wallet balance
    balance: string = "0";

    // Deposit dialog state
    showDepositDialog = false;
    isDepositing = false;
    depositForm: any = {
        amount: null as number | null,
        cardNumber: "",
        cardHolder: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
    };

    // Gift properties
    receivedGifts: GiftDTO[] = [];
    isLoadingGifts = false;
    
    // Send Gift properties
    showSendGiftDialog = false;
    recipientUserForGift: { id: number; fullName?: string; name?: string } | null = null;

    // Tab navigation
    activeTabIndex = 0;

    genderOptions = [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
    ];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private userService: UserService,
        private friendsService: FriendsService,
        private walletService: WalletService,
        private giftService: GiftService,
        private router: Router,
        private route: ActivatedRoute,
        public onlineStatusService: OnlineStatusService,
        private websocketService: WebsocketService,
        private http: HttpClient,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        // Ensure auth token is set for UserService API calls (required for profile pictures and photos)
        this.ensureAuthHeaders();

        // Check if viewing another user's profile or own profile
        this.route.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                const userId = params.get("userId");
                if (userId) {
                    this.viewingUserId = parseInt(userId, 10);
                    this.isOwnProfile = false;
                    this.loadOtherUserProfile(this.viewingUserId);
                } else {
                    this.isOwnProfile = true;
                    this.viewingUserId = null;
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

        // Revoke all blob URLs to free memory
        this.photoBlobUrls.forEach((url) => URL.revokeObjectURL(url));
        this.photoBlobUrls.clear();

        if (this.profilePictureBlobUrl) {
            URL.revokeObjectURL(this.profilePictureBlobUrl);
        }
    }

    private loadCurrentUser(): void {
        this.userService
            .getUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user: any) => {
                    this.currentUser = user;
                    this.balance = user.balance || "0";
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
                    photos.forEach((photo) => {
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
        this.userService.getPhoto(photoId, "response").subscribe({
            next: (response: any) => {
                const blob = response.body as Blob;
                const blobUrl = URL.createObjectURL(blob);
                this.photoBlobUrls.set(photoId, blobUrl);
                this.cdr.detectChanges();
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
                next: (friends) => {
                    this.friends = friends;
                },
                error: (error) => {
                    console.error("Error loading friends:", error);
                },
            });
    }

    onPhotoUpload(event: any): void {
        if (!this.isOwnProfile) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot upload photos to another user's profile",
            });
            return;
        }

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
        return this.photoBlobUrls.get(photoId) || "";
    }

    getUserInitials(): string {
        if (!this.currentUser) return "U";
        const nameParts = this.currentUser.fullName?.split(" ") || [];
        const first = nameParts[0]?.charAt(0) || "";
        const last = nameParts[1]?.charAt(0) || "";
        return (first + last).toUpperCase() || "U";
    }

    loadUserProfile(): void {
        this.userService
            .getUserProfile()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (profile) => {
                    this.userProfile = profile;
                },
                error: (error: any) => {
                    console.error("Error loading user profile:", error);
                },
            });
    }

    openEditDialog(): void {
        if (!this.isOwnProfile) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot edit another user's profile",
            });
            return;
        }

        this.editForm = {
            gender: this.currentUser?.gender || null,
            city: this.userProfile?.city || "",
            bio: this.userProfile?.bio || "",
            location: this.userProfile?.location || "",
            interests: [...(this.userProfile?.interests || [])],
            appearsInSearches: this.userProfile?.appearsInSearches !== false,
            dateOfBirth: this.userProfile?.dateOfBirth ? new Date(this.userProfile.dateOfBirth) : null,
        };
        this.showEditDialog = true;
        this.loadVerificationStatus();
    }

    saveProfile(): void {
        if (!this.isOwnProfile) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot save changes to another user's profile",
            });
            return;
        }

        // Update basic user info (gender)
        this.userService
            .updateProfile({
                gender: this.editForm.gender,
            } as any)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    // Update user profile (bio, interests, location, privacy)
                    const profileUpdate: UpdateUserProfileDTO = {
                        bio: this.editForm.bio,
                        city: this.editForm.city,
                        location: this.editForm.location,
                        interests: this.editForm.interests,
                        appearsInSearches: this.editForm.appearsInSearches,
                        dateOfBirth: this.editForm.dateOfBirth,
                    };

                    this.userService
                        .updateUserProfile(profileUpdate)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                // Reload data
                                this.loadCurrentUser();
                                this.loadUserProfile();
                                this.showEditDialog = false;
                                this.messageService.add({
                                    severity: "success",
                                    summary: "Success",
                                    detail: "Profile updated successfully",
                                });
                            },
                            error: (error: any) => {
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

    addInterest(): void {
        if (this.newInterest && this.newInterest.trim()) {
            if (!this.editForm.interests) {
                this.editForm.interests = [];
            }
            if (!this.editForm.interests.includes(this.newInterest.trim())) {
                this.editForm.interests.push(this.newInterest.trim());
            }
            this.newInterest = "";
        }
    }

    removeInterest(interest: string): void {
        if (this.editForm.interests) {
            this.editForm.interests = this.editForm.interests.filter(
                (i: string) => i !== interest,
            );
        }
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

    loadProfilePicture(): void {
        // @ts-ignore - getProfilePicture will be available after regeneration
        this.userService
            .getProfilePicture("response")
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const blob = response.body as Blob;
                    if (this.profilePictureBlobUrl) {
                        URL.revokeObjectURL(this.profilePictureBlobUrl);
                    }
                    this.profilePictureBlobUrl = URL.createObjectURL(blob);
                    this.cdr.detectChanges();
                },
                error: (error: any) => {
                    // Profile picture not found is okay, user might not have one
                    if (error.status !== 404) {
                        console.error("Error loading profile picture:", error);
                    }
                },
            });
    }

    onProfilePictureUpload(event: any): void {
        if (!this.isOwnProfile) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot upload a profile picture for another user",
            });
            return;
        }

        const file = event.files[0];
        if (!file) return;

        this.isUploading = true;

        // @ts-ignore - uploadProfilePicture will be available after regeneration
        this.userService
            .uploadProfilePicture(file)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user: UserDTO) => {
                    this.currentUser = user;
                    this.loadProfilePicture(); // Reload the profile picture
                    this.isUploading = false;
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Profile picture uploaded successfully",
                    });
                },
                error: (error: any) => {
                    console.error("Error uploading profile picture:", error);
                    this.isUploading = false;
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to upload profile picture",
                    });
                },
            });
    }

    setPhotoAsProfilePicture(photoId: number): void {
        if (!this.isOwnProfile) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "You cannot set profile picture for another user",
            });
            return;
        }

        // @ts-ignore - setProfilePicture will be available after regeneration
        this.userService
            .setProfilePicture(photoId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user: UserDTO) => {
                    this.currentUser = user;
                    this.loadProfilePicture(); // Reload the profile picture
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Profile picture updated successfully",
                    });
                },
                error: (error: any) => {
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
        return this.profilePictureBlobUrl || "";
    }

    hasProfilePicture(): boolean {
        return !!this.profilePictureBlobUrl;
    }

    loadOtherUserProfile(userId: number): void {
        this.isLoading = true;

        // Clear previous user's photos and blob URLs to avoid stale/wrong images
        this.userPhotos = [];
        this.photoBlobUrls.forEach((url) => URL.revokeObjectURL(url));
        this.photoBlobUrls.clear();
        if (this.profilePictureBlobUrl) {
            URL.revokeObjectURL(this.profilePictureBlobUrl);
            this.profilePictureBlobUrl = null;
        }

        // @ts-ignore - getUserById will return { user, profile }
        this.userService
            .getUserById(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    this.viewingUser = response.user;
                    this.currentUser = response.user; // Also set currentUser for template compatibility
                    this.userProfile = response.profile; // Set profile data
                    this.balance = response.user.balance || "0";
                    this.loadOtherUserPhotos(userId);
                    this.loadOtherUserProfilePicture(userId);
                    this.loadReceivedGifts(); // Load gifts for the viewed user
                    this.isLoading = false;
                },
                error: (error: any) => {
                    console.error("Error loading user profile:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load user profile",
                    });
                    this.isLoading = false;
                    this.router.navigate(["/profile"]);
                },
            });
    }

    loadOtherUserPhotos(userId: number): void {
        // @ts-ignore - getUserPhotosByUserId will be available after regeneration
        this.userService
            .getUserPhotosByUserId(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (photos: UserPhotoDTO[]) => {
                    this.userPhotos = photos;

                    // Load blob URLs for all photos
                    photos.forEach((photo) => {
                        if (photo.id) {
                            this.loadPhotoBlobUrl(photo.id);
                        }
                    });
                },
                error: (error: any) => {
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
        // @ts-ignore - getProfilePictureByUserId will be available after regeneration
        this.userService
            .getProfilePictureByUserId(userId, "response")
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    const blob = response.body as Blob;
                    if (this.profilePictureBlobUrl) {
                        URL.revokeObjectURL(this.profilePictureBlobUrl);
                    }
                    this.profilePictureBlobUrl = URL.createObjectURL(blob);
                    this.cdr.detectChanges();
                },
                error: (error: any) => {
                    // Profile picture not found is okay, user might not have one
                    if (error.status !== 404) {
                        console.error("Error loading profile picture:", error);
                    }
                },
            });
    }

    openPhotoDialog(photo: UserPhotoDTO): void {
        this.selectedPhoto = photo;
        this.showPhotoDialog = true;
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
                        this.userPhotos = this.userPhotos.filter(
                            (p) => p.id !== photoId,
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

    // Verification methods
    loadVerificationStatus(): void {
        this.userService.getVerificationStatus().subscribe({
            next: (status) => {
                this.verificationStatus = status;
            },
            error: (error) => {
                console.error("Error loading verification status:", error);
            },
        });
    }

    onVerificationPhotoSelect(event: any): void {
        const file = event.files[0];
        if (file) {
            this.verificationPhoto = file;
        }
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

        this.isVerificationUploading = true;

        this.userService
            .uploadVerificationPhoto(this.verificationPhoto)
            .subscribe({
                next: (response) => {
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
                complete: () => {
                    this.isVerificationUploading = false;
                },
            });
    }

    getVerificationStatusText(): string {
        if (!this.verificationStatus) return "Not submitted";

        switch (this.verificationStatus.verificationRequest?.status) {
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

    getVerificationStatusSeverity(): string {
        if (!this.verificationStatus) return "info";

        switch (this.verificationStatus.verificationRequest?.status) {
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
        return this.verificationStatus?.verificationRequest?.status === "pending" || 
               this.verificationStatus?.verificationRequest?.status === "in_review";
    }

    private setupVerificationNotifications(): void {
        this.websocketService.onVerificationStatusChange()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notification) => {
                    console.log('Verification status changed:', notification);
                    
                    // Show notification to user
                    this.messageService.add({
                        severity: notification.status === 'verified' ? 'success' : 'warn',
                        summary: 'Verification Update',
                        detail: notification.message,
                        life: 8000
                    });

                    // Reload verification status to update UI
                    this.loadVerificationStatus();
                },
                error: (error) => {
                    console.error('Error receiving verification notification:', error);
                }
            });
    }

    getBalanceAsInteger(): string {
        const balanceValue = parseFloat(this.balance || '0');
        return Math.floor(balanceValue).toString();
    }

    openDepositDialog(): void {
        this.showDepositDialog = true;
    }

    closeDepositDialog(): void {
        this.showDepositDialog = false;
        this.isDepositing = false;
        this.depositForm = { amount: null, cardNumber: '', cardHolder: '', expiryMonth: '', expiryYear: '', cvv: '' };
    }

    formatCardNumber(event: any): void {
        let value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        this.depositForm.cardNumber = formattedValue;
    }

    submitDeposit(): void {
        if (this.depositForm.amount === null || this.depositForm.amount === undefined || this.depositForm.amount <= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Enter a positive amount' });
            return;
        }

        // Card details are mocked - they're only for UI display
        // The backend uses a mock payment provider that doesn't require actual card details
        
        const amount = Math.floor(Number(this.depositForm.amount));
        this.isDepositing = true;

        // Send deposit request to backend
        // Currency and paymentMethod are mocked/static values
        this.walletService.deposit({ 
            amount: amount.toString(), 
            currency: 'USD', 
            paymentMethod: 'card' 
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    // Update balance from response
                    this.balance = response.balance || this.balance;
                    
                    // Reload current user to ensure all data is in sync
                    if (this.isOwnProfile) {
                        this.loadCurrentUser();
                    }
                    
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: `Successfully added ${amount} tokens. New balance: ${this.getBalanceAsInteger()} tokens` 
                    });
                    this.isDepositing = false;
                    this.closeDepositDialog();
                },
                error: (error: any) => {
                    console.error('Error depositing funds:', error);
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: error.error?.message || 'Failed to add tokens. Please try again.' 
                    });
                    this.isDepositing = false;
                },
            });
    }

    loadReceivedGifts(): void {
        this.isLoadingGifts = true;
        
        if (this.isOwnProfile) {
            // Load own received gifts
            this.giftService.getReceivedGifts(100)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (gifts) => {
                        this.receivedGifts = gifts;
                        this.isLoadingGifts = false;
                        
                        // If no gifts, switch to the Received Gifts tab
                        if (gifts.length === 0) {
                            this.activeTabIndex = 6; // Received Gifts tab index
                        }
                    },
                    error: (error) => {
                        console.error("Error loading received gifts:", error);
                        this.isLoadingGifts = false;
                    },
                });
        } else if (this.viewingUserId) {
            // Load received gifts for the viewed user using the new endpoint
            const url = `${environment.apiUrl}/gifts/user/${this.viewingUserId}/received`;
            const params = { limit: 100 };
            
            this.http.get<GiftDTO[]>(url, { params })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (gifts) => {
                        this.receivedGifts = gifts || [];
                        this.isLoadingGifts = false;
                    },
                    error: (error) => {
                        console.error("Error loading received gifts for user:", error);
                        // If error, show empty list
                        this.receivedGifts = [];
                        this.isLoadingGifts = false;
                    },
                });
        } else {
            this.isLoadingGifts = false;
        }
    }

    getSenderName(gift: GiftDTO): string {
        if (!gift.sender) return "Unknown";
        const firstName = gift.sender.firstname || "";
        const lastName = gift.sender.lastname || "";
        return `${firstName} ${lastName}`.trim() || gift.sender.email || "Unknown";
    }

    getSenderNameFromSender(sender: GiftDTO['sender']): string {
        if (!sender) return "Unknown";
        const firstName = sender.firstname || "";
        const lastName = sender.lastname || "";
        return `${firstName} ${lastName}`.trim() || sender.email || "Unknown";
    }

    /**
     * Grouped gifts by sender and emoji
     */
    get groupedReceivedGifts(): Array<{
        giftEmoji: string;
        senderId: number;
        sender: GiftDTO['sender'];
        gifts: GiftDTO[];
        totalAmount: string;
        latestDate: Date;
        messages: string[];
    }> {
        const grouped = new Map<string, GiftDTO[]>();
        
        // Group gifts by senderId and giftEmoji
        this.receivedGifts.forEach(gift => {
            const senderId = gift.senderId || gift.sender?.id || 0;
            const key = `${senderId}_${gift.giftEmoji}`;
            
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(gift);
        });

        // Convert map to array and calculate totals
        return Array.from(grouped.entries()).map(([key, gifts]) => {
            const firstGift = gifts[0];
            const senderId = firstGift.senderId || firstGift.sender?.id || 0;
            
            // Calculate total amount
            const totalAmount = gifts.reduce((sum, gift) => {
                return sum + parseFloat(gift.amount || '0');
            }, 0).toFixed(8);

            // Get latest date
            const latestDate = gifts.reduce((latest, gift) => {
                const giftDate = new Date(gift.createdAt);
                return giftDate > latest ? giftDate : latest;
            }, new Date(gifts[0].createdAt));

            // Collect all non-empty messages
            const messages = gifts
                .map(g => g.message)
                .filter((msg): msg is string => !!msg && msg.trim() !== '');

            return {
                giftEmoji: firstGift.giftEmoji,
                senderId,
                sender: firstGift.sender,
                gifts,
                totalAmount,
                latestDate,
                messages
            };
        });
    }

    // Send Gift methods
    openSendGiftDialog(): void {
        if (!this.viewingUserId) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to send gift. User information not available.",
            });
            return;
        }
        
        this.recipientUserForGift = {
            id: this.viewingUserId,
            fullName: this.viewingUser?.fullName,
            name: this.viewingUser?.fullName,
        };
        this.showSendGiftDialog = true;
    }

    onGiftSent(response: any): void {
        // Gift was sent successfully, dialog is already closed
        this.recipientUserForGift = null;
        // Reload received gifts for the viewed user
        this.loadReceivedGifts();
    }

    getBalanceAsNumber(): number {
        return parseFloat(this.balance || "0");
    }

    // Video Call Methods
    startVideoCall(): void {
        if (!this.viewingUserId) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to start call. User information not available.",
            });
            return;
        }

        const recipientName = this.viewingUser?.fullName || 'Unknown User';

        // Navigate to video call page with recipient info
        this.router.navigate(['/video-call'], {
            queryParams: {
                recipientId: this.viewingUserId,
                recipientName: recipientName
            }
        });
    }
}
