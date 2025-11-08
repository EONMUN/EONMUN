import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

// Generate unique filename
function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomStr}${ext}`;
}

// Upload to R2 (Production)
async function uploadToR2(
  file: File,
  fileName: string,
  r2Bucket: R2Bucket
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  await r2Bucket.put(fileName, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Return the R2 public URL
  const r2PublicUrl = process.env.R2_PUBLIC_URL || '';
  return `${r2PublicUrl}/${fileName}`;
}

// Upload to local filesystem (Development)
async function uploadToLocal(
  file: File,
  fileName: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  // Create uploads directory if it doesn't exist
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, fileName);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await writeFile(filePath, buffer);

  // Return the public URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  return `${appUrl}/uploads/${fileName}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    const fileName = generateFileName(file.name);
    let fileUrl: string;

    // Check if we're in production with R2 binding
    // @ts-expect-error - R2 binding is available in Cloudflare Workers
    const r2Bucket = globalThis.R2_BUCKET || process.env.R2_BUCKET;

    if (r2Bucket && typeof r2Bucket === 'object' && 'put' in r2Bucket) {
      // Production: Upload to R2
      fileUrl = await uploadToR2(file, fileName, r2Bucket as R2Bucket);
    } else {
      // Development: Upload to local filesystem
      fileUrl = await uploadToLocal(file, fileName);
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      fileSize: file.size,
      fileType: file.type,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Cloudflare R2Bucket type definition
interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream, options?: {
    httpMetadata?: {
      contentType?: string;
      contentLanguage?: string;
      contentDisposition?: string;
      contentEncoding?: string;
      cacheControl?: string;
      cacheExpiry?: Date;
    };
    customMetadata?: Record<string, string>;
  }): Promise<void>;
}
