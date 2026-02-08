import { Component } from "@angular/core";

@Component({
    selector: "app-chat-message",
    template:
        '<div class="chat-message-placeholder">Chat Message Component</div>',
    styles: [
        ".chat-message-placeholder { padding: 1rem; text-align: center; color: var(--text-color-secondary); }",
    ],
})
export class ChatMessageComponent {}
