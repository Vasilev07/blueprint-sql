import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminVerificationComponent } from './admin-verification/admin-verification.component';
import { AdminGuard } from '../guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'verification',
    pathMatch: 'full'
  },
  {
    path: 'verification',
    component: AdminVerificationComponent,
    canActivate: [AdminGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
