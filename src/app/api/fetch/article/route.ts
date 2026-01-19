import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(request: Request) {
  try {
    const { url, substackCookie } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Fetch the article with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Build headers
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    // Add Substack cookie if provided and URL is a Substack domain
    const isSubstack = parsedUrl.hostname.includes('substack.com') ||
                       parsedUrl.hostname.endsWith('.substack.com');
    if (isSubstack && substackCookie) {
      headers['Cookie'] = `substack.sid=${substackCookie}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers,
        // Follow redirects
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .comments, .sidebar, .advertisement, .ad, .social-share, .related-posts, .newsletter-signup, [role="complementary"], [role="navigation"]').remove();

    // Try to extract article title
    let title = '';
    title = $('h1.post-title').first().text().trim() ||
            $('h1[class*="title"]').first().text().trim() ||
            $('article h1').first().text().trim() ||
            $('h1').first().text().trim() ||
            $('title').text().trim();

    // Try to find article content using common selectors
    let articleText = '';

    // Substack specific
    if (parsedUrl.hostname.includes('substack.com')) {
      articleText = $('.body.markup').text() ||
                    $('[class*="post-content"]').text() ||
                    $('article').text();
    }
    // Medium specific
    else if (parsedUrl.hostname.includes('medium.com')) {
      articleText = $('article').text();
    }
    // Generic article extraction
    else {
      // Try common article containers
      const selectors = [
        'article',
        '[role="article"]',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.content',
        'main',
        '.post-body',
        '#content',
      ];

      for (const selector of selectors) {
        const text = $(selector).text().trim();
        if (text.length > articleText.length) {
          articleText = text;
        }
      }

      // Fallback to body if nothing found
      if (articleText.length < 100) {
        articleText = $('body').text();
      }
    }

    // Clean up text
    const cleanText = articleText
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/\n+/g, ' ')           // Remove newlines
      .replace(/\t+/g, ' ')           // Remove tabs
      .trim();

    if (cleanText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract readable content from this page' },
        { status: 400 }
      );
    }

    // Tokenize into words
    const words = cleanText.split(' ').filter(word => word.length > 0);

    // Limit to reasonable size (100k words)
    const limitedWords = words.slice(0, 100000);

    return NextResponse.json({
      title: title || parsedUrl.hostname,
      words: limitedWords,
      metadata: {
        source: parsedUrl.hostname,
        wordCount: limitedWords.length,
        truncated: words.length > 100000,
      },
    });
  } catch (error) {
    console.error('Article fetch error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - page took too long to load' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
