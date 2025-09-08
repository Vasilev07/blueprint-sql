import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  name?: string;
  avatar?: string;
  isOnline?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  private friendsSubject = new BehaviorSubject<User[]>([]);
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  private messagesSubject = new BehaviorSubject<Message[]>([]);

  public users$ = this.usersSubject.asObservable();
  public friends$ = this.friendsSubject.asObservable();
  public conversations$ = this.conversationsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'You',
        email: 'you@example.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        isOnline: true
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        isOnline: true
      },
      {
        id: '4',
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      },
      {
        id: '5',
        name: 'David Brown',
        email: 'david@example.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        isOnline: true
      },
      {
        id: '6',
        name: 'Emily Davis',
        email: 'emily@example.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      },
      {
        id: '7',
        name: 'Alex Chen',
        email: 'alex@example.com',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
        isOnline: true
      },
      {
        id: '8',
        name: 'Maria Garcia',
        email: 'maria@example.com',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      },
      {
        id: '9',
        name: 'Tom Wilson',
        email: 'tom@example.com',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
        isOnline: true
      },
      {
        id: '10',
        name: 'Lisa Anderson',
        email: 'lisa@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      }
    ];

    const mockFriends: User[] = [
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        isOnline: true
      },
      {
        id: '4',
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      },
      {
        id: '5',
        name: 'David Brown',
        email: 'david@example.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        isOnline: true
      },
      {
        id: '6',
        name: 'Emily Davis',
        email: 'emily@example.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      },
      {
        id: '7',
        name: 'Alex Chen',
        email: 'alex@example.com',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
        isOnline: true
      },
      {
        id: '8',
        name: 'Maria Garcia',
        email: 'maria@example.com',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      },
      {
        id: '9',
        name: 'Tom Wilson',
        email: 'tom@example.com',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
        isOnline: true
      },
      {
        id: '10',
        name: 'Lisa Anderson',
        email: 'lisa@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        isOnline: false
      }
    ];

    const mockConversations: Conversation[] = [
      {
        id: '1',
        participants: ['1', '2'],
        unreadCount: 2,
        name: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        isOnline: false,
        lastMessage: 'Hey, how are you?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5)
      },
      {
        id: '2',
        participants: ['1', '3'],
        unreadCount: 0,
        name: 'Mike Johnson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        isOnline: true,
        lastMessage: 'Great idea!',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 120)
      },
      {
        id: '3',
        participants: ['1', '4'],
        unreadCount: 1,
        name: 'Sarah Wilson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        isOnline: false,
        lastMessage: 'Can we meet tomorrow?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: '4',
        participants: ['1', '5'],
        unreadCount: 0,
        name: 'David Brown',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        isOnline: true,
        lastMessage: 'Thanks for the help!',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 180)
      },
      {
        id: '5',
        participants: ['1', '6'],
        unreadCount: 3,
        name: 'Emily Davis',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        isOnline: false,
        lastMessage: 'Did you see the new project?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60)
      }
    ];

    const mockMessages: Message[] = [
      { id: '1', senderId: '2', receiverId: '1', content: 'Hey, how are you?', timestamp: new Date(Date.now() - 1000 * 60 * 5), isRead: false, type: 'text' },
      { id: '2', senderId: '1', receiverId: '2', content: 'I\'m good, thanks!', timestamp: new Date(Date.now() - 1000 * 60 * 4), isRead: true, type: 'text' },
      { id: '3', senderId: '4', receiverId: '1', content: 'Can we meet tomorrow?', timestamp: new Date(Date.now() - 1000 * 60 * 30), isRead: false, type: 'text' },
      { id: '4', senderId: '6', receiverId: '1', content: 'Did you see the new project?', timestamp: new Date(Date.now() - 1000 * 60 * 60), isRead: false, type: 'text' },
      { id: '5', senderId: '1', receiverId: '3', content: 'Great idea!', timestamp: new Date(Date.now() - 1000 * 60 * 120), isRead: true, type: 'text' }
    ];

    this.usersSubject.next(mockUsers);
    this.friendsSubject.next(mockFriends);
    this.conversationsSubject.next(mockConversations);
    this.messagesSubject.next(mockMessages);
  }

  getLastRegisteredUsers(limit: number = 10): Observable<User[]> {
    return of(this.usersSubject.value.slice(-limit));
  }

  getTopFriends(limit: number = 10): Observable<User[]> {
    return of(this.friendsSubject.value.slice(0, limit));
  }

  getRecentMessages(limit: number = 5): Observable<Message[]> {
    const sortedMessages = this.messagesSubject.value
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    return of(sortedMessages);
  }

  getConversation(userId: string): Observable<Conversation | null> {
    const conversation = this.conversationsSubject.value
      .find(conv => conv.participants.includes(userId));
    return of(conversation || null);
  }

  getMessages(userId: string): Observable<Message[]> {
    const messages = this.messagesSubject.value
      .filter(msg => (msg.senderId === userId && msg.receiverId === '1') || 
                     (msg.senderId === '1' && msg.receiverId === userId))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return of(messages);
  }

  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Observable<Message> {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, newMessage]);

    // Update conversation
    const conversation = this.conversationsSubject.value
      .find(conv => conv.participants.includes(message.receiverId));
    
    if (conversation) {
      const updatedConversations = this.conversationsSubject.value.map(conv => 
        conv.id === conversation.id 
          ? { 
              ...conv, 
              lastMessage: newMessage.content, 
              lastMessageTime: newMessage.timestamp, 
              unreadCount: message.senderId === '1' ? conv.unreadCount : conv.unreadCount + 1 
            }
          : conv
      );
      this.conversationsSubject.next(updatedConversations);
    }

    return of(newMessage);
  }

  markAsRead(messageId: string): void {
    const messages = this.messagesSubject.value.map(msg => 
      msg.id === messageId ? { ...msg, isRead: true } : msg
    );
    this.messagesSubject.next(messages);
  }

  searchUsers(query: string): Observable<User[]> {
    const users = this.usersSubject.value.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    return of(users);
  }

  addFriend(userId: string): void {
    const user = this.usersSubject.value.find(u => u.id === userId);
    if (user && !this.friendsSubject.value.find(f => f.id === userId)) {
      const currentFriends = this.friendsSubject.value;
      this.friendsSubject.next([...currentFriends, user]);
    }
  }

  removeFriend(userId: string): void {
    const currentFriends = this.friendsSubject.value.filter(f => f.id !== userId);
    this.friendsSubject.next(currentFriends);
  }
} 