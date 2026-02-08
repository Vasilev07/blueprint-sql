import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import {
    ForumRoomsService,
    ForumPostsService,
    ForumCommentsService,
    UserService,
} from "../../typescript-api-client/src/api/api";
import {
    ForumRoomDTO,
    ForumPostDTO,
    ForumCommentDTO,
    CreateForumPostDTO,
    CreateForumCommentDTO,
    JoinForumRoomDTO,
    VoteForumCommentDTO,
} from "../../typescript-api-client/src/model/models";
import { MessageService } from "primeng/api";
import { AuthService } from "../services/auth.service";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { TagModule } from "primeng/tag";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { DialogModule } from "primeng/dialog";

@Component({
    selector: "app-room-detail",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TooltipModule,
        TagModule,
        ProgressSpinnerModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
    ],
    templateUrl: "./room-detail.component.html",
    styleUrls: ["./room-detail.component.scss"],
})
export class RoomDetailComponent implements OnInit, OnDestroy {
    roomId!: number;
    room: ForumRoomDTO | null = null;
    posts: ForumPostDTO[] = [];
    postComments: Map<number, ForumCommentDTO[]> = new Map();
    expandedPosts: Set<number> = new Set();
    loading = false;
    loadingComments: Set<number> = new Set();
    showCreatePostDialog = false;
    newPostTitle = "";
    newPostContent = "";
    isMember = false;
    currentUserId: number | null = null;
    commentInputs: Map<number, string> = new Map();
    replyInputs: Map<string, string> = new Map();
    showReplyInputs: Map<string, boolean> = new Map();
    profilePictures: Map<number, string> = new Map();
    loadingProfilePictures: Set<number> = new Set();
    
    // Voting state: Map<commentId, 'upvote' | 'downvote' | null>
    commentVotes: Map<number, 'upvote' | 'downvote' | null> = new Map();
    // Vote counts: Map<commentId, { upvotes: number, downvotes: number }>
    commentVoteCounts: Map<number, { upvotes: number; downvotes: number }> = new Map();
    
