import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Inject,
    OnModuleInit,
} from "@nestjs/common";
import { EntityManager } from "typeorm";
import { LiveStreamSession } from "../entities/live-stream-session.entity";
import { User } from "../entities/user.entity";
import { SessionStatus } from "../enums/session-status.enum";
import { v4 as uuidv4 } from "uuid";
import { LiveStreamSessionDTO } from "../models/live-stream-session.dto";
import { StartLiveStreamSessionDTO } from "../models/start-live-stream-session.dto";
import { CreateLiveStreamRoomDTO } from "../models/create-live-stream-room.dto";
import { JoinLiveStreamRoomDTO } from "../models/join-live-stream-room.dto";
import { LeaveLiveStreamRoomDTO } from "../models/leave-live-stream-room.dto";
import { MapperService } from "@mappers/mapper.service";
import { BaseMapper } from "@mappers/base.mapper";

@Injectable()
export class LiveStreamSessionService implements OnModuleInit {
    private liveStreamSessionMapper: BaseMapper<
        LiveStreamSession,
        LiveStreamSessionDTO
    >;

    constructor(
        private readonly entityManager: EntityManager,
        @Inject(MapperService) private readonly mapperService: MapperService,
    ) {}

    public onModuleInit(): void {
        this.liveStreamSessionMapper =
            this.mapperService.getMapper("LiveStreamSession");
    }

    async startSession(
        startSessionDto: StartLiveStreamSessionDTO,
    ): Promise<LiveStreamSessionDTO> {
        const {
            initiatorId,
            recipientId,
            isLiveStream,
            maxParticipants,
            roomName,
        } = startSessionDto;

        // Validate users exist
        const initiator = await this.entityManager.findOne(User, {
            where: { id: initiatorId },
        });

        if (!initiator) {
            throw new NotFoundException("Initiator not found");
        }

        let recipient: User | null = null;
        if (recipientId) {
            recipient = await this.entityManager.findOne(User, {
                where: { id: recipientId },
            });

            if (!recipient) {
                throw new NotFoundException("Recipient not found");
            }

            if (initiatorId === recipientId) {
                throw new BadRequestException("Cannot call yourself");
            }
        }

        // Check if there's already an active call between these users (only for 1-to-1 calls)
        if (recipientId && !isLiveStream) {
            const existingSession = await this.entityManager.findOne(
                LiveStreamSession,
                {
                    where: [
                        {
                            initiatorId,
                            recipientId,
                            status: SessionStatus.ACTIVE,
                        },
                        {
                            initiatorId,
                            recipientId,
                            status: SessionStatus.RINGING,
                        },
                        {
                            initiatorId: recipientId,
                            recipientId: initiatorId,
                            status: SessionStatus.ACTIVE,
                        },
                        {
                            initiatorId: recipientId,
                            recipientId: initiatorId,
                            status: SessionStatus.RINGING,
                        },
                    ],
                },
            );

            if (existingSession) {
                throw new BadRequestException(
                    "There is already an active call between these users",
                );
            }
        }

        // Create new session
        const liveStreamSession = new LiveStreamSession();
        liveStreamSession.id = uuidv4();
        liveStreamSession.initiator = initiator;
        liveStreamSession.initiatorId = initiatorId;
        liveStreamSession.recipient = recipient;
        liveStreamSession.recipientId = recipientId;
        liveStreamSession.status = isLiveStream
            ? SessionStatus.ACTIVE
            : SessionStatus.PENDING;
        liveStreamSession.isLiveStream = isLiveStream || false;
        liveStreamSession.roomName = roomName || null;
        liveStreamSession.maxParticipants =
            maxParticipants || (isLiveStream ? 50 : 2);

        await this.entityManager.save(LiveStreamSession, liveStreamSession);

        return this.liveStreamSessionMapper.entityToDTO(liveStreamSession);
    }

    async getSessionById(sessionId: string): Promise<LiveStreamSessionDTO> {
        const session = await this.entityManager.findOne(LiveStreamSession, {
            where: { id: sessionId },
            relations: ["initiator", "recipient"],
        });

        if (!session) {
            throw new NotFoundException(
                `Session with ID ${sessionId} not found`,
            );
        }

        return this.liveStreamSessionMapper.entityToDTO(session);
    }

    async updateSessionStatus(
        sessionId: string,
        status: SessionStatus,
        additionalData?: Partial<LiveStreamSession>,
    ): Promise<LiveStreamSessionDTO> {
        const session = await this.entityManager.findOne(LiveStreamSession, {
            where: { id: sessionId },
            relations: ["initiator", "recipient"],
        });

        if (!session) {
            throw new NotFoundException(
                `Session with ID ${sessionId} not found`,
            );
        }

        session.status = status;

        if (status === SessionStatus.ACTIVE && !session.startedAt) {
            session.startedAt = new Date();
        }

        if (
            (status === SessionStatus.ENDED ||
                status === SessionStatus.REJECTED ||
                status === SessionStatus.MISSED ||
                status === SessionStatus.FAILED) &&
            !session.endedAt
        ) {
            session.endedAt = new Date();

            // Calculate duration if session was active
            if (session.startedAt) {
                const durationMs =
                    session.endedAt.getTime() - session.startedAt.getTime();
                session.durationSeconds = Math.floor(durationMs / 1000);
            }
        }

        // Apply any additional data
        if (additionalData) {
            Object.assign(session, additionalData);
        }

        await this.entityManager.save(LiveStreamSession, session);

        return this.liveStreamSessionMapper.entityToDTO(session);
    }

