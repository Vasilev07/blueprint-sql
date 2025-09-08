import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/typescript-api-client/src/api/api';
import { FriendsService } from 'src/typescript-api-client/src/api/api';
import { UserDTO } from 'src/typescript-api-client/src/model/models';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss']
})
export class FriendsComponent implements OnInit {
  users: UserDTO[] = [];
  loading = true;
  friendRequests: Map<number, string> = new Map(); // Tracks request status per user

  constructor(
    private userService: UserService,
    private friendsService: FriendsService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: async (users) => {
        this.users = users;
        await this.loadFriendshipStatuses();
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users'
        });
        this.loading = false;
      }
    });
  }

  getButtonClass(userId: number): string {
    switch(this.friendRequests.get(userId)) {
      case 'pending': return 'p-button-warning';
      case 'accepted': return 'p-button-success';
      case 'blocked': return 'p-button-danger';
      default: return 'p-button-primary';
    }
  }

  getButtonLabel(userId: number): string {
    switch(this.friendRequests.get(userId)) {
      case 'pending': return 'Request Sent';
      case 'accepted': return 'Friends';
      case 'blocked': return 'Blocked';
      default: return 'Add Friend';
    }
  }

  async loadFriendshipStatuses() {
    for (const user of this.users) {
      if (user.id) {
        try {
          const status = await this.friendsService.getFriendshipStatus(user.id).toPromise();
          this.friendRequests.set(user.id, status || '');
        } catch (error) {
          console.error('Error loading friendship status:', error);
        }
      }
    }
  }

  sendFriendRequest(userId: number) {
    if (!userId) return;
    
    this.friendsService.sendFriendRequest(userId).subscribe({
      next: () => {
        this.friendRequests.set(userId, 'pending');
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Friend request sent!'
        });
      },
      error: (error) => {
        console.error('Error sending friend request:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send friend request'
        });
      }
    });
  }
}
