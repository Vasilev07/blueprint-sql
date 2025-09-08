import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
// import { MessageService, ConfirmationService } from 'primeng/api';
import { Story, StoriesService } from './stories.service';

@Component({
  selector: 'app-story-upload',
  templateUrl: './story-upload.component.html',
  styleUrls: ['./story-upload.component.scss']
})
export class StoryUploadComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  uploadForm: FormGroup;
  isUploading = false;
  uploadProgress = 0;
  selectedFile: File | null = null;
  videoPreview: string | null = null;
  videoDuration = 0;
  maxDuration = 60; // Maximum 60 seconds for stories
  
  categories = [
    { label: 'Lifestyle', value: 'lifestyle' },
    { label: 'Food & Cooking', value: 'food' },
    { label: 'Travel', value: 'travel' },
    { label: 'Fitness & Health', value: 'fitness' },
    { label: 'Music & Dance', value: 'music' },
    { label: 'Art & Creativity', value: 'art' },
    { label: 'Technology', value: 'technology' },
    { label: 'Fashion & Beauty', value: 'fashion' },
    { label: 'Sports', value: 'sports' },
    { label: 'Education', value: 'education' },
    { label: 'Comedy', value: 'comedy' },
    { label: 'Other', value: 'other' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private storiesService: StoriesService,
    // private messageService: MessageService,
    // private confirmationService: ConfirmationService
  ) {
    this.uploadForm = this.fb.group({
      caption: ['', [Validators.required, Validators.maxLength(200)]],
      category: ['', Validators.required],
      tags: [''],
      isPublic: [true],
      allowComments: [true],
      allowLikes: [true]
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        // this.messageService.add({
        //   severity: 'error',
        //   summary: 'Invalid File',
        //   detail: 'Please select a valid video file'
        // });
        return;
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        // this.messageService.add({
        //   severity: 'error',
        //   summary: 'File Too Large',
        //   detail: 'Video file size must be less than 100MB'
        // });
        return;
      }

      this.selectedFile = file;
      this.createVideoPreview(file);
    }
  }

  private createVideoPreview(file: File): void {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      this.videoDuration = video.duration;
      
      if (this.videoDuration > this.maxDuration) {
        // this.messageService.add({
        //   severity: 'warn',
        //   summary: 'Video Too Long',
        //   detail: `Video duration (${Math.round(this.videoDuration)}s) exceeds the maximum allowed duration (${this.maxDuration}s)`
        // });
      }
      
      // Create thumbnail from video
      video.currentTime = 1;
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          this.videoPreview = canvas.toDataURL('image/jpeg');
        }
        URL.revokeObjectURL(url);
      };
    };
    
    video.src = url;
  }

  onRemoveFile(): void {
    this.selectedFile = null;
    this.videoPreview = null;
    this.videoDuration = 0;
    this.uploadProgress = 0;
  }

  onTagsInput(event: any): void {
    const value = event.target.value;
    // Auto-add # if user types without it
    if (value && !value.startsWith('#')) {
      this.uploadForm.patchValue({ tags: '#' + value });
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async uploadStory(): Promise<void> {
    if (!this.selectedFile || this.uploadForm.invalid) {
      // this.messageService.add({
      //   severity: 'error',
      //   summary: 'Validation Error',
      //   detail: 'Please fill in all required fields and select a video file'
      // });
      return;
    }

    if (this.videoDuration > this.maxDuration) {
      // this.messageService.add({
      //   severity: 'error',
      //   summary: 'Video Too Long',
      //   detail: `Please select a video shorter than ${this.maxDuration} seconds`
      // });
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 10;
      }
    }, 200);

    try {
      // Simulate file upload delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Parse tags
      const tagsInput = this.uploadForm.get('tags')?.value || '';
      const tags = tagsInput
        .split(' ')
        .filter((tag: string) => tag.trim() && tag.startsWith('#'))
        .map((tag: string) => tag.substring(1).toLowerCase());

      // Create story data
      const storyData = {
        userId: '1', // Current user
        userName: 'You',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        videoUrl: URL.createObjectURL(this.selectedFile), // In real app, this would be the uploaded URL
        thumbnailUrl: this.videoPreview || 'https://via.placeholder.com/400x600',
        caption: this.uploadForm.get('caption')?.value,
        duration: this.videoDuration,
        tags: tags
      };

      // Upload story
      this.storiesService.uploadStory(storyData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (story) => {
            clearInterval(progressInterval);
            this.uploadProgress = 100;
            
            setTimeout(() => {
              // this.messageService.add({
              //   severity: 'success',
              //   summary: 'Upload Successful',
              //   detail: 'Your story has been uploaded successfully!'
              // });
              
              this.router.navigate(['/stories']);
            }, 500);
          },
          error: (error) => {
            clearInterval(progressInterval);
            this.isUploading = false;
            
            // this.messageService.add({
            //   severity: 'error',
            //   summary: 'Upload Failed',
            //   detail: 'Failed to upload story. Please try again.'
            // });
          }
        });

    } catch (error) {
      clearInterval(progressInterval);
      this.isUploading = false;
      
      // this.messageService.add({
      //   severity: 'error',
      //   summary: 'Upload Failed',
      //   detail: 'An unexpected error occurred. Please try again.'
      // });
    }
  }

  onCancel(): void {
    if (this.selectedFile || this.uploadForm.dirty) {
      // this.confirmationService.confirm({
      //   message: 'Are you sure you want to cancel? All progress will be lost.',
      //   header: 'Confirm Cancellation',
      //   icon: 'pi pi-exclamation-triangle',
      //   accept: () => {
      //     this.router.navigate(['/stories']);
      //   }
      // });
    } else {
      this.router.navigate(['/stories']);
    }
  }

  getRemainingCharacters(): number {
    const caption = this.uploadForm.get('caption')?.value || '';
    return 200 - caption.length;
  }
}