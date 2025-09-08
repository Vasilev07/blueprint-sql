import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MessagesService } from 'src/typescript-api-client/src/api/api';
import { MessageDTO } from "../../typescript-api-client/src/model/models";
import { AuthService } from "../services/auth.service";

@Component({
    selector: "app-messages",
    templateUrl: "./messages.component.html",
    styleUrls: ["./messages.component.scss"],
})
export class MessagesComponent implements OnInit {
    messages: MessageDTO[] = [];
    loading = false;
    currentUserId: number = 1; // Get from auth service

    constructor(
        private messagesService: MessagesService,
        private router: Router,
        private authService: AuthService,
    ) {
    }

    ngOnInit(): void {
        this.loadMessages();
    }

    loadMessages(): void {
        this.loading = true;
        this.messagesService.findInboxByUserId(this.currentUserId).subscribe({
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
