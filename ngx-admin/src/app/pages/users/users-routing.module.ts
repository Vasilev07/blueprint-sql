import { Routes, RouterModule } from '@angular/router';

import { UsersComponent } from './users.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: UsersComponent,
  }
];
console.log('users routing');

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
  })
  export class UsersRoutingModule {
  }
