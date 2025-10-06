import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { MessagesService } from 'src/typescript-api-client/src/api/api';
import { MessageDTO } from "../../typescript-api-client/src/model/models";
import { AuthService } from "../services/auth.service";
import { WebsocketService } from "../services/websocket.service";
import { PresenceService } from "../services/presence.service";
import { Subscription } from 'rxjs';

@Component({
    selector: "app-messages",
    templateUrl: "./messages.component.html",
    styleUrls: ["./messages.component.scss"],
})
export class MessagesComponent implements OnInit, OnDestroy {
    messages: MessageDTO[] = [];
    loading = false;
    currentUserEmail: string = '';
    private messageSubscription?: Subscription;
    unreadCount: number = 0;
    
    // Tab functionality
    activeTab: 'unread' | 'read' | 'vip' = 'unread';
    tabs = [
        { key: 'unread', label: 'Unread', icon: 'pi pi-envelope' },
        { key: 'read', label: 'Read', icon: 'pi pi-check-circle' },
        { key: 'vip', label: 'VIP', icon: 'pi pi-star' }
    ];

    constructor(
        private messagesService: MessagesService,
        private router: Router,
        private authService: AuthService,
        private websocketService: WebsocketService,
        private httpClient: HttpClient,
        public presenceService: PresenceService
    ) {
    }

    ngOnInit(): void {
        this.currentUserEmail = this.authService.getUserEmail();
        if (this.currentUserEmail) {
            this.loadMessagesByTab(this.activeTab);
            this.loadUnreadCount();
            // Subscribe to real-time message updates
            this.messageSubscription = this.websocketService
                .subscribeToMessages()
                .subscribe(() => {
                    this.loadMessagesByTab(this.activeTab);
                    this.loadUnreadCount();
                });
        }
    }

    ngOnDestroy(): void {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
        this.websocketService.disconnect();
    }

    loadMessages(): void {
        this.loading = true;
        this.messagesService.findInboxByEmail(this.currentUserEmail).subscribe({
            next: (messages) => {
                this.messages = messages;
                this.loading = false;
            },
            error: (error) => {
                console.error("Error loading messages:", error);
                this.loading = false;
            },
        });
    }

    loadMessagesByTab(tab: 'unread' | 'read' | 'vip'): void {
        this.loading = true;
        
        // Using direct HTTP call until OpenAPI is regenerated
        const url = 'http://localhost:3000/messages/tab';
        const body = {
            email: this.currentUserEmail,
            tab: tab
        };
        
        this.httpClient.post(url, body).subscribe({
            next: (messages: any) => {
                this.messages = messages;
                this.loading = false;
                if (tab === 'unread') {
                    this.unreadCount = Array.isArray(messages) ? messages.length : 0;
                }
            },
            error: (error) => {
                console.error(`Error loading ${tab} messages:`, error);
                this.loading = false;
            },
        });
    }

    private loadUnreadCount(): void {
        const url = 'http://localhost:3000/messages/tab';
        const body = {
            email: this.currentUserEmail,
            tab: 'unread'
        } as const;
        this.httpClient.post(url, body).subscribe({
            next: (messages: any) => {
                this.unreadCount = Array.isArray(messages) ? messages.length : 0;
            },
            error: (error) => {
                console.error('Error loading unread count:', error);
                this.unreadCount = 0;
            }
        });
    }

    onTabChange(tab: any): void {
        this.activeTab = tab;
        this.loadMessagesByTab(tab);
    }

    composeMessage(): void {
        this.router.navigate(["/messages/compose"]);
    }

    viewMessage(messageId: number): void {
        this.router.navigate(["/messages/view", messageId]);
    }

    markAsRead(message: MessageDTO): void {
        if (message.id) {
            this.messagesService.markAsRead(message.id).subscribe();
        }
    }

    archiveMessage(message: MessageDTO): void {
        if (message.id) {
            this.messagesService.archive(message.id).subscribe(() => {
                this.messages = this.messages.filter(m => m.id !== message.id);
            });
        }
    }

    deleteMessage(message: MessageDTO): void {
        if (message.id) {
            this.messagesService._delete(message.id).subscribe(() => {
                this.messages = this.messages.filter(m => m.id !== message.id);
            });
        }
    }
}
