import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {
    NbAuthComponent,
    NbLogoutComponent,
    NbRequestPasswordComponent,
    NbResetPasswordComponent,
} from '@nebular/auth';
import { NgxLoginComponent } from './pages/auth/login/login.component';
import { NgxRegisterComponent } from './pages/auth/register/register.component';

export const routes: Routes = [
    {
        path: 'pages',
        // canActivate: [AuthGuard],
        loadChildren: () => import('./pages/pages.module')
            .then(m => m.PagesModule),
    },
    {
        path: 'auth',
        component: NbAuthComponent,
        children: [
            {
                path: '',
                component: NgxLoginComponent,
                loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule),
            },
            {
                path: 'login',
                component: NgxLoginComponent,
                loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule),
            },
            {
                path: 'register',
                component: NgxRegisterComponent,
                loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule),
            },
            {
                path: 'logout',
                component: NbLogoutComponent,
            },
            {
                path: 'request-password',
                component: NbRequestPasswordComponent,
            },
            {
                path: 'reset-password',
                component: NbResetPasswordComponent,
            },
        ],
    },
    { path: '', redirectTo: 'pages', pathMatch: 'full' },
    { path: '**', redirectTo: 'pages' },
];

const config: ExtraOptions = {
    useHash: false,
    // enableTracing: true,
};

@NgModule({
    imports: [RouterModule.forRoot(routes, config)],
    exports: [RouterModule],
})
export class AppRoutingModule {
}
