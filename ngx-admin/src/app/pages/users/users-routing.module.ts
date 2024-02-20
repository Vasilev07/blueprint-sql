import { Routes, RouterModule } from '@angular/router';

import { UsersComponent } from './users.component';

const routes: Routes = [
  {
    path: '',
    component: UsersComponent
  }
];
console.log('users routing');

export const routing = RouterModule.forChild(routes);
