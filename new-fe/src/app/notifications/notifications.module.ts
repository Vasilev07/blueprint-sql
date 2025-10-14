import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { NotificationComponent } from './notification.component';

@NgModule({
  declarations: [
    NotificationComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    OverlayPanelModule,
    AvatarModule,
    TooltipModule
  ],
  exports: [
    NotificationComponent
  ]
})
export class NotificationsModule { }
