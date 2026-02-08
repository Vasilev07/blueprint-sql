import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MultiSelectModule } from 'primeng/multiselect';

import { MessagesComponent } from './messages.component';
import { MessageComposeComponent } from './message-compose.component';
import { MessageListComponent } from './message-list.component';
import { MessageViewComponent } from './message-view.component';
import { MessagesService } from 'src/typescript-api-client/src/api/api';
import { UserService } from 'src/typescript-api-client/src/api/api';
import { MessageService } from 'primeng/api';

const routes: Routes = [
  {
    path: '',
    component: MessagesComponent
  },
  {
    path: 'compose',
    component: MessageComposeComponent
  },
  {
    path: 'view/:id',
    component: MessageViewComponent
  }
];

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    InputTextModule,
    ButtonModule,
    CardModule,
    AvatarModule,
    BadgeModule,
    ScrollPanelModule,
    DividerModule,
    TooltipModule,
    MenuModule,
    DialogModule,
    TextareaModule,
    SelectModule,
        DatePickerModule,
    FileUploadModule,
    ProgressBarModule,
    ToastModule,
    ConfirmDialogModule,
    CheckboxModule,
    TabsModule,
    SplitButtonModule,
    MultiSelectModule,
    MessageComposeComponent,
    MessagesComponent,
    MessageListComponent,
    MessageViewComponent
  ],
  providers: [MessageService, MessagesService, UserService]
})
export class MessagesModule { }
