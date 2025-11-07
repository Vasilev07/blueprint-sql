import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { VideoCallComponent } from './video-call.component';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';

const routes: Routes = [
    {
        path: '',
        component: VideoCallComponent
    }
];

@NgModule({
    declarations: [
        VideoCallComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        ButtonModule,
        ToastModule,
        ProgressSpinnerModule,
        AvatarModule,
        TooltipModule,
        RippleModule
    ]
})
export class VideoCallModule { }

