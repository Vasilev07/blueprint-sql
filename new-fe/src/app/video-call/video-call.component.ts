import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { VideoCallService, CallState } from '../services/video-call.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-video-call',
    templateUrl: './video-call.component.html',
    styleUrls: ['./video-call.component.scss']
})
export class VideoCallComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
    @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

    private destroy$ = new Subject<void>();
    
    callState: CallState = {
        callId: null,
        isActive: false,
        isIncoming: false,
        localStream: null,
        remoteStream: null,
        status: 'idle',
        participant: null,
        isMuted: false,
        isVideoOff: false
    };

    recipientId: number | null = null;
    recipientName: string = '';
    callDuration: string = '00:00';
    private callStartTime: Date | null = null;
    private durationInterval: any;
    private hasNavigatedBack = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private videoCallService: VideoCallService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        // Subscribe to call state changes
        this.videoCallService.getCallState()
            .pipe(takeUntil(this.destroy$))
            .subscribe(state => {
                this.callState = state;
                
                // Update video streams
                if (state.localStream && this.localVideoRef) {
                    this.attachLocalStream(state.localStream);
                }
                
                if (state.remoteStream && this.remoteVideoRef) {
                    this.attachRemoteStream(state.remoteStream);
                }

                // Start call duration timer
                if (state.status === 'active' && !this.callStartTime) {
                    this.startCallTimer();
                }

                // Handle call ended
                if (state.status === 'idle' && this.callStartTime) {
                    this.handleCallEnded();
                }
            });

        // Get recipient info from route params (for outgoing calls)
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            if (params['recipientId']) {
                this.recipientId = Number(params['recipientId']);
                this.recipientName = params['recipientName'] || 'Unknown User';
                
                // Initiate outgoing call
                this.initiateCall();
            }
        });
    }

    ngAfterViewInit(): void {
        // Attach streams if they already exist
        if (this.callState.localStream) {
            this.attachLocalStream(this.callState.localStream);
        }
        if (this.callState.remoteStream) {
            this.attachRemoteStream(this.callState.remoteStream);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
        }
    }

    private async initiateCall(): Promise<void> {
        if (!this.recipientId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Recipient information is missing'
            });
            return;
        }

        try {
            await this.videoCallService.initiateCall(this.recipientId, this.recipientName);
        } catch (error: any) {
            console.error('Call initiation error:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Call Failed',
                detail: error.message || 'Could not initiate call',
                life: 8000 // Show longer for detailed error messages
            });

            // Don't navigate away immediately for media permission errors
            if (!error.message?.includes('camera') && !error.message?.includes('microphone')) {
                setTimeout(() => this.router.navigate(['/chat']), 3000);
            }
        }
    }

    private attachLocalStream(stream: MediaStream): void {
        if (this.localVideoRef && this.localVideoRef.nativeElement) {
            this.localVideoRef.nativeElement.srcObject = stream;
            this.localVideoRef.nativeElement.muted = true; // Always mute local video to prevent echo
        }
    }

    private attachRemoteStream(stream: MediaStream): void {
        if (this.remoteVideoRef && this.remoteVideoRef.nativeElement) {
            this.remoteVideoRef.nativeElement.srcObject = stream;
        }
    }

    private startCallTimer(): void {
        this.callStartTime = new Date();
        this.durationInterval = setInterval(() => {
            if (this.callStartTime) {
                const duration = Date.now() - this.callStartTime.getTime();
                this.callDuration = this.formatDuration(duration);
            }
        }, 1000);
    }

    private formatDuration(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const displaySeconds = seconds % 60;
        const displayMinutes = minutes % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
        }
        return `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
    }

    private handleCallEnded(): void {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
        }
        this.callStartTime = null;
        this.callDuration = '00:00';

        // Navigate back immediately if not already navigated
        if (!this.hasNavigatedBack) {
            this.hasNavigatedBack = true;
            this.navigateBack();
        }
    }

    private navigateBack(): void {
        // Try to go back to previous location
        // If there's no history, default to chat
        if (window.history.length > 2) {
            this.location.back();
        } else {
            this.router.navigate(['/chat']);
        }
    }

    // UI Actions
    toggleMute(): void {
        this.videoCallService.toggleMute();
    }

    toggleVideo(): void {
        this.videoCallService.toggleVideo();
    }

    endCall(): void {
        this.videoCallService.endCall();
        
        // Navigate back immediately when user clicks end call
        if (!this.hasNavigatedBack) {
            this.hasNavigatedBack = true;
            this.navigateBack();
        }
    }

    // Getters for UI
    get isConnecting(): boolean {
        return this.callState.status === 'connecting' || this.callState.status === 'ringing';
    }

    get isActive(): boolean {
        return this.callState.status === 'active';
    }

    get statusText(): string {
        switch (this.callState.status) {
            case 'initiating':
                return 'Initializing...';
            case 'ringing':
                return 'Ringing...';
            case 'connecting':
                return 'Connecting...';
            case 'active':
                return this.callDuration;
            case 'ended':
                return 'Call Ended';
            default:
                return '';
        }
    }

    get participantName(): string {
        return this.callState.participant?.name || this.recipientName || 'Unknown';
    }
}

