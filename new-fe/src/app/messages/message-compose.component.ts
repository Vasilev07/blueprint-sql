import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { MessagesService } from "src/typescript-api-client/src/api/api";
import { UserService } from "src/typescript-api-client/src/api/api";
import { UserDTO } from "src/typescript-api-client/src/model/models";
import { MessageService } from "primeng/api";
import { MessageDTO } from "src/typescript-api-client/src/model/models";
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
    messageForm: FormGroup;
    users: UserDTO[] = [];
    loading = false;
    attachments: File[] = [];
    currentUserId: number | null = null;

    // New properties for enhanced UI
    selectedRecipients: string[] = [];
    selectedCC: string[] = [];
    selectedBCC: string[] = [];
    showCC = false;
    showBCC = false;
    subject = "";
    content = "";

    constructor(
        private fb: FormBuilder,
        private messagesService: MessagesService,
        private userService: UserService,
        private router: Router,
        private messageService: MessageService,
        private authService: AuthService,
    ) {
        this.messageForm = this.fb.group({
            to: ["", Validators.required],
            cc: [""],
            bcc: [""],
            subject: ["", Validators.required],
            content: ["", Validators.required],
        });
    }

    ngOnInit(): void {
        this.currentUserId = this.authService.getUserId();
        this.loadUsers();
    }

    loadUsers(): void {
        // Fetch all users with a large limit (no pagination for message compose)
        this.userService
            .getAll(1, 1000, "all", "recent", "", "", 0, 100, "", "", false)
            .subscribe({
                next: (response: any) => {
                    this.users = response.users || [];
                    console.log("Loaded users:", this.users);
                },
                error: (error) => {
                    console.error("Error loading users:", error);
                },
            });
    }

    onFileSelect(event: any): void {
        const files = event.files;
        if (files) {
            this.attachments.push(...files);
        }
    }

    onSubmit(): void {
        console.log("Form valid:", this.isFormValid());
        console.log("Selected recipients:", this.selectedRecipients);
        console.log("Subject:", this.subject);
        console.log("Content:", this.content);

        if (!this.currentUserId) {
            console.error("No user ID available!");
            this.messageService.add({
                severity: "error",
                summary: "Error",
                detail: "User not found",
            });
            return;
        }

        if (this.isFormValid()) {
            this.loading = true;

            const message: CreateMessageDTO = {
                to: this.selectedRecipients,
                cc: this.selectedCC,
                bcc: this.selectedBCC,
                subject: this.subject,
                content: this.content,
                from: this.authService.getUserEmail(),
                userId: this.currentUserId,
                attachments: this.attachments.map((f) => f.name), // In real app, upload files first
            };

            console.log("Current user ID:", this.currentUserId);
            console.log("Selected recipients:", this.selectedRecipients);
            console.log("Sending message:", message);
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
                    this.loading = false;
                },
            });
        }
    }

    onCancel(): void {
        this.router.navigate(["/messages"]);
    }

    // New methods for enhanced functionality
    toggleCC(): void {
        this.showCC = !this.showCC;
        if (!this.showCC) {
            this.selectedCC = [];
        }
    }

    toggleBCC(): void {
        this.showBCC = !this.showBCC;
        if (!this.showBCC) {
            this.selectedBCC = [];
        }
    }

    clearAttachments(): void {
        this.attachments = [];
    }

    removeAttachment(index: number): void {
        this.attachments.splice(index, 1);
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    addImage(): void {
        // For now, just trigger file input for images
        const fileInput = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        if (fileInput) {
            fileInput.accept = "image/*";
            fileInput.click();
        }
    }

    saveDraft(): void {
        // TODO: Implement draft saving functionality
        this.messageService.add({
            severity: "info",
            summary: "Draft Saved",
            detail: "Your message has been saved as a draft",
        });
    }

    isFormValid(): boolean {
        return (
            this.selectedRecipients.length > 0 &&
            !!this.subject?.trim() &&
            !!this.content?.trim()
        );
    }
}
