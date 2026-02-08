import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { ForumPost } from "./forum-post.entity";
import { User } from "./user.entity";
import { ForumCommentVote } from "./forum-comment-vote.entity";

@Entity("forum_comment")
export class ForumComment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ForumPost, (post) => post.comments, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "postId" })
    post: ForumPost;

    @Column("int")
    postId: number;

    @ManyToOne(() => ForumComment, (comment) => comment.replies, {
        nullable: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "parentCommentId" })
    parentComment: ForumComment | null;

    @Column("int", { nullable: true })
    parentCommentId: number | null; // null = top-level comment, otherwise = reply

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "authorId" })
    author: User;

    @Column("int")
    authorId: number;

    @Column("text")
    content: string;

    @Column("varchar", { length: 20, default: "text" })
    type: "text" | "image" | "file";

    @Column("int", { default: 0 })
    replyCount: number; // Denormalized count of nested replies

    @Column("int", { default: 0 })
    upvoteCount: number; // Count of upvotes

    @Column("int", { default: 0 })
    downvoteCount: number; // Count of downvotes

    @Column("int", { default: 0 })
    likeCount: number; // Deprecated - kept for backward compatibility, will be removed in future

    @Column("int", { default: 0 })
    depth: number; // 0 = comment on post, 1 = reply to comment, 2+ = nested reply

    @Column("varchar", { length: 20, default: "active" })
    status: "active" | "deleted" | "hidden"; // soft delete

    @OneToMany(() => ForumComment, (comment) => comment.parentComment)
    replies: ForumComment[];

    @OneToMany(() => ForumCommentVote, (vote) => vote.comment)
    votes: ForumCommentVote[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
