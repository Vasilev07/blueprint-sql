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
    friends: User[] = [];

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
        this.chatService.friends$.subscribe(f => this.friends = f || []);
    }

    startChat(userId: any): void {
        const id = String((userId && typeof userId === 'object') ? userId.id : userId);
        if (!id || id === 'undefined' || id === 'null') return;
        this.router.navigate(["/chat/conversation", id]);
    }

    startChatFromConversation(conversation: Conversation): void {
        const me = this.getLoggedInUserId();
        const otherUserId = (conversation.participants || [])
            .map((p: any) => String(p))
            .find((p: string) => p !== me);

        console.log(otherUserId, "otherUserId");
        console.log(conversation, "conversation");
        
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
        const friend = this.friends.find(u => String(u.id) === String(userId));
        return friend?.name || userId || "Unknown User";
    }

    private getLoggedInUserId(): string {
        const id = Number(JSON.parse(atob((localStorage.getItem('id_token') || '').split('.')[1] || 'e30='))?.id || 0);
        return String(id || '');
    }

    getConversationDisplayName(conversation: Conversation): string {
        if (conversation.name) {
            return conversation.name;
        }
        const me = this.getLoggedInUserId();
        const parts = (conversation.participants || []).map((p: any) => String(p));
        const others = parts.filter(p => p !== me);
        const otherId = others[0] || parts[0] || '';
        const friend = this.friends.find(f => String(f.id) === otherId || f.email === otherId);
        return friend?.name || otherId || 'Unknown User';
    }
}
