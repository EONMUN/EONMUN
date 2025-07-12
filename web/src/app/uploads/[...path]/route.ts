import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join('/');
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_API_URL;
    
    if (!strapiUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_STRAPI_API_URL environment variable is not set' },
        { status: 500 }
      );
    }

    const targetUrl = `${strapiUrl}/uploads/${filePath}`;
    
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from Strapi' },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}