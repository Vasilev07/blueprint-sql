import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { User, Message, ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentUser: User | null = null;
  messages: Message[] = [];
  messageForm: FormGroup;
  isLoading = false;
  currentUserId: string = '';
  conversationId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private fb: FormBuilder
  ) {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const userId = params['userId'];
      if (userId) {
        this.currentUserId = userId;
        this.loadConversation(userId);
        this.loadUserData(userId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConversation(userId: string): void {
    this.isLoading = true;
    const otherUserId = Number(userId);
    this.chatService.getOrCreateConversation(otherUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conv) => {
          this.conversationId = conv.id;
          this.chatService.loadConversationMessages(conv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (messages: any[]) => {
                this.messages = messages as any;
                this.isLoading = false;
                this.scrollToBottom();
              },
              error: () => {
                this.isLoading = false;
              }
            });
          this.chatService.subscribeToConversation(conv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((msg: any) => {
              (this.messages as any).push(msg);
              this.scrollToBottom();
            });
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private loadUserData(userId: string): void {
    // Get user data from the service
    this.chatService.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.currentUser = users.find(user => user.id === userId) || null;
    });
  }

  sendMessage(): void {
    if (this.messageForm.valid && this.currentUserId) {
      const content = this.messageForm.get('content')?.value;
      this.chatService.sendChatMessage(this.conversationId, Number(this.currentUserId), content);
      this.messageForm.reset();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  goBack(): void {
    this.router.navigate(['/chat']);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isOwnMessage(message: any): boolean {
    const currentUserId = Number(JSON.parse(atob((localStorage.getItem('id_token') || '').split('.')[1] || 'e30='))?.id || 0);
    return Number(message.senderId) === currentUserId;
  }
}
