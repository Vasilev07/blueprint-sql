import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import {
    ForumPostsService,
    ForumCommentsService,
} from "../../typescript-api-client/src/api/api";
import {
    ForumPostDTO,
    ForumCommentDTO,
    CreateForumCommentDTO,
} from "../../typescript-api-client/src/model/models";
import { MessageService } from "primeng/api";
import { AuthService } from "../services/auth.service";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { TagModule } from "primeng/tag";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";

@Component({
    selector: "app-post-detail",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TooltipModule,
        TagModule,
        ProgressSpinnerModule,
        DialogModule,
        TextareaModule,
    ],
    templateUrl: "./post-detail.component.html",
    styleUrls: ["./post-detail.component.scss"],
})
export class PostDetailComponent implements OnInit, OnDestroy {
    roomId!: number;
    postId!: number;
    post: ForumPostDTO | null = null;
    comments: ForumCommentDTO[] = [];
    loading = false;
    showCommentDialog = false;
    newCommentContent = "";
    replyToCommentId: number | null = null;
    currentUserId: number | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private forumPostsService: ForumPostsService,
        private forumCommentsService: ForumCommentsService,
        private messageService: MessageService,
        private authService: AuthService,
    ) {
        this.currentUserId = this.authService.getUserId();
    }

    ngOnInit(): void {
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            this.roomId = +params["roomId"];
            this.postId = +params["postId"];
            this.loadPost();
            this.loadComments();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadPost(): void {
        this.forumPostsService
            .getPostById(this.postId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (post) => {
                    this.post = post;
                },
                error: (error) => {
                    console.error("Error loading post:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load post",
                    });
                    this.router.navigate(["/forum/room", this.roomId]);
                },
            });
    }

    loadComments(): void {
        this.loading = true;
        this.forumCommentsService
            .getCommentsByPost(this.postId, 100, 0, 5)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (comments) => {
                    this.comments = comments || [];
                    this.loading = false;
                },
                error: (error) => {
                    console.error("Error loading comments:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load comments",
                    });
                    this.loading = false;
                },
            });
    }

    openCommentDialog(replyToCommentId?: number): void {
        if (this.post?.isLocked) {
            this.messageService.add({
                severity: "warn",
                summary: "Warning",
                detail: "This post is locked and cannot be commented on",
            });
            return;
        }
        this.replyToCommentId = replyToCommentId || null;
        this.showCommentDialog = true;
        this.newCommentContent = "";
    }

    createComment(): void {
        if (!this.newCommentContent.trim()) {
            this.messageService.add({
                severity: "warn",
                summary: "Warning",
                detail: "Comment content is required",
            });
            return;
        }

        const dto: CreateForumCommentDTO = {
            postId: this.postId,
            content: this.newCommentContent.trim(),
            parentCommentId: this.replyToCommentId || undefined,
        };

        this.forumCommentsService
            .createComment(dto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: "success",
                        summary: "Success",
                        detail: "Comment created successfully",
                    });
                    this.showCommentDialog = false;
                    this.loadComments();
                    if (this.post) {
                        this.loadPost(); // Reload to update comment count
                    }
                },
                error: (error) => {
                    console.error("Error creating comment:", error);
                    this.messageService.add({
                        severity: "error",
                        summary: "Error",
                        detail: error?.error?.message || "Failed to create comment",
                    });
                },
            });
    }

    getTopLevelComments(): ForumCommentDTO[] {
        return this.comments.filter((c) => !c.parentCommentId);
    }

    getRepliesToComment(commentId: number): ForumCommentDTO[] {
        return this.comments.filter((c) => c.parentCommentId === commentId);
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString();
    }

    formatTime(date: string): string {
        return new Date(date).toLocaleTimeString();
    }

    goBack(): void {
        this.router.navigate(["/forum/room", this.roomId]);
    }
}

