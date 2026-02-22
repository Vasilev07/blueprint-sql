import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { MessagesService } from "src/typescript-api-client/src/api/api";
import { MessageDTO } from "src/typescript-api-client/src/model/models";
import { MessageService } from "primeng/api";

@Component({
    selector: "app-message-view",
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TooltipModule],
    templateUrl: "./message-view.component.html",
    styleUrls: ["./message-view.component.scss"],
})
export class MessageViewComponent implements OnInit {
    readonly message = signal<MessageDTO | null>(null);
    readonly loading = signal(false);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private messagesService: MessagesService,
        private messageService: MessageService,
    ) {}

    ngOnInit(): void {
        const messageId = this.route.snapshot.paramMap.get("id");
        if (messageId) {
            this.loadMessage(+messageId);
        }
    }

    loadMessage(id: number): void {
        this.loading.set(true);
        this.messagesService.findById(id).subscribe({
            next: (msg) => {
                this.message.set(msg);
                this.loading.set(false);
                this.messagesService.markAsRead(id).subscribe();
            },
            error: (error) => {
                console.error("Error loading message:", error);
                this.loading.set(false);
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
        const msg = this.message();
        if (msg?.id != null) {
            this.messagesService.archive(msg.id).subscribe(() => {
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Message archived",
                });
                this.goBack();
                this.message.set(null);
            });
        }
    }

    deleteMessage(): void {
        const msg = this.message();
        if (msg?.id != null) {
            this.messagesService._delete(msg.id).subscribe(() => {
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Message deleted",
                });
                this.goBack();
                this.message.set(null);
            });
        }
    }
}
