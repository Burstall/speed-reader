import { NextResponse } from 'next/server';
import type { ContentHeading } from '@/types';

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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 413 }
      );
    }

    if (!file.name.endsWith('.epub')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an EPUB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('EPUB processing timeout')), 8000);
    });

    const parsePromise = parseEpub(arrayBuffer);
    const result = await Promise.race([parsePromise, timeoutPromise]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('EPUB parse error:', error);

    if (error instanceof Error && error.message === 'EPUB processing timeout') {
      return NextResponse.json(
        { error: 'EPUB too complex to process. Try a smaller file.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to parse EPUB' },
      { status: 500 }
    );
  }
}

async function parseEpub(arrayBuffer: ArrayBuffer) {
  const JSZip = (await import('jszip')).default;
  const cheerio = await import('cheerio');

  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Find OPF file path from container.xml
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) {
    throw new Error('Invalid EPUB: missing container.xml');
  }

  const container$ = cheerio.load(containerXml, { xmlMode: true });
  const opfPath = container$('rootfile').attr('full-path');
  if (!opfPath) {
    throw new Error('Invalid EPUB: no OPF path found');
  }

  // 2. Parse OPF for metadata and spine
  const opfContent = await zip.file(opfPath)?.async('string');
  if (!opfContent) {
    throw new Error('Invalid EPUB: OPF file not found');
  }

  const opf$ = cheerio.load(opfContent, { xmlMode: true });
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // Extract title
  const title = opf$('dc\\:title, title').first().text() || 'Untitled';

  // Build manifest map: id -> href
  const manifest: Record<string, string> = {};
  opf$('manifest item').each((_, el) => {
    const id = opf$(el).attr('id');
    const href = opf$(el).attr('href');
    if (id && href) {
      manifest[id] = href;
    }
  });

  // Get spine order (list of itemref idrefs)
  const spineRefs: string[] = [];
  opf$('spine itemref').each((_, el) => {
    const idref = opf$(el).attr('idref');
    if (idref) spineRefs.push(idref);
  });

  if (spineRefs.length === 0) {
    throw new Error('Invalid EPUB: no spine entries found');
  }

  // 3. Read each chapter in spine order, extract text
  const allWords: string[] = [];
  const headings: ContentHeading[] = [];
  let chapterCount = 0;

  for (const idref of spineRefs) {
    const href = manifest[idref];
    if (!href) continue;

    const filePath = opfDir + decodeURIComponent(href);
    const content = await zip.file(filePath)?.async('string');
    if (!content) continue;

    const ch$ = cheerio.load(content);

    // Remove script and style elements
    ch$('script, style').remove();

    // Extract headings with word indices
    ch$('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const headingText = ch$(el).text().trim();
      if (headingText) {
        const level = parseInt(el.tagName.charAt(1), 10);
        headings.push({
          wordIndex: allWords.length,
          title: headingText,
          level,
        });
      }
    });

    // Extract body text
    const bodyText = ch$('body').text()
      .replace(/\s+/g, ' ')
      .trim();

    if (bodyText) {
      const chapterWords = bodyText.split(' ').filter(w => w.length > 0);
      allWords.push(...chapterWords);
      chapterCount++;
    }
  }

  if (allWords.length === 0) {
    throw new Error('No text found in EPUB');
  }

  return {
    words: allWords,
    headings,
    metadata: {
      title,
      chapterCount,
      wordCount: allWords.length,
    },
  };
}
