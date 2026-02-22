import { Component, OnInit, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { MessagesService } from "src/typescript-api-client/src/api/api";
import { UserService } from "src/typescript-api-client/src/api/api";
import { UserDTO } from "src/typescript-api-client/src/model/models";
import { MessageService } from "primeng/api";
import { CreateMessageDTO } from "src/typescript-api-client/src/model/models";
import { AuthService } from "../services/auth.service";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { MultiSelectModule } from "primeng/multiselect";

@Component({
    selector: "app-message-compose",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        TooltipModule,
        MultiSelectModule,
    ],
    templateUrl: "./message-compose.component.html",
    styleUrls: ["./message-compose.component.scss"],
})
export class MessageComposeComponent implements OnInit {
    private readonly messagesService = inject(MessagesService);
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly authService = inject(AuthService);

    readonly users = signal<UserDTO[]>([]);
    readonly loading = signal(false);
    readonly attachments = signal<File[]>([]);
    readonly currentUserId = signal<number | null>(null);

    readonly selectedRecipients = signal<string[]>([]);
    readonly selectedCC = signal<string[]>([]);
    readonly selectedBCC = signal<string[]>([]);
    readonly showCC = signal(false);
    readonly showBCC = signal(false);
    readonly subject = signal("");
    readonly content = signal("");

    readonly isFormValid = computed(() => {
        const to = this.selectedRecipients();
        const subj = this.subject();
        const cnt = this.content();
        return to.length > 0 && !!subj?.trim() && !!cnt?.trim();
    });

    ngOnInit(): void {
        this.currentUserId.set(this.authService.getUserId());
        this.loadUsers();
    }

    loadUsers(): void {
        this.userService
            .getAll(1, 1000, "all", "recent", "", "", 0, 100, "", "", false)
            .subscribe({
                next: (response: { users?: UserDTO[] }) => {
                    this.users.set(response.users ?? []);
                },
                error: (error) => {
                    console.error("Error loading users:", error);
                },
            });
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = input?.files;
        if (files?.length) {
            this.attachments.update((prev) => [...prev, ...Array.from(files)]);
        }
    }

    onSubmit(): void {
        const userId = this.currentUserId();
        if (userId == null) {
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "User not found",
            });
            return;
        }

        if (!this.isFormValid()) return;

        this.loading.set(true);

        const message: CreateMessageDTO = {
            to: this.selectedRecipients(),
            cc: this.selectedCC(),
            bcc: this.selectedBCC(),
            subject: this.subject(),
            content: this.content(),
            from: this.authService.getUserEmail(),
            userId,
            attachments: this.attachments().map((f) => f.name),
        };

        this.messagesService.create(message).subscribe({
            next: () => {
                this.messageService.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Message sent successfully!",
                });
                this.router.navigate(["/messages"]);
            },
            error: (error) => {
                console.error("Error sending message:", error);
                this.messageService.add({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to send message. Please try again.",
                });
                this.loading.set(false);
            },
        });
    }

    onCancel(): void {
        this.router.navigate(["/messages"]);
    }

    toggleCC(): void {
        this.showCC.update((v) => !v);
        if (!this.showCC()) {
            this.selectedCC.set([]);
        }
    }

    toggleBCC(): void {
        this.showBCC.update((v) => !v);
        if (!this.showBCC()) {
            this.selectedBCC.set([]);
        }
    }

    clearAttachments(): void {
        this.attachments.set([]);
    }

    removeAttachment(index: number): void {
        this.attachments.update((prev) => prev.filter((_, i) => i !== index));
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    addImage(): void {
        const fileInput = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement | null;
        if (fileInput) {
            fileInput.accept = "image/*";
            fileInput.click();
        }
    }

    saveDraft(): void {
        this.messageService.add({
            severity: "info",
            summary: "Draft Saved",
            detail: "Your message has been saved as a draft",
        });
    }
}
