import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { WebsocketService } from "./websocket.service";

export interface CallParticipant {
    userId: number;
    name: string;
    stream?: MediaStream;
}

export interface CallState {
    callId: string | null;
    isActive: boolean;
    isIncoming: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    status:
        | "idle"
        | "initiating"
        | "ringing"
        | "connecting"
        | "active"
        | "ended";
    participant: CallParticipant | null;
    isMuted: boolean;
    isVideoOff: boolean;
}

export interface IncomingCallData {
    callId: string;
    initiatorId: number;
    initiatorName: string;
    sessionId: string;
}

@Injectable({
    providedIn: "root",
})
export class VideoCallService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;

    private callState$ = new BehaviorSubject<CallState>({
        callId: null,
        isActive: false,
        isIncoming: false,
        localStream: null,
        remoteStream: null,
        status: "idle",
        participant: null,
        isMuted: false,
        isVideoOff: false,
    });

    // WebRTC Configuration with STUN servers
    private rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ],
    };

    constructor(private websocketService: WebsocketService) {
        this.setupWebSocketListeners();
    }

    private setupWebSocketListeners(): void {
        // Listen for incoming calls
        this.websocketService
            .onIncomingCall()
            .subscribe((data: IncomingCallData) => {
                this.handleIncomingCall(data);
            });

        // Listen for call accepted
        this.websocketService.onCallAccepted().subscribe((data: any) => {
            this.handleCallAccepted(data);
        });

        // Listen for call rejected
        this.websocketService.onCallRejected().subscribe(() => {
            this.endCall();
        });

        // Listen for call ended
        this.websocketService.onCallEnded().subscribe(() => {
            this.endCall();
        });

        // Listen for WebRTC signaling messages
        this.websocketService.onWebRTCOffer().subscribe((data: any) => {
            this.handleOffer(data);
        });

        this.websocketService.onWebRTCAnswer().subscribe((data: any) => {
            this.handleAnswer(data);
        });

        this.websocketService.onWebRTCIceCandidate().subscribe((data: any) => {
            this.handleIceCandidate(data);
        });
    }

    getCallState(): Observable<CallState> {
        return this.callState$.asObservable();
    }

    getCurrentCallState(): CallState {
        return this.callState$.value;
    }

    async checkPermissions(): Promise<{
        hasCamera: boolean;
        hasMicrophone: boolean;
    }> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(
                (device) => device.kind === "videoinput",
            );
            const hasMicrophone = devices.some(
                (device) => device.kind === "audioinput",
            );
            return { hasCamera, hasMicrophone };
        } catch (error) {
            console.error("Error checking device permissions:", error);
            return { hasCamera: false, hasMicrophone: false };
        }
    }

    async requestPermissions(): Promise<{
        cameraGranted: boolean;
        microphoneGranted: boolean;
    }> {
        try {
            // Request temporary access to check permissions
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            // Stop the stream immediately after getting permission
            stream.getTracks().forEach((track) => track.stop());

            return { cameraGranted: true, microphoneGranted: true };
        } catch (error: any) {
            console.error("Error requesting permissions:", error);

            if (error.name === "NotAllowedError") {
                return { cameraGranted: false, microphoneGranted: false };
            }

            // For other errors, assume devices exist but permissions weren't granted
            return { cameraGranted: false, microphoneGranted: false };
        }
    }

    async initiateCall(
        recipientId: number,
        recipientName: string,
    ): Promise<void> {
        try {
            this.updateCallState({
                status: "initiating",
                participant: { userId: recipientId, name: recipientName },
            });

            // Get user media
            this.localStream = await this.getUserMedia();

            this.updateCallState({
                localStream: this.localStream,
                status: "ringing",
            });

            // Emit start call to backend
            this.websocketService.emitStartCall({ recipientId });
        } catch (error) {
            console.error("Error initiating call:", error);
            this.updateCallState({ status: "idle", localStream: null });
            throw error;
        }
    }

    async acceptCall(callId: string): Promise<void> {
        try {
            this.updateCallState({ status: "connecting" });

            // Get user media
            this.localStream = await this.getUserMedia();

            this.updateCallState({
                localStream: this.localStream,
                callId,
            });

            // Emit accept call to backend
            this.websocketService.emitAcceptCall({ callId });
        } catch (error) {
            console.error("Error accepting call:", error);
            this.rejectCall(callId);
            throw error;
        }
    }

    rejectCall(callId: string): void {
        this.websocketService.emitRejectCall({ callId });
        this.updateCallState({
            status: "idle",
            isIncoming: false,
            callId: null,
            participant: null,
        });
    }

    endCall(): void {
        const currentState = this.callState$.value;

        if (currentState.callId) {
            this.websocketService.emitEndCall({ callId: currentState.callId });
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
            this.localStream = null;
        }

        // Reset state
        this.callState$.next({
            callId: null,
            isActive: false,
            isIncoming: false,
            localStream: null,
            remoteStream: null,
            status: "idle",
            participant: null,
            isMuted: false,
            isVideoOff: false,
        });
    }

    toggleMute(): void {
        const currentState = this.callState$.value;
        if (currentState.localStream) {
            const audioTrack = currentState.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.updateCallState({ isMuted: !audioTrack.enabled });
            }
        }
    }

    toggleVideo(): void {
        const currentState = this.callState$.value;
        if (currentState.localStream) {
            const videoTrack = currentState.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.updateCallState({ isVideoOff: !videoTrack.enabled });
            }
        }
    }

    private async getUserMedia(): Promise<MediaStream> {
        try {
            // Check if getUserMedia is supported
            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                throw new Error(
                    "WebRTC is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.",
                );
            }

            // Check if we're on HTTPS (required for most browsers)
            if (
                window.location.protocol !== "https:" &&
                window.location.hostname !== "localhost"
            ) {
                throw new Error(
                    "Video calls require HTTPS. Please access the site over a secure connection.",
                );
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            return stream;
        } catch (error: any) {
            console.error("Error accessing media devices:", error);

            // Provide specific error messages based on the error type
            if (error.name === "NotAllowedError") {
                throw new Error(
                    "Camera and microphone access denied. Please allow permissions in your browser settings and try again.",
                );
            } else if (error.name === "NotFoundError") {
                throw new Error(
                    "No camera or microphone found. Please connect a camera/microphone and try again.",
                );
            } else if (error.name === "NotReadableError") {
                throw new Error(
                    "Camera or microphone is already in use by another application. Please close other apps and try again.",
                );
            } else if (error.name === "OverconstrainedError") {
                // Try with basic video settings as fallback
                try {
                    return await navigator.mediaDevices.getUserMedia({
                        video: true, // Basic video
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                        },
                    });
                } catch (_fallbackError) {
                    console.log(_fallbackError);
                    
                    throw new Error(
                        "Camera settings are not supported. Please try a different camera or check your device settings.",
                    );
                }
            } else if (error.name === "SecurityError") {
                throw new Error(
                    "Camera/microphone access blocked due to security restrictions. Please check your browser settings.",
                );
            } else if (error.name === "AbortError") {
                throw new Error(
                    "Camera/microphone access was interrupted. Please try again.",
                );
            } else if (error.message) {
                // Custom error messages from our checks above
                throw error;
            } else {
                throw new Error(
                    "Could not access camera/microphone. Please check your device settings and try again.",
                );
            }
        }
    }

    private async createPeerConnection(callId: string): Promise<void> {
        this.peerConnection = new RTCPeerConnection(this.rtcConfig);

        // Add local stream tracks to peer connection
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
                this.peerConnection!.addTrack(track, this.localStream!);
            });
        }

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            const remoteStream = event.streams[0];
            this.updateCallState({
                remoteStream,
                status: "active",
                isActive: true,
            });
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.websocketService.emitWebRTCIceCandidate({
                    callId,
                    candidate: event.candidate,
                });
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log(
                "Connection state:",
                this.peerConnection?.connectionState,
            );
            if (
                this.peerConnection?.connectionState === "disconnected" ||
                this.peerConnection?.connectionState === "failed"
            ) {
                this.endCall();
            }
        };
    }

    private handleIncomingCall(data: IncomingCallData): void {
        this.updateCallState({
            callId: data.callId,
            isIncoming: true,
            status: "ringing",
            participant: {
                userId: data.initiatorId,
                name: data.initiatorName,
            },
        });
    }

    private async handleCallAccepted(data: any): Promise<void> {
        try {
            const { callId } = data;

            this.updateCallState({
                callId,
                status: "connecting",
                isActive: true,
            });

            await this.createPeerConnection(callId);

            // Create and send offer
            const offer = await this.peerConnection!.createOffer();
            await this.peerConnection!.setLocalDescription(offer);

            this.websocketService.emitWebRTCOffer({
                callId,
                offer: offer,
            });
        } catch (error) {
            console.error("Error handling call accepted:", error);
            this.endCall();
        }
    }

    private async handleOffer(data: any): Promise<void> {
        try {
            const { callId, offer } = data;

            if (!this.peerConnection) {
                await this.createPeerConnection(callId);
            }

            await this.peerConnection!.setRemoteDescription(
                new RTCSessionDescription(offer),
            );

            // Create and send answer
            const answer = await this.peerConnection!.createAnswer();
            await this.peerConnection!.setLocalDescription(answer);

            this.websocketService.emitWebRTCAnswer({
                callId,
                answer: answer,
            });
        } catch (error) {
            console.error("Error handling offer:", error);
            this.endCall();
        }
    }

    private async handleAnswer(data: any): Promise<void> {
        try {
            const { answer } = data;

            if (this.peerConnection) {
                await this.peerConnection.setRemoteDescription(
                    new RTCSessionDescription(answer),
                );
            }
        } catch (error) {
            console.error("Error handling answer:", error);
            this.endCall();
        }
    }

    private async handleIceCandidate(data: any): Promise<void> {
        try {
            const { candidate } = data;

            if (this.peerConnection && candidate) {
                await this.peerConnection.addIceCandidate(
                    new RTCIceCandidate(candidate),
                );
            }
        } catch (error) {
            console.error("Error handling ICE candidate:", error);
        }
    }

    private updateCallState(updates: Partial<CallState>): void {
        this.callState$.next({
            ...this.callState$.value,
            ...updates,
        });
    }
}
