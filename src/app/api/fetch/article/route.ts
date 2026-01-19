import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(request: Request) {
  try {
    const { url, cookie, substackCookie } = await request.json();

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

    // Build headers - mimic a real browser as closely as possible
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    // Add referer for the site
    headers['Referer'] = `https://${parsedUrl.hostname}/`;
    headers['Origin'] = `https://${parsedUrl.hostname}`;

    // Add cookie if provided (supports any premium service)
    // Fall back to legacy substackCookie parameter for backwards compatibility
    const sessionCookie = cookie || substackCookie;
    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
      // Log cookie details for debugging
      console.log(`[Article Fetch] Using cookie for ${parsedUrl.hostname}`);
      console.log(`[Article Fetch] Cookie length: ${sessionCookie.length}`);
      // Log first 50 chars to see format (safe - just cookie names)
      console.log(`[Article Fetch] Cookie preview: ${sessionCookie.substring(0, 100)}...`);
    } else {
      console.log(`[Article Fetch] No cookie provided for ${parsedUrl.hostname}`);
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

    // Track if content appears paywalled
    let isPaywalled = false;

    // Substack specific
    if (parsedUrl.hostname.includes('substack.com') ||
        parsedUrl.hostname.endsWith('.substack.com')) {
      // Check for paywall indicators
      isPaywalled = $('.paywall').length > 0 ||
                    $('.paywall-title').length > 0 ||
                    $('[class*="paywall"]').length > 0 ||
                    html.includes('This post is for paid subscribers') ||
                    html.includes('This post is for paying subscribers') ||
                    html.includes('Subscribe to continue reading') ||
                    html.includes('Rest of this post is for paid');

      if (isPaywalled) {
        console.log('[Article Fetch] Substack paywall detected in response - cookie may be invalid/expired');
      }

      // Try multiple selectors for Substack content
      articleText = $('.body.markup').text() ||
                    $('[class*="body markup"]').text() ||
                    $('[class*="post-content"]').text() ||
                    $('.post-content').text() ||
                    $('article .available-content').text() ||
                    $('article').text();

      console.log(`[Article Fetch] Substack content length: ${articleText.length}, paywalled: ${isPaywalled}`);
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
        isPaywalled,
        usedCookie: !!sessionCookie,
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
