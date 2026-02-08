import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as mediasoup from "mediasoup";
import {
    Router,
    Worker,
    WebRtcTransport,
    Producer,
    Consumer,
    RtpCodecCapability,
    DtlsParameters,
    RtpParameters,
    TransportListenInfo,
} from "mediasoup/node/lib/types";

@Injectable()
export class MediasoupService implements OnModuleInit {
    private readonly logger = new Logger(MediasoupService.name);
    private worker: Worker;
    private routers: Map<string, Router> = new Map();
    private transports: Map<string, WebRtcTransport> = new Map();
    private producers: Map<string, Producer> = new Map();
    private consumers: Map<string, Consumer> = new Map();

    // Media codecs configuration for video and audio
    private mediaCodecs: RtpCodecCapability[] = [
        {
            kind: "audio",
            mimeType: "audio/opus",
            clockRate: 48000,
            channels: 2,
            preferredPayloadType: 111,
        },
        {
            kind: "video",
            mimeType: "video/VP8",
            clockRate: 90000,
            preferredPayloadType: 96,
            parameters: {
                "x-google-start-bitrate": 1000,
            },
        },
        {
            kind: "video",
            mimeType: "video/VP9",
            clockRate: 90000,
            preferredPayloadType: 98,
            parameters: {
                "profile-id": 2,
                "x-google-start-bitrate": 1000,
            },
        },
        {
            kind: "video",
            mimeType: "video/h264",
            clockRate: 90000,
            preferredPayloadType: 102,
            parameters: {
                "packetization-mode": 1,
                "profile-level-id": "4d0032",
                "level-asymmetry-allowed": 1,
                "x-google-start-bitrate": 1000,
            },
        },
        {
            kind: "video",
            mimeType: "video/h264",
            clockRate: 90000,
            preferredPayloadType: 125,
            parameters: {
                "packetization-mode": 1,
                "profile-level-id": "42e01f",
                "level-asymmetry-allowed": 1,
                "x-google-start-bitrate": 1000,
            },
        },
    ];

    // WebRTC server configuration
    private webRtcServerOptions = {
        listenInfos: [
            {
                protocol: "udp" as const,
                ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
                announcedAddress:
                    process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
                port: 44444,
            },
            {
                protocol: "tcp" as const,
                ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
                announcedAddress:
                    process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
                port: 44444,
            },
        ],
    };

    async onModuleInit() {
        await this.createWorker();
        this.logger.log("Mediasoup worker initialized");
    }

    private async createWorker() {
        this.worker = await mediasoup.createWorker({
            logLevel: "warn",
            rtcMinPort: 10000,
            rtcMaxPort: 10100,
        });

        this.worker.on("died", () => {
            this.logger.error(
                "Mediasoup worker died, exiting in 2 seconds... [pid:%d]",
                this.worker.pid,
            );
            setTimeout(() => process.exit(1), 2000);
        });
    }

    async createRouter(callId: string): Promise<Router> {
        const router = await this.worker.createRouter({
            mediaCodecs: this.mediaCodecs,
        });
        this.routers.set(callId, router);
        this.logger.log(`Router created for call: ${callId}`);
        return router;
    }

    getRouter(callId: string): Router | undefined {
        return this.routers.get(callId);
    }

    async createWebRtcTransport(
        callId: string,
        transportId: string,
    ): Promise<{
        id: string;
        iceParameters: any;
        iceCandidates: any[];
        dtlsParameters: any;
    }> {
        let router = this.getRouter(callId);
        if (!router) {
            router = await this.createRouter(callId);
        }

        const transport = await router.createWebRtcTransport({
            listenInfos: this.webRtcServerOptions
                .listenInfos as TransportListenInfo[],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate: 1000000,
            maxSctpMessageSize: 262144,
        });

        this.transports.set(transportId, transport);
        this.logger.log(
            `Transport created: ${transportId} for call: ${callId}`,
        );

        return {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
        };
    }

    async connectTransport(
        transportId: string,
        dtlsParameters: DtlsParameters,
    ): Promise<void> {
        const transport = this.transports.get(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }

        await transport.connect({ dtlsParameters });
        this.logger.log(`Transport connected: ${transportId}`);
    }

    async createProducer(
        transportId: string,
        producerId: string,
        kind: "audio" | "video",
        rtpParameters: RtpParameters,
    ): Promise<{ id: string }> {
        const transport = this.transports.get(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }

        const producer = await transport.produce({
            kind,
            rtpParameters,
        });

        this.producers.set(producerId, producer);
        this.logger.log(
            `Producer created: ${producerId} (${kind}) on transport: ${transportId}`,
        );

        return { id: producer.id };
    }

    async createConsumer(
        callId: string,
        transportId: string,
        producerId: string,
        rtpCapabilities: any,
    ): Promise<{
        id: string;
        producerId: string;
        kind: string;
        rtpParameters: any;
    } | null> {
        const router = this.getRouter(callId);
        if (!router) {
            throw new Error(`Router not found for call: ${callId}`);
        }

        const transport = this.transports.get(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }

        const producer = this.producers.get(producerId);
        if (!producer) {
            this.logger.warn(`Producer not found: ${producerId}`);
            return null;
        }

        if (
            !router.canConsume({
                producerId: producer.id,
                rtpCapabilities,
            })
        ) {
            this.logger.warn("Cannot consume");
            return null;
        }

        const consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: false,
        });

        this.consumers.set(consumer.id, consumer);
        this.logger.log(
            `Consumer created: ${consumer.id} for producer: ${producerId}`,
        );

        return {
            id: consumer.id,
            producerId: producer.id,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
        };
    }

    getRouterRtpCapabilities(callId: string): any {
        const router = this.getRouter(callId);
        if (!router) {
            throw new Error(`Router not found for call: ${callId}`);
        }
        return router.rtpCapabilities;
    }

    async closeProducer(producerId: string): Promise<void> {
        const producer = this.producers.get(producerId);
        if (producer) {
            producer.close();
            this.producers.delete(producerId);
            this.logger.log(`Producer closed: ${producerId}`);
        }
    }

    async closeConsumer(consumerId: string): Promise<void> {
        const consumer = this.consumers.get(consumerId);
        if (consumer) {
            consumer.close();
            this.consumers.delete(consumerId);
            this.logger.log(`Consumer closed: ${consumerId}`);
        }
    }

    async closeTransport(transportId: string): Promise<void> {
        const transport = this.transports.get(transportId);
        if (transport) {
            transport.close();
            this.transports.delete(transportId);
            this.logger.log(`Transport closed: ${transportId}`);
        }
    }

    async cleanupCall(callId: string): Promise<void> {
        const router = this.routers.get(callId);
        if (router) {
            router.close();
            this.routers.delete(callId);
            this.logger.log(`Router closed for call: ${callId}`);
        }

        // Clean up all associated resources
        const transportIds = Array.from(this.transports.keys());
        const producerIds = Array.from(this.producers.keys());
        const consumerIds = Array.from(this.consumers.keys());

        for (const transportId of transportIds) {
            if (transportId.startsWith(callId)) {
                await this.closeTransport(transportId);
            }
        }

        for (const producerId of producerIds) {
            if (producerId.startsWith(callId)) {
                await this.closeProducer(producerId);
            }
        }

        for (const consumerId of consumerIds) {
            const consumer = this.consumers.get(consumerId);
            if (consumer && consumer.producerId.startsWith(callId)) {
                await this.closeConsumer(consumerId);
            }
        }
    }
}
