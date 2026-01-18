import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Column,
    CreateDateColumn,
    Unique,
    Index,
} from "typeorm";
import { ForumComment } from "./forum-comment.entity";
import { User } from "./user.entity";

@Entity("forum_comment_vote")
@Unique(["commentId", "userId"]) // One vote per user per comment
@Index(["commentId"]) // For efficient querying of votes by comment
@Index(["userId"]) // For efficient querying of votes by user
export class ForumCommentVote {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ForumComment, { onDelete: "CASCADE" })
    @JoinColumn({ name: "commentId" })
    comment: ForumComment;

    @Column("int")
    commentId: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column("int")
    userId: number;

    @Column("varchar", { length: 10 })
    voteType: "upvote" | "downvote"; // Type of vote

    @CreateDateColumn()
    createdAt: Date;
}
