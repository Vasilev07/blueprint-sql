import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin-routing.module';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Components
import { AdminVerificationComponent } from './admin-verification/admin-verification.component';
import { AdminTransactionManagementComponent } from './admin-transaction-management/admin-transaction-management.component';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';

@NgModule({
  declarations: [],
  imports: [
    AdminVerificationComponent,
    AdminTransactionManagementComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    AdminRoutingModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    TagModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class AdminModule { }
