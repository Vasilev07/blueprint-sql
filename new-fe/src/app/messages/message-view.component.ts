import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MessagesService } from 'src/typescript-api-client/src/api/api';
import { MessageDTO } from "src/typescript-api-client/src/model/models";
import { MessageService } from "primeng/api";

@Component({
    selector: "app-message-view",
    templateUrl: "./message-view.component.html",
    styleUrls: ['./message-view.component.scss'],
})
export class MessageViewComponent implements OnInit {
    message: MessageDTO | null = null;
    loading = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private messagesService: MessagesService,
        private messageService: MessageService,
    ) {
    }

    ngOnInit(): void {
        const messageId = this.route.snapshot.paramMap.get("id");
        if (messageId) {
            this.loadMessage(+messageId);
        }
    }

    loadMessage(id: number): void {
        this.loading = true;
        this.messagesService.findById(id).subscribe({
            next: (message) => {
                this.message = message;
                this.loading = false;
                // Mark as read
                this.messagesService.markAsRead(id).subscribe();
            },
            error: (error) => {
                console.error("Error loading message:", error);
                this.loading = false;
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to load message",
                });
            },
        });
    }

    goBack(): void {
        this.router.navigate(["/messages"]);
    }

    archiveMessage(): void {
        if (this.message?.id) {
            this.messagesService.archive(this.message.id).subscribe(() => {
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Message archived",
                });
                this.goBack();
            });
        }
    }

    deleteMessage(): void {
        if (this.message?.id) {
            this.messagesService._delete(this.message.id).subscribe(() => {
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Message deleted",
                });
                this.goBack();
            });
        }
    }
}
