import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { User, Message, ChatService, Conversation } from "./chat.service";

@Component({
    selector: "app-chat-home",
    templateUrl: "./chat-home.component.html",
    styleUrls: ["./chat-home.component.scss"],
})
export class ChatHomeComponent implements OnInit {
    lastRegisteredUsers$: Observable<User[]>;
    topFriends$: Observable<User[]>;
    recentMessages$: Observable<Message[]>;
    conversations$: Observable<Conversation[]>;

    constructor(
        private router: Router,
        private chatService: ChatService,
    ) {
        this.lastRegisteredUsers$ = this.chatService.getLastRegisteredUsers(10);
        this.topFriends$ = this.chatService.getTopFriends(10);
        this.recentMessages$ = this.chatService.getRecentMessages(5);
        this.conversations$ = this.chatService.conversations$;
    }

    ngOnInit(): void {
        // Observables are already initialized in constructor
    }

    startChat(userId: string): void {
        this.router.navigate(["/chat/conversation", userId]);
    }

    startChatFromConversation(conversation: Conversation): void {
        const otherUserId = conversation.participants.find(p => p !== "1");
        if (otherUserId) {
            this.router.navigate(["/chat/conversation", otherUserId]);
        }
    }

    formatTime(date: Date | undefined): string {
        if (!date) return "";
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    getUserName(userId: string): string {
        // This would typically come from a user service
        const userNames: { [key: string]: string } = {
            "1": "You",
            "2": "Jane Smith",
            "3": "Mike Johnson",
            "4": "Sarah Wilson",
            "5": "David Brown",
            "6": "Emily Davis",
        };
        return userNames[userId] || "Unknown User";
    }
}
