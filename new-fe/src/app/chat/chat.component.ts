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
    
    // Load messages
    this.chatService.getMessages(userId).pipe(takeUntil(this.destroy$)).subscribe(messages => {
      this.messages = messages;
      this.isLoading = false;
      this.scrollToBottom();
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
      
      const messageData = {
        senderId: '1', // Current user ID
        receiverId: this.currentUserId,
        content: content,
        isRead: false,
        type: 'text' as const
      };

      this.chatService.sendMessage(messageData).pipe(takeUntil(this.destroy$)).subscribe(newMessage => {
        this.messages.push(newMessage);
        this.messageForm.reset();
        this.scrollToBottom();
      });
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

  isOwnMessage(message: Message): boolean {
    return message.senderId === '1';
  }
}
