import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import crypto from "crypto";

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// Generate unique filename
function generateFileName(originalName: string): string {
  const ext = originalName.substring(originalName.lastIndexOf("."));
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString("hex");
  return `${timestamp}-${randomStr}${ext}`;
}

// Upload to R2 (Production)
async function uploadToR2(
  file: File,
  fileName: string,
  r2Bucket: R2Bucket,
  r2PublicUrl: string,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  await r2Bucket.put(fileName, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Return the R2 public URL
  return `${r2PublicUrl}/${fileName}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      );
    }

    const fileName = generateFileName(file.name);

    // Get R2 bucket from Cloudflare context
    // In production (Cloudflare Workers), this is always available
    // In development, it's available via initOpenNextCloudflareForDev() with local R2 emulation
    const ctx = getCloudflareContext();
    const r2Bucket = ctx.env?.R2_BUCKET;
    const r2PublicUrl = ctx.env?.R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || "";

    if (!r2Bucket || typeof r2Bucket !== "object" || !("put" in r2Bucket)) {
      console.error("R2 bucket not available. Check wrangler.jsonc bindings.");
      return NextResponse.json(
        { error: "Upload service not configured" },
        { status: 503 },
      );
    }

    if (!r2PublicUrl) {
      console.error("R2_PUBLIC_URL not configured. Check wrangler.jsonc vars.");
      return NextResponse.json(
        { error: "Upload service not configured" },
        { status: 503 },
      );
    }

    const fileUrl = await uploadToR2(file, fileName, r2Bucket, r2PublicUrl);

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
