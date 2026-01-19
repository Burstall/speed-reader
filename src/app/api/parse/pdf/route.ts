import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 10; // Vercel hobby tier limit

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
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
        { error: 'File too large (max 10MB)' },
        { status: 413 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF with timeout
    const pdfParse = (await import('pdf-parse')).default;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('PDF processing timeout')), 8000);
    });

    const parsePromise = pdfParse(buffer, {
      // Limit pages for very large documents
      max: 500,
    });

    const data = await Promise.race([parsePromise, timeoutPromise]);

    // Extract and clean text
    const text = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')  // Collapse multiple newlines
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: 'No text found in PDF. It may be scanned or image-based.' },
        { status: 400 }
      );
    }

    // Tokenize into words
    const words = text.split(' ').filter(word => word.length > 0);

    return NextResponse.json({
      words,
      metadata: {
        title: file.name.replace('.pdf', ''),
        pageCount: data.numpages,
        wordCount: words.length,
      },
    });
  } catch (error) {
    console.error('PDF parse error:', error);

    if (error instanceof Error && error.message === 'PDF processing timeout') {
      return NextResponse.json(
        { error: 'PDF too complex to process. Try a smaller file.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
