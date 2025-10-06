import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Message } from './chat.service';

@Component({
  selector: 'app-recent-messages',
  templateUrl: './recent-messages.component.html',
  styleUrls: ['./recent-messages.component.scss']
})
export class RecentMessagesComponent {
  @Input() messages: Message[] = [];
  @Output() messageClick = new EventEmitter<string>();

  onMessageClick(userId: string): void {
    this.messageClick.emit(userId);
  }

  getMessagePreview(content: string): string {
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  getUserName(userId: string): string {
    const userNames: { [key: string]: string } = {
      '1': 'You',
      '2': 'Jane Smith',
      '3': 'Mike Johnson',
      '4': 'Sarah Wilson',
      '5': 'David Brown',
      '6': 'Emily Davis',
      '7': 'Alex Chen',
      '8': 'Maria Garcia',
      '9': 'Tom Wilson',
      '10': 'Lisa Anderson'
    };
    return userNames[userId] || 'Unknown User';
  }

  getUserAvatar(userId: string): string {
    const userAvatars: { [key: string]: string } = {
      '1': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      '2': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      '3': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      '4': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      '5': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      '6': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      '7': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      '8': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
      '9': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      '10': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    };
    return userAvatars[userId] || 'https://via.placeholder.com/150';
  }

  isUserOnline(userId: string): boolean {
    const userStatus: { [key: string]: boolean } = {
      '1': true,
      '2': false,
      '3': true,
      '4': false,
      '5': true,
      '6': false,
      '7': true,
      '8': false,
      '9': true,
      '10': false
    };
    return userStatus[userId] || false;
  }

  getMessageIcon(message: Message): string {
    switch (message.type) {
      case 'image':
        return 'pi pi-image';
      case 'file':
        return 'pi pi-file';
      default:
        return 'pi pi-comment';
    }
  }
} 