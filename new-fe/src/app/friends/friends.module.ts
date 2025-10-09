import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabViewModule } from 'primeng/tabview';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { MessageService, ConfirmationService } from 'primeng/api';

import { FriendsComponent } from './friends.component';
import { AllUsersComponent } from './all-users/all-users.component';
import { FriendRequestsComponent } from './friend-requests/friend-requests.component';
import { MyFriendsComponent } from './my-friends/my-friends.component';
import { UserService } from 'src/typescript-api-client/src/api/api';

const routes: Routes = [
  {
    path: '',
    component: FriendsComponent
  }
];

@NgModule({
  declarations: [
    FriendsComponent,
    AllUsersComponent,
    FriendRequestsComponent,
    MyFriendsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    TableModule,
    ButtonModule,
    CardModule,
    AvatarModule,
    ToastModule,
    ConfirmDialogModule,
    TabViewModule,
    ChipModule,
    BadgeModule
  ],
  providers: [MessageService, ConfirmationService, UserService]
})
export class FriendsModule { }
