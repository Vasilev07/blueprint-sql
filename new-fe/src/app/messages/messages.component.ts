import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { MessagesService } from 'src/typescript-api-client/src/api/api';
import { MessageDTO } from "../../typescript-api-client/src/model/models";
import { AuthService } from "../services/auth.service";
import { WebsocketService } from "../services/websocket.service";
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

    constructor(
        private messagesService: MessagesService,
        private router: Router,
        private authService: AuthService,
        private websocketService: WebsocketService
    ) {
    }

    ngOnInit(): void {
        this.currentUserEmail = this.authService.getUserEmail();
        if (this.currentUserEmail) {
            this.loadMessages();
            // Subscribe to real-time message updates
            this.messageSubscription = this.websocketService
                .subscribeToMessages()
                .subscribe(() => {
                    this.loadMessages();
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
