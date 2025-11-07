import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { VideoCallService, CallState } from '../../services/video-call.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-incoming-call',
    templateUrl: './incoming-call.component.html',
    styleUrls: ['./incoming-call.component.scss']
})
export class IncomingCallComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    
    showIncomingCall = false;
    callerName: string = '';
    callId: string = '';

    // Ring tone (you can add actual audio if you want)
    private ringInterval: any;

    constructor(
        private videoCallService: VideoCallService,
        private router: Router,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        console.log("📞 IncomingCallComponent: Initialized");
        // Listen for incoming calls
        this.videoCallService.getCallState()
            .pipe(takeUntil(this.destroy$))
            .subscribe(state => {
                console.log("📞 IncomingCallComponent: Call state changed:", state);
                if (state.isIncoming && state.status === 'ringing' && state.callId) {
                    console.log("📞 IncomingCallComponent: Showing incoming call notification");
                    this.showIncomingCall = true;
                    this.callerName = state.participant?.name || 'Unknown User';
                    this.callId = state.callId;
                    this.startRinging();
                } else if (!state.isIncoming || state.status !== 'ringing') {
                    console.log("📞 IncomingCallComponent: Hiding incoming call notification");
                    this.showIncomingCall = false;
                    this.stopRinging();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.stopRinging();
    }

    async acceptCall(): Promise<void> {
        try {
            this.stopRinging();
            await this.videoCallService.acceptCall(this.callId);
            
            // Navigate to video call page
            this.router.navigate(['/video-call']);
            this.showIncomingCall = false;
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Call Failed',
                detail: error.message || 'Could not accept call'
            });
            this.showIncomingCall = false;
        }
    }

    rejectCall(): void {
        this.stopRinging();
        this.videoCallService.rejectCall(this.callId);
        this.showIncomingCall = false;
    }

    private startRinging(): void {
        // Optional: Add actual ring tone audio here
        // const audio = new Audio('/assets/sounds/ring.mp3');
        // audio.loop = true;
        // audio.play();
        
        // Visual ring effect
        this.ringInterval = setInterval(() => {
            // You can add animation classes here if needed
        }, 1000);
    }

    private stopRinging(): void {
        if (this.ringInterval) {
            clearInterval(this.ringInterval);
            this.ringInterval = null;
        }
        // Stop audio if you added it
    }
}

