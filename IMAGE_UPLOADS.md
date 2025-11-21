# Image Upload System

This document explains how to use the image upload system in the EONMUN web application, which supports both local development and production (Cloudflare R2) environments.

## Overview

The image upload system provides:
- **Local Development**: Files saved to `public/uploads/` directory
- **Production**: Files uploaded to Cloudflare R2 object storage
- **File Validation**: Size limits (10MB) and type restrictions (images only)
- **Easy Integration**: Simple React component for uploading images

## Architecture

### Local Development
- Files are stored in `public/uploads/` directory
- Accessible at `http://localhost:3002/uploads/filename.jpg`
- No additional configuration needed
- Perfect for development and testing

### Production (Cloudflare R2)
- Files are uploaded to Cloudflare R2 bucket
- Served via R2 public URL or custom CDN domain
- Automatic fallback to local storage if R2 is not configured
- Scalable and cost-effective

## Setup

### Local Development Setup

No configuration needed! Just start the development server:

```bash
npm run dev
```

Uploaded files will be automatically saved to `public/uploads/` and accessible at `http://localhost:3002/uploads/`.

### Production Setup (Cloudflare R2)

#### 1. Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **R2** → **Create bucket**
3. Name your bucket (e.g., `eonmun-uploads`)
4. Click **Create bucket**

#### 2. Configure Public Access

**Option A: Use R2.dev subdomain (easiest)**
1. Go to your bucket settings → **Public access**
2. Enable **Allow Access**
3. Copy the R2.dev URL (e.g., `https://pub-xxxxx.r2.dev`)

**Option B: Use custom domain (recommended)**
1. Go to your bucket settings → **Custom domains**
2. Click **Connect domain**
3. Enter your domain (e.g., `cdn.eonmun.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation

#### 3. Update Configuration Files

**Update wrangler.jsonc:**
The R2 bucket binding is already configured in `wrangler.jsonc`. Just update the bucket name if needed:

```jsonc
"r2_buckets": [
  {
    "binding": "R2_BUCKET",
    "bucket_name": "eonmun-uploads"  // Your actual bucket name
  }
]
```

**Set Environment Variable:**
Create `.env.production` (copy from `.env.production.example`) and set:

```bash
R2_PUBLIC_URL=https://cdn.eonmun.com  # Your R2 public URL
```

#### 4. Deploy

```bash
npm run deploy
```

## Usage

### Using the ImageUpload Component

```tsx
import ImageUpload from '@/components/ImageUpload';

function MyPage() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <div>
      <ImageUpload
        onUploadComplete={(url) => setImageUrl(url)}
        currentImageUrl={imageUrl}
        className="my-4"
      />

      {imageUrl && (
        <p>Image uploaded to: {imageUrl}</p>
      )}
    </div>
  );
}
```

### Component Props

- `onUploadComplete: (url: string) => void` - Callback fired when upload completes with the image URL
- `currentImageUrl?: string` - Optional current image URL to display as preview
- `className?: string` - Optional CSS classes to apply to the component

### Using the API Directly

You can also upload files directly using the `/api/upload` endpoint:

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
// data.url contains the uploaded file URL
```

#### API Response

**Success (200):**
```json
{
  "success": true,
  "url": "https://cdn.eonmun.com/1234567890-abc123.jpg",
  "fileName": "1234567890-abc123.jpg",
  "fileSize": 524288,
  "fileType": "image/jpeg"
}
```

**Error (400/500):**
```json
{
  "error": "File size exceeds 10MB limit"
}
```

## File Validation

### Allowed File Types
- image/jpeg
- image/jpg
- image/png
- image/gif
- image/webp
- image/svg+xml

### Size Limit
- Maximum file size: **10MB**

### File Naming
Files are automatically renamed to prevent conflicts:
- Format: `{timestamp}-{randomHash}.{extension}`
- Example: `1704067200000-a1b2c3d4e5f6g7h8.jpg`

## Example: NFT Minting Form

Replace the manual image URL input with the ImageUpload component:

```tsx
"use client";
import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';

export default function MintPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',  // This will be set by ImageUpload
  });

  return (
    <form>
      <div>
        <label>NFT Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <label>NFT Image</label>
        <ImageUpload
          onUploadComplete={(url) => setFormData({ ...formData, image: url })}
          currentImageUrl={formData.image}
        />
      </div>

      <button type="submit">Mint NFT</button>
    </form>
  );
}
```

## Troubleshooting

### Local Development Issues

**Problem: Files not appearing in public/uploads/**
- Check that the `public` directory exists in your project root
- Verify write permissions on the `public` directory

**Problem: 404 when accessing uploaded images**
- Ensure Next.js dev server is running
- Files in `public/` are served at the root path (e.g., `/uploads/file.jpg`)

### Production Issues

**Problem: Upload succeeds but image doesn't load**
- Verify `R2_PUBLIC_URL` is set correctly in environment variables
- Check that R2 bucket has public access enabled
- If using custom domain, verify DNS is configured correctly

**Problem: "Failed to upload file" error**
- Check that R2 bucket binding is configured in `wrangler.jsonc`
- Verify bucket name matches actual bucket in Cloudflare
- Check Cloudflare Dashboard for R2 bucket errors

**Problem: CORS errors when uploading**
- R2 buckets may need CORS configuration for browser uploads
- Go to R2 bucket → Settings → CORS policy
- Add appropriate CORS rules for your domain

## Cost Considerations

### Cloudflare R2 Pricing (as of 2024)
- **Storage**: $0.015 per GB/month
- **Class A Operations** (writes): $4.50 per million requests
- **Class B Operations** (reads): $0.36 per million requests
- **No egress fees** when accessed via Cloudflare

For a typical art NFT platform:
- 1000 images at 2MB each = 2GB storage = **$0.03/month**
- 10,000 uploads per month = **$0.045/month**
- 100,000 views per month = **$0.036/month**

**Total estimated cost: ~$0.11/month** for a medium-traffic site

## Security Considerations

1. **File Type Validation**: Only images are allowed
2. **Size Limits**: 10MB maximum to prevent abuse
3. **Unique Filenames**: Prevents overwrites and conflicts
4. **Server-Side Processing**: All validation happens on the server
5. **Public Access**: Files are publicly accessible - don't upload sensitive content

## Next Steps

- [ ] Add image optimization (resize, compress)
- [ ] Add virus/malware scanning
- [ ] Add user-specific upload directories
- [ ] Add image metadata extraction (EXIF, dimensions)
- [ ] Add upload progress tracking with WebSockets
- [ ] Add bulk upload support

## Related Files

- `/web/src/app/api/upload/route.ts` - Upload API endpoint
- `/web/src/components/ImageUpload.tsx` - Upload component
- `/web/wrangler.jsonc` - Cloudflare Workers & R2 configuration
- `/web/.env.production.example` - Production environment template
- `/web/.env.example` - Development environment template
