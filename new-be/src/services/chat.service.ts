import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatConversation } from "../entities/chat-conversation.entity";
import { ChatParticipant } from "../entities/chat-participant.entity";
import { ChatMessage } from "../entities/chat-message.entity";

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatConversation)
        private conversationsRepo: Repository<ChatConversation>,
        @InjectRepository(ChatParticipant)
        private participantsRepo: Repository<ChatParticipant>,
        @InjectRepository(ChatMessage)
        private messagesRepo: Repository<ChatMessage>,
    ) {}

    async getOrCreateConversation(
        userId: number,
        otherUserId: number,
    ): Promise<ChatConversation> {
        const a = Number(userId);
        const b = Number(otherUserId);
        if (!a || !b || a === b || !Number.isFinite(a) || !Number.isFinite(b)) {
            throw new BadRequestException("Invalid participants");
        }
        // Use a subquery to avoid selecting participant columns alongside aggregation
        // which triggers GROUP BY errors in Postgres when using leftJoinAndSelect.
        const existing = await this.conversationsRepo
            .createQueryBuilder("c")
            .where((qb) => {
                const sub = qb
                    .subQuery()
                    .select("cp.conversationId")
                    .from(ChatParticipant, "cp")
                    .where("cp.userId IN (:...ids)", {
                        ids: [userId, otherUserId],
                    })
                    .groupBy("cp.conversationId")
                    .having("COUNT(DISTINCT cp.userId) = 2")
                    .getQuery();
                return `c.id IN ${sub}`;
            })
            .getOne();

        if (existing) return existing;

        // Transactionally create conversation and both participants
        return await this.conversationsRepo.manager.transaction(async (trx) => {
            const conversation = await trx
                .getRepository(ChatConversation)
                .save(trx.getRepository(ChatConversation).create({}));
            const participants = [
                trx.getRepository(ChatParticipant).create({
                    conversationId: conversation.id,
                    userId: a,
                    unreadCount: 0,
                }),
                trx.getRepository(ChatParticipant).create({
                    conversationId: conversation.id,
                    userId: b,
                    unreadCount: 0,
                }),
            ];
            await trx.getRepository(ChatParticipant).save(participants);
            return conversation;
        });
    }

    async getConversationsForUser(userId: number) {
        // Filter membership via inner join alias, but still load ALL participants for each conversation
        const conversations = await this.conversationsRepo
            .createQueryBuilder("c")
            .innerJoin("c.participants", "pf", "pf.userId = :userId", {
                userId,
            })
            .leftJoinAndSelect("c.participants", "p")
            .leftJoinAndSelect("c.messages", "m")
            .loadRelationCountAndMap(
                "c.unreadCount",
                "c.messages",
                "um",
                (qb) => qb.where("um.isRead = false"),
            )
            .orderBy("m.createdAt", "DESC")
            .getMany();

        // Attach other participant lightweight profile
        for (const conv of conversations) {
            const others =
                (conv as any).participants?.filter(
                    (pp: any) => pp.userId !== userId,
                ) || [];
            if (others.length > 0) {
                const other = others[0];
                // Lazy-load user via participant.user relation if available
                if (!other.user) {
                    other.user = await this.participantsRepo
                        .createQueryBuilder("cp")
                        .leftJoinAndSelect("cp.user", "u")
                        .where("cp.id = :id", { id: other.id })
                        .getOne()
                        .then((r) => (r as any)?.user);
                }
                (conv as any).otherUser = other?.user
                    ? {
                          id: other.user.id,
                          firstname: other.user.firstname,
                          lastname: other.user.lastname,
                          email: other.user.email,
                      }
                    : undefined;
            }
        }
        // Return a normalized shape: participants as userId[] only
        return conversations.map((c: any) => ({
            id: c.id,
            participants: (c.participants || []).map((p: any) => p.userId),
            messages: c.messages,
            unreadCount: (c as any).unreadCount ?? 0,
            otherUser: (c as any).otherUser,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));
    }

    async getMessagesForConversation(conversationId: number) {
        return this.messagesRepo.find({
            where: { conversationId },
            order: { createdAt: "ASC" },
        });
    }

    async sendMessage(
        conversationId: number,
        senderId: number,
        content: string,
        type: "text" | "image" | "file" = "text",
    ) {
        const message = await this.messagesRepo.save(
            this.messagesRepo.create({
                conversationId,
                senderId,
                content,
                type,
            }),
        );
        await this.participantsRepo
            .createQueryBuilder()
            .update(ChatParticipant)
            .set({ unreadCount: () => "unreadCount + 1" })
            .where("conversationId = :conversationId", { conversationId })
            .andWhere("userId != :senderId", { senderId })
            .execute();
        return message;
    }
}
