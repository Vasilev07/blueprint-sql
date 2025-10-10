# FFmpeg Setup for Story Video Processing

## What is FFmpeg?

FFmpeg is required for:
- Video metadata extraction (duration, width, height)
- Thumbnail generation from videos
- Video compression (H.264 encoding)

**The app will run without FFmpeg**, but these features will be disabled.

## Installation

### macOS
```bash
brew install ffmpeg
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

### Windows
1. Download from: https://ffmpeg.org/download.html
2. Extract and add to PATH
3. Or use Chocolatey: `choco install ffmpeg`

## Verify Installation

```bash
ffmpeg -version
ffprobe -version
```

## After Installation

Restart your NestJS server:
```bash
npm run start:dev
```

Stories will now have:
- ✅ Automatic thumbnail generation
- ✅ Video metadata (duration, resolution)
- ✅ H.264 compression (reduces file size by ~50%)

## Without FFmpeg

Stories still work, but:
- ⚠️ No thumbnails
- ⚠️ No video metadata
- ⚠️ No compression (larger files)
- ✅ Upload/download works fine
- ✅ All other features work

Check logs for warnings about FFmpeg availability.

