import { Component, OnInit, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { AvatarModule } from "primeng/avatar";
import { TooltipModule } from "primeng/tooltip";
import { HttpClient } from "@angular/common/http";
import { MessagesService } from "src/typescript-api-client/src/api/api";
import { MessageDTO } from "../../typescript-api-client/src/model/models";
import { AuthService } from "../services/auth.service";
import { WebsocketService } from "../services/websocket.service";
import { PresenceService } from "../services/presence.service";
import { Subscription } from "rxjs";

type TabKey = "unread" | "read" | "vip";

@Component({
    selector: "app-messages",
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        AvatarModule,
        TooltipModule,
    ],
    templateUrl: "./messages.component.html",
    styleUrls: ["./messages.component.scss"],
})
export class MessagesComponent implements OnInit, OnDestroy {
    readonly messages = signal<MessageDTO[]>([]);
    readonly loading = signal(false);
    readonly currentUserEmail = signal("");
    readonly unreadCount = signal(0);
    readonly activeTab = signal<TabKey>("unread");

    readonly tabs: ReadonlyArray<{
        key: TabKey;
        label: string;
        icon: string;
    }> = [
        { key: "unread", label: "Unread", icon: "pi pi-envelope" },
        { key: "read", label: "Read", icon: "pi pi-check-circle" },
        { key: "vip", label: "VIP", icon: "pi pi-star" },
    ] as const;

    private messageSubscription?: Subscription;

    constructor(
        private messagesService: MessagesService,
        private router: Router,
        private authService: AuthService,
        private websocketService: WebsocketService,
        private httpClient: HttpClient,
        public presenceService: PresenceService,
    ) {}

    ngOnInit(): void {
        const email = this.authService.getUserEmail();
        this.currentUserEmail.set(email ?? "");
        if (email) {
            this.loadMessagesByTab(this.activeTab());
            this.loadUnreadCount();
            this.messageSubscription = this.websocketService
                .subscribeToMessages()
                .subscribe(() => {
                    this.loadMessagesByTab(this.activeTab());
                    this.loadUnreadCount();
                });
        }
    }

    ngOnDestroy(): void {
        this.messageSubscription?.unsubscribe();
        this.websocketService.disconnect();
    }

    loadMessages(): void {
        this.loading.set(true);
        this.messagesService
            .findInboxByEmail(this.currentUserEmail())
            .subscribe({
                next: (list) => {
                    this.messages.set(list);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error("Error loading messages:", error);
                    this.loading.set(false);
                },
            });
    }

    loadMessagesByTab(tab: TabKey): void {
        this.loading.set(true);
        const body = {
            email: this.currentUserEmail(),
            tab,
        };

        this.messagesService.findMessagesByTab(body).subscribe({
            next: (list: MessageDTO[]) => {
                const messages = Array.isArray(list) ? list : [];
                this.messages.set(messages);
                this.loading.set(false);
                if (tab === "unread") {
                    this.unreadCount.set(messages.length);
                }
            },
            error: (error) => {
                console.error(`Error loading ${tab} messages:`, error);
                this.loading.set(false);
            },
        });
    }

    private loadUnreadCount(): void {
        const body = {
            email: this.currentUserEmail(),
            tab: "unread",
        } as const;

        this.messagesService.findMessagesByTab(body).subscribe({
            next: (list: unknown) => {
                this.unreadCount.set(Array.isArray(list) ? list.length : 0);
            },
            error: (error) => {
                console.error("Error loading unread count:", error);
                this.unreadCount.set(0);
            },
        });
    }

    onTabChange(tab: TabKey): void {
        this.activeTab.set(tab);
        this.loadMessagesByTab(tab);
    }

    composeMessage(): void {
        this.router.navigate(["/messages/compose"]);
    }

    viewMessage(messageId: number): void {
        this.router.navigate(["/messages/view", messageId]);
    }

    markAsRead(message: MessageDTO): void {
        if (message.id != null) {
            this.messagesService.markAsRead(message.id).subscribe();
        }
    }

    archiveMessage(message: MessageDTO): void {
        if (message.id != null) {
            this.messagesService.archive(message.id).subscribe(() => {
                this.messages.update((list) =>
                    list.filter((m) => m.id !== message.id),
                );
            });
        }
    }

    deleteMessage(message: MessageDTO): void {
        if (message.id != null) {
            this.messagesService._delete(message.id).subscribe(() => {
                this.messages.update((list) =>
                    list.filter((m) => m.id !== message.id),
                );
            });
        }
    }
}
