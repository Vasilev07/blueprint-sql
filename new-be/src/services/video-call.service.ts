import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Inject,
    OnModuleInit,
} from "@nestjs/common";
import { EntityManager } from "typeorm";
import { VideoCall } from "../entities/video-call.entity";
import { User } from "../entities/user.entity";
import { CallStatus } from "../enums/call-status.enum";
import { v4 as uuidv4 } from "uuid";
import { VideoCallDTO } from "../models/video-call.dto";
import { StartCallDTO } from "../models/start-call.dto";
import { MapperService } from "@mappers/mapper.service";
import { BaseMapper } from "@mappers/base.mapper";

@Injectable()
export class VideoCallService implements OnModuleInit {
    private videoCallMapper: BaseMapper<VideoCall, VideoCallDTO>;

    constructor(
        private readonly entityManager: EntityManager,
        @Inject(MapperService) private readonly mapperService: MapperService,
    ) {}

    public onModuleInit(): void {
        this.videoCallMapper = this.mapperService.getMapper("VideoCall");
    }

    async startCall(startCallDto: StartCallDTO): Promise<VideoCallDTO> {
        const { initiatorId, recipientId, isLiveStream, maxParticipants } =
            startCallDto;

        // Validate users exist
        const initiator = await this.entityManager.findOne(User, {
            where: { id: initiatorId },
        });
        const recipient = await this.entityManager.findOne(User, {
            where: { id: recipientId },
        });

        if (!initiator || !recipient) {
            throw new NotFoundException("One or both users not found");
        }

        if (initiatorId === recipientId) {
            throw new BadRequestException("Cannot call yourself");
        }

        // Check if there's already an active call between these users
        const existingCall = await this.entityManager.findOne(VideoCall, {
            where: [
                {
                    initiatorId,
                    recipientId,
                    status: CallStatus.ACTIVE,
                },
                {
                    initiatorId,
                    recipientId,
                    status: CallStatus.RINGING,
                },
                {
                    initiatorId: recipientId,
                    recipientId: initiatorId,
                    status: CallStatus.ACTIVE,
                },
                {
                    initiatorId: recipientId,
                    recipientId: initiatorId,
                    status: CallStatus.RINGING,
                },
            ],
        });

        if (existingCall) {
            throw new BadRequestException(
                "There is already an active call between these users",
            );
        }

        // Create new call
        const videoCall = new VideoCall();
        videoCall.id = uuidv4();
        videoCall.initiator = initiator;
        videoCall.initiatorId = initiatorId;
        videoCall.recipient = recipient;
        videoCall.recipientId = recipientId;
        videoCall.status = CallStatus.PENDING;
        videoCall.isLiveStream = isLiveStream || false;
        videoCall.maxParticipants = maxParticipants || 2;

        await this.entityManager.save(VideoCall, videoCall);

        return this.videoCallMapper.entityToDTO(videoCall);
    }

    async getCallById(callId: string): Promise<VideoCallDTO> {
        const call = await this.entityManager.findOne(VideoCall, {
            where: { id: callId },
            relations: ["initiator", "recipient"],
        });

        if (!call) {
            throw new NotFoundException(`Call with ID ${callId} not found`);
        }

        return this.videoCallMapper.entityToDTO(call);
    }

    async updateCallStatus(
        callId: string,
        status: CallStatus,
        additionalData?: Partial<VideoCall>,
    ): Promise<VideoCallDTO> {
        const call = await this.entityManager.findOne(VideoCall, {
            where: { id: callId },
            relations: ["initiator", "recipient"],
        });

        if (!call) {
            throw new NotFoundException(`Call with ID ${callId} not found`);
        }

        call.status = status;

        if (status === CallStatus.ACTIVE && !call.startedAt) {
            call.startedAt = new Date();
        }

        if (
            (status === CallStatus.ENDED ||
                status === CallStatus.REJECTED ||
                status === CallStatus.MISSED ||
                status === CallStatus.FAILED) &&
            !call.endedAt
        ) {
            call.endedAt = new Date();

            // Calculate duration if call was active
            if (call.startedAt) {
                const durationMs =
                    call.endedAt.getTime() - call.startedAt.getTime();
                call.durationSeconds = Math.floor(durationMs / 1000);
            }
        }

        // Apply any additional data
        if (additionalData) {
            Object.assign(call, additionalData);
        }

        await this.entityManager.save(VideoCall, call);

        return this.videoCallMapper.entityToDTO(call);
    }

    async endCall(callId: string, endReason?: string): Promise<VideoCallDTO> {
        return this.updateCallStatus(callId, CallStatus.ENDED, {
            endReason: endReason || "Call ended",
        });
    }

    async getCallsByUserId(
        userId: number,
        limit: number = 50,
    ): Promise<VideoCallDTO[]> {
        const calls = await this.entityManager.find(VideoCall, {
            where: [{ initiatorId: userId }, { recipientId: userId }],
            relations: ["initiator", "recipient"],
            order: { createdAt: "DESC" },
            take: limit,
        });

        return calls.map((call) => this.videoCallMapper.entityToDTO(call));
    }

    async getActiveCallByUserId(userId: number): Promise<VideoCallDTO | null> {
        const call = await this.entityManager.findOne(VideoCall, {
            where: [
                { initiatorId: userId, status: CallStatus.ACTIVE },
                { recipientId: userId, status: CallStatus.ACTIVE },
                { initiatorId: userId, status: CallStatus.RINGING },
                { recipientId: userId, status: CallStatus.RINGING },
            ],
            relations: ["initiator", "recipient"],
        });

        return call ? this.videoCallMapper.entityToDTO(call) : null;
    }
}

