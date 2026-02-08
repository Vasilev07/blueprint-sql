import { Component } from "@angular/core";

@Component({
    selector: "app-chat-list",
    template: '<div class="chat-list-placeholder">Chat List Component</div>',
    styles: [
        ".chat-list-placeholder { padding: 1rem; text-align: center; color: var(--text-color-secondary); }",
    ],
})
export class ChatListComponent {}