    async endSession(
        sessionId: string,
        endReason?: string,
    ): Promise<LiveStreamSessionDTO> {
        return this.updateSessionStatus(sessionId, SessionStatus.ENDED, {
            endReason: endReason || "Session ended",
        });
    }

    async getSessionsByUserId(
        userId: number,
        limit: number = 50,
    ): Promise<LiveStreamSessionDTO[]> {
        const sessions = await this.entityManager.find(LiveStreamSession, {
            where: [{ initiatorId: userId }, { recipientId: userId }],
            relations: ["initiator", "recipient"],
            order: { createdAt: "DESC" },
            take: limit,
        });

        return sessions.map((session) =>
            this.liveStreamSessionMapper.entityToDTO(session),
        );
    }

    async getActiveSessionByUserId(
        userId: number,
    ): Promise<LiveStreamSessionDTO | null> {
        const session = await this.entityManager.findOne(LiveStreamSession, {
            where: [
                { initiatorId: userId, status: SessionStatus.ACTIVE },
                { recipientId: userId, status: SessionStatus.ACTIVE },
                { initiatorId: userId, status: SessionStatus.RINGING },
                { recipientId: userId, status: SessionStatus.RINGING },
            ],
            relations: ["initiator", "recipient"],
        });

        return session
            ? this.liveStreamSessionMapper.entityToDTO(session)
            : null;
    }

    // Streaming room methods
    async createLiveStreamRoom(
        createLiveStreamRoomDto: CreateLiveStreamRoomDTO,
    ): Promise<LiveStreamSessionDTO> {
        const { initiatorId, roomName, maxParticipants } =
            createLiveStreamRoomDto;

        // Validate user exists
        const initiator = await this.entityManager.findOne(User, {
            where: { id: initiatorId },
        });

        if (!initiator) {
            throw new NotFoundException("Initiator not found");
        }

        // Create live stream room
        const liveStreamSession = new LiveStreamSession();
        liveStreamSession.id = uuidv4();
        liveStreamSession.initiator = initiator;
        liveStreamSession.initiatorId = initiatorId;
        liveStreamSession.recipient = null;
        liveStreamSession.recipientId = null;
        liveStreamSession.status = SessionStatus.ACTIVE;
        liveStreamSession.isLiveStream = true;
        liveStreamSession.roomName = roomName;
        liveStreamSession.maxParticipants = maxParticipants || 50;

        await this.entityManager.save(LiveStreamSession, liveStreamSession);

        return this.liveStreamSessionMapper.entityToDTO(liveStreamSession);
    }

    async joinLiveStreamRoom(
        joinLiveStreamRoomDto: JoinLiveStreamRoomDTO,
    ): Promise<LiveStreamSessionDTO> {
        const { sessionId, userId } = joinLiveStreamRoomDto;

        // Validate user exists
        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Get the stream room
        const session = await this.entityManager.findOne(LiveStreamSession, {
            where: { id: sessionId },
            relations: ["initiator"],
        });

        if (!session) {
            throw new NotFoundException(
                `Live stream room with ID ${sessionId} not found`,
            );
        }

        if (!session.isLiveStream) {
            throw new BadRequestException("This is not a live streaming room");
        }

        if (session.status !== SessionStatus.ACTIVE) {
            throw new BadRequestException("Live stream room is not active");
        }

        // Check if room is full (we'll need to track participants separately)
        // For now, just return the session - participant tracking will be handled by the gateway

        return this.liveStreamSessionMapper.entityToDTO(session);
    }

    async leaveLiveStreamRoom(
        leaveLiveStreamRoomDto: LeaveLiveStreamRoomDTO,
    ): Promise<void> {
        const { sessionId, userId } = leaveLiveStreamRoomDto;

        // Validate user exists
        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Get the stream room
        const session = await this.entityManager.findOne(LiveStreamSession, {
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException(
                `Live stream room with ID ${sessionId} not found`,
            );
        }

        if (!session.isLiveStream) {
            throw new BadRequestException("This is not a live streaming room");
        }

        // If the user leaving is the streamer/initiator, end the room
        if (session.initiatorId === userId) {
            await this.endSession(sessionId, "Streamer ended the room");
        }

        // Note: Participant tracking and cleanup will be handled by the gateway
    }

    async getLiveStreamRooms(
        limit: number = 50,
    ): Promise<LiveStreamSessionDTO[]> {
        const rooms = await this.entityManager.find(LiveStreamSession, {
            where: {
                isLiveStream: true,
                status: SessionStatus.ACTIVE,
            },
            relations: ["initiator"],
            order: { createdAt: "DESC" },
            take: limit,
        });

        return rooms.map((room) =>
            this.liveStreamSessionMapper.entityToDTO(room),
        );
    }

    async getLiveStreamRoomById(
        sessionId: string,
    ): Promise<LiveStreamSessionDTO> {
        const session = await this.entityManager.findOne(LiveStreamSession, {
            where: { id: sessionId },
            relations: ["initiator"],
        });

        if (!session) {
            throw new NotFoundException(
                `Live stream room with ID ${sessionId} not found`,
            );
        }

        if (!session.isLiveStream) {
            throw new BadRequestException("This is not a live streaming room");
        }

        return this.liveStreamSessionMapper.entityToDTO(session);
    }
}