    // Default avatar SVG
    defaultAvatar =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZGRkIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTI1IDcwIGMyMC0xMCAzMC0xMCA1MCAwIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private forumRoomsService: ForumRoomsService,
        private forumPostsService: ForumPostsService,
        private forumCommentsService: ForumCommentsService,
        private userService: UserService,
        private messageService: MessageService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
    ) {
        this.currentUserId = this.authService.getUserId();
    }

    ngOnInit(): void {
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            this.roomId = +params["roomId"];
            this.loadRoom();
            this.loadPosts();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        
        // Clean up blob URLs
        this.profilePictures.forEach((url) => {
            if (url !== this.defaultAvatar && url.startsWith("blob:")) {
                URL.revokeObjectURL(url);
            }
        });
        this.profilePictures.clear();
    }

    loadRoom(): void {
        this.forumRoomsService
            .getRoomById(this.roomId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (room) => {
                    this.room = room;
                    this.checkMembership();
                },
                error: (error) => {
                    console.error("Error loading room:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load room",
                    });
                    this.router.navigate(["/forum"]);
                },
            });
    }

    checkMembership(): void {
        if (this.currentUserId && this.room) {
            this.forumRoomsService
                .getRoomMembers(this.roomId)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (members) => {
                        this.isMember = members.some(
                            (m) => m.userId === this.currentUserId && m.status === "joined",
                        );
                    },
                    error: () => {
                        this.isMember = false;
                    },
                });
        }
    }

    loadPosts(): void {
        this.loading = true;
        this.forumPostsService
            .getPostsByRoom(this.roomId, 50, 0, "createdAt")
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (posts) => {
                    this.posts = posts || [];
                    // Initialize comment inputs for each post
                    posts.forEach((post) => {
                        if (post.id) {
                            this.commentInputs.set(post.id, "");
                        }
                        // Load profile pictures for post authors
                        if (post.authorId) {
                            this.loadProfilePicture(post.authorId);
                        }
                    });
                    this.loading = false;
                },
                error: (error) => {
                    console.error("Error loading posts:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load posts",
                    });
                    this.loading = false;
                },
            });
    }

    toggleComments(postId: number | undefined): void {
        if (!postId) return;
        if (this.expandedPosts.has(postId)) {
            this.expandedPosts.delete(postId);
            // Create new Set to trigger change detection
            this.expandedPosts = new Set(this.expandedPosts);
        } else {
            this.expandedPosts.add(postId);
            // Create new Set to trigger change detection
            this.expandedPosts = new Set(this.expandedPosts);
            // Always reload comments to ensure they're up to date
            this.loadCommentsForPost(postId);
        }
        this.cdr.detectChanges();
    }

    loadCommentsForPost(postId: number): void {
        // Check if already loading
        if (this.loadingComments.has(postId)) {
            return;
        }

        this.loadingComments.add(postId);
        this.forumCommentsService
            .getCommentsByPost(postId, 100, 0, 5)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (comments) => {
                    console.log(`Loaded ${comments?.length || 0} comments for post ${postId}`, comments);
                    this.postComments.set(postId, comments || []);
                    
                    // Load profile pictures for comment authors and initialize vote counts from backend
                    if (comments) {
                        comments.forEach((comment) => {
                            if (comment.authorId) {
                                this.loadProfilePicture(comment.authorId);
                            }
                            // Initialize vote counts from backend DTO
                            if (comment.id) {
                                this.commentVoteCounts.set(comment.id, {
                                    upvotes: comment.upvoteCount ?? 0,
                                    downvotes: comment.downvoteCount ?? 0
                                });
                                // Initialize user vote from backend DTO if available
                                if (comment.userVote !== undefined) {
                                    const vote = comment.userVote === null ? null : (comment.userVote as 'upvote' | 'downvote' | null);
                                    this.commentVotes.set(comment.id, vote);
                                }
                            }
                        });
                    }
                    
                    // Create new Map to trigger change detection
                    this.postComments = new Map(this.postComments);
                    this.loadingComments.delete(postId);
                    // Create new Set to trigger change detection
                    this.loadingComments = new Set(this.loadingComments);
                    // Force change detection
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error("Error loading comments:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load comments",
                    });
                    this.loadingComments.delete(postId);
                    // Create new Set to trigger change detection
                    this.loadingComments = new Set(this.loadingComments);
                    this.cdr.detectChanges();
                },
            });
    }

    getTopLevelComments(postId: number | undefined): ForumCommentDTO[] {
        if (!postId) return [];
        const comments = this.postComments.get(postId) || [];
        return comments.filter((c) => !c.parentCommentId);
    }

    getRepliesToComment(postId: number | undefined, commentId: number | undefined): ForumCommentDTO[] {
        if (!postId || !commentId) return [];
        const comments = this.postComments.get(postId) || [];
        return comments.filter((c) => c.parentCommentId === commentId);
    }

    toggleReplyInput(postId: number | undefined, commentId?: number | undefined): void {
        if (!postId) return;
        const key = commentId ? `${postId}-${commentId}` : postId.toString();
        const current = this.showReplyInputs.get(key) || false;
        this.showReplyInputs.set(key, !current);
        if (!current && commentId) {
            this.replyInputs.set(key, "");
        }
    }

    submitComment(postId: number | undefined): void {
        if (!postId) return;
        const content = this.commentInputs.get(postId)?.trim();
        if (!content) {
            this.messageService.add({
                severity: "warn",
                summary: "Warning",
                detail: "Comment cannot be empty",
            });
            return;
        }

        const post = this.posts.find((p) => p.id === postId);
        if (post?.isLocked) {
            this.messageService.add({
                severity: "warn",
                summary: "Warning",
                detail: "This post is locked",
            });
            return;
        }

        const dto: CreateForumCommentDTO = {
            postId: postId,
            content: content,
        };

        this.forumCommentsService
            .createComment(dto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                    next: (comment) => {
                    this.commentInputs.set(postId, "");
                    // Load profile picture for the new comment author
                    if (comment?.authorId) {
                        this.loadProfilePicture(comment.authorId);
                    }
                    this.loadCommentsForPost(postId);
                    // Reload posts to update comment count
                    this.loadPosts();
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Comment posted",
                    });
                },
                error: (error) => {
                    console.error("Error creating comment:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: error?.error?.message || "Failed to post comment",
                    });
                },
            });
    }

    submitReply(postId: number | undefined, parentCommentId: number | undefined): void {
        if (!postId || !parentCommentId) return;
        const key = `${postId}-${parentCommentId}`;
        const content = this.replyInputs.get(key)?.trim();
        if (!content) {
            this.messageService.add({
                severity: "warn",
                summary: "Warning",
                detail: "Reply cannot be empty",
            });
            return;
        }

        const post = this.posts.find((p) => p.id === postId);
        if (post?.isLocked) {
            this.messageService.add({
                severity: "warn",
                summary: "Warning",
                detail: "This post is locked",
            });
            return;
        }

        const dto: CreateForumCommentDTO = {
            postId: postId,
            parentCommentId: parentCommentId,
            content: content,
        };

        this.forumCommentsService
            .createComment(dto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (reply) => {
                    this.replyInputs.delete(key);
                    this.showReplyInputs.set(key, false);
                    // Load profile picture for the new reply author
                    if (reply?.authorId) {
                        this.loadProfilePicture(reply.authorId);
                    }
                    this.loadCommentsForPost(postId);
                    this.loadPosts();
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Reply posted",
                    });
                },
                error: (error) => {
                    console.error("Error creating reply:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: error?.error?.message || "Failed to post reply",
                    });
                },
            });
    }

    upvoteComment(commentId: number | undefined): void {
        if (!commentId) return;
        
        // Optimistic update
        const currentVote = this.commentVotes.get(commentId);
        const voteCounts = this.commentVoteCounts.get(commentId) || { upvotes: 0, downvotes: 0 };
        
        if (currentVote === 'upvote') {
            // Optimistically remove upvote
            this.commentVotes.set(commentId, null);
            voteCounts.upvotes = Math.max(0, voteCounts.upvotes - 1);
        } else if (currentVote === 'downvote') {
            // Optimistically change from downvote to upvote
            this.commentVotes.set(commentId, 'upvote');
            voteCounts.downvotes = Math.max(0, voteCounts.downvotes - 1);
            voteCounts.upvotes = voteCounts.upvotes + 1;
        } else {
            // Optimistically add upvote
            this.commentVotes.set(commentId, 'upvote');
            voteCounts.upvotes = voteCounts.upvotes + 1;
        }
        
        this.commentVoteCounts.set(commentId, voteCounts);
        this.commentVotes = new Map(this.commentVotes);
        this.commentVoteCounts = new Map(this.commentVoteCounts);
        this.cdr.detectChanges();

        // Call backend API
        const dto: VoteForumCommentDTO = { voteType: 'upvote' };
        this.forumCommentsService
            .voteComment(commentId, dto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updatedComment) => {
                    // Update with backend response
                    if (updatedComment.id) {
                        this.commentVoteCounts.set(updatedComment.id, {
                            upvotes: updatedComment.upvoteCount ?? 0,
                            downvotes: updatedComment.downvoteCount ?? 0
                        });
                        const vote = updatedComment.userVote === null ? null : (updatedComment.userVote as 'upvote' | 'downvote' | null);
                        this.commentVotes.set(updatedComment.id, vote);
                        
                        // Update comment in postComments map if it exists
                        this.postComments.forEach((comments, postId) => {
                            const index = comments.findIndex(c => c.id === updatedComment.id);
                            if (index !== -1) {
                                comments[index] = updatedComment;
                                this.postComments.set(postId, [...comments]);
                            }
                        });
                        
                        // Trigger change detection
                        this.commentVotes = new Map(this.commentVotes);
                        this.commentVoteCounts = new Map(this.commentVoteCounts);
                        this.postComments = new Map(this.postComments);
                        this.cdr.detectChanges();
                    }
                },
                error: (error) => {
                    console.error("Error voting on comment:", error);
                    // Revert optimistic update by reloading comments
                    const comment = Array.from(this.postComments.values())
                        .flat()
                        .find(c => c.id === commentId);
                    if (comment?.postId) {
                        this.loadCommentsForPost(comment.postId);
                    }
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: error?.error?.message || "Failed to vote on comment",
                    });
                },
            });
    }

    downvoteComment(commentId: number | undefined): void {
        if (!commentId) return;
        
        // Optimistic update
        const currentVote = this.commentVotes.get(commentId);
        const voteCounts = this.commentVoteCounts.get(commentId) || { upvotes: 0, downvotes: 0 };
        
        if (currentVote === 'downvote') {
            // Optimistically remove downvote
            this.commentVotes.set(commentId, null);
            voteCounts.downvotes = Math.max(0, voteCounts.downvotes - 1);
        } else if (currentVote === 'upvote') {
            // Optimistically change from upvote to downvote
            this.commentVotes.set(commentId, 'downvote');
            voteCounts.upvotes = Math.max(0, voteCounts.upvotes - 1);
            voteCounts.downvotes = voteCounts.downvotes + 1;
        } else {
            // Optimistically add downvote
            this.commentVotes.set(commentId, 'downvote');
            voteCounts.downvotes = voteCounts.downvotes + 1;
        }
        
        this.commentVoteCounts.set(commentId, voteCounts);
        this.commentVotes = new Map(this.commentVotes);
        this.commentVoteCounts = new Map(this.commentVoteCounts);
        this.cdr.detectChanges();

        // Call backend API
        const dto: VoteForumCommentDTO = { voteType: 'downvote' };
        this.forumCommentsService
            .voteComment(commentId, dto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updatedComment) => {
                    // Update with backend response
                    if (updatedComment.id) {
                        this.commentVoteCounts.set(updatedComment.id, {
                            upvotes: updatedComment.upvoteCount ?? 0,
                            downvotes: updatedComment.downvoteCount ?? 0
                        });
                        const vote = updatedComment.userVote === null ? null : (updatedComment.userVote as 'upvote' | 'downvote' | null);
                        this.commentVotes.set(updatedComment.id, vote);
                        
                        // Update comment in postComments map if it exists
                        this.postComments.forEach((comments, postId) => {
                            const index = comments.findIndex(c => c.id === updatedComment.id);
                            if (index !== -1) {
                                comments[index] = updatedComment;
                                this.postComments.set(postId, [...comments]);
                            }
                        });
                        
                        // Trigger change detection
                        this.commentVotes = new Map(this.commentVotes);
                        this.commentVoteCounts = new Map(this.commentVoteCounts);
                        this.postComments = new Map(this.postComments);
                        this.cdr.detectChanges();
                    }
                },
                error: (error) => {
                    console.error("Error voting on comment:", error);
                    // Revert optimistic update by reloading comments
                    const comment = Array.from(this.postComments.values())
                        .flat()
                        .find(c => c.id === commentId);
                    if (comment?.postId) {
                        this.loadCommentsForPost(comment.postId);
                    }
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: error?.error?.message || "Failed to vote on comment",
                    });
                },
            });
    }

    getCommentScore(commentId: number | undefined): number {
        if (!commentId) return 0;
        const counts = this.commentVoteCounts.get(commentId) || { upvotes: 0, downvotes: 0 };
        return counts.upvotes - counts.downvotes;
    }

    getCommentVote(commentId: number | undefined): 'upvote' | 'downvote' | null {
        if (!commentId) return null;
        return this.commentVotes.get(commentId) || null;
    }

    joinRoom(): void {
        const dto: JoinForumRoomDTO = { roomId: this.roomId };
        this.forumRoomsService
            .joinRoom(this.roomId, dto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Joined room successfully",
                    });
                    this.isMember = true;
                    this.loadRoom();
                },
                error: (error) => {
                    console.error("Error joining room:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: error?.error?.message || "Failed to join room",
                    });
                },
            });
    }


    openCreatePostDialog(): void {
        if (!this.isMember) {
            this.messageService.add({
                severity: "warn",
                summary: "Warning",
                detail: "You must be a member to create posts",
            });
            return;
        }
        this.showCreatePostDialog = true;
        this.newPostTitle = "";
        this.newPostContent = "";
    }

    createPost(): void {
        if (!this.newPostTitle.trim() || !this.newPostContent.trim()) {
            this.messageService.add({
                severity: "warn",
                summary: "Warning",
                detail: "Title and content are required",
            });
            return;
        }

        const dto: CreateForumPostDTO = {
            roomId: this.roomId,
            title: this.newPostTitle.trim(),
            content: this.newPostContent.trim(),
        };

        this.forumPostsService
            .createPost(dto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (post) => {
                    // Load profile picture for the new post author
                    if (post?.authorId) {
                        this.loadProfilePicture(post.authorId);
                    }
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Post created successfully",
                    });
                    this.showCreatePostDialog = false;
                    this.loadPosts();
                },
                error: (error) => {
                    console.error("Error creating post:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: error?.error?.message || "Failed to create post",
                    });
                },
            });
    }

    formatDate(date: string): string {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString();
    }

    formatTime(date: string): string {
        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    trackByCommentId(index: number, comment: ForumCommentDTO): number {
        return comment.id || index;
    }

    hasCommentsLoaded(postId: number | undefined): boolean {
        if (!postId) return false;
        return this.postComments.has(postId);
    }

    getCommentsCount(postId: number | undefined): number {
        if (!postId) return 0;
        return this.postComments.get(postId)?.length || 0;
    }

    

    loadProfilePicture(userId: number): void {
        // Skip if already loaded or loading
        if (this.profilePictures.has(userId) || this.loadingProfilePictures.has(userId)) {
            return;
        }

        this.loadingProfilePictures.add(userId);
        // Set default avatar initially
        this.profilePictures.set(userId, this.defaultAvatar);

        this.userService
            .getProfilePictureByUserId(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob: Blob) => {
                    if (blob.size > 0) {
                        const objectURL = URL.createObjectURL(blob);
                        this.profilePictures.set(userId, objectURL);
                    } else {
                        this.profilePictures.set(userId, this.defaultAvatar);
                    }
                    this.loadingProfilePictures.delete(userId);
                    // Create new Map to trigger change detection
                    this.profilePictures = new Map(this.profilePictures);
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    // Profile picture not found is okay
                    if (error.status !== 404) {
                        console.error(`Error loading profile picture for user ${userId}:`, error);
                    }
                    this.profilePictures.set(userId, this.defaultAvatar);
                    this.loadingProfilePictures.delete(userId);
                    // Create new Map to trigger change detection
                    this.profilePictures = new Map(this.profilePictures);
                    this.cdr.detectChanges();
                },
            });
    }

    getProfilePicture(userId: number | undefined): string {
        if (!userId) return this.defaultAvatar;
        return this.profilePictures.get(userId) || this.defaultAvatar;
    }

    onImageError(event: Event, userId: number | undefined): void {
        if (userId) {
            this.profilePictures.set(userId, this.defaultAvatar);
            this.profilePictures = new Map(this.profilePictures);
        }
        const img = event.target as HTMLImageElement;
        img.src = this.defaultAvatar;
    }

    goBack(): void {
        this.router.navigate(["/forum"]);
    }
}

