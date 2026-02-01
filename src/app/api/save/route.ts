import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * API endpoint to fetch and return article content for saving.
 * Used by the bookmarklet and share target.
 */
export async function POST(request: Request) {
  try {
    const { url, cookie } = await request.json();

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

    // Fetch the article
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    // Add cookie if provided (for paywalled content)
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers,
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .comments, .sidebar, .advertisement, .ad, .social-share, .related-posts, .newsletter-signup, [role="complementary"], [role="navigation"]').remove();

    // Extract title
    let title = '';
    title = $('h1.post-title').first().text().trim() ||
            $('h1[class*="title"]').first().text().trim() ||
            $('article h1').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            $('h1').first().text().trim() ||
            $('title').text().trim();

    // Extract article content based on site patterns
    let articleText = '';
    const hostname = parsedUrl.hostname;

    // Site-specific extraction
    if (hostname.includes('substack.com')) {
      articleText = $('.body.markup').text() ||
                    $('[class*="post-content"]').text() ||
                    $('article').text();
    } else if (hostname.includes('medium.com')) {
      articleText = $('article').text();
    } else if (hostname.includes('ft.com')) {
      articleText = $('[class*="article-body"]').text() ||
                    $('article').text();
    } else if (hostname.includes('spectator.co.uk') || hostname.includes('spectator.com')) {
      articleText = $('[class*="article-content"]').text() ||
                    $('article').text();
    } else {
      // Generic extraction
      const selectors = [
        'article',
        '[role="article"]',
        '.post-content',
        '.article-content',
        '.article-body',
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

      if (articleText.length < 100) {
        articleText = $('body').text();
      }
    }

    // Extract headings by finding h2/h3 elements and mapping to word positions
    const headings: { wordIndex: number; title: string; level: number }[] = [];

    const articleEl = $('article').length > 0 ? $('article') : $('main').length > 0 ? $('main') : $('body');
    const allText = articleEl.text();
    const allTextWords = allText.trim().split(/\s+/).filter(w => w.length > 0);

    articleEl.find('h2, h3').each((_, el) => {
      const headingText = $(el).text().trim();
      if (!headingText) return;

      const tagName = el.tagName?.toLowerCase();
      const headingWords = headingText.split(/\s+/).filter(w => w.length > 0);
      if (headingWords.length === 0) return;

      const firstWord = headingWords[0];
      for (let i = 0; i < allTextWords.length; i++) {
        if (allTextWords[i] === firstWord) {
          let match = true;
          for (let j = 1; j < headingWords.length && i + j < allTextWords.length; j++) {
            if (allTextWords[i + j] !== headingWords[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            headings.push({
              wordIndex: i,
              title: headingText,
              level: tagName === 'h2' ? 2 : 3,
            });
            break;
          }
        }
      }
    });

    // Clean up text
    const cleanText = articleText
      .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Fix missing spaces after punctuation
      .replace(/([.!?])(['""\)\]]+)([A-Z])/g, '$1$2 $3')
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      .replace(/(['""])([A-Z])/g, '$1 $2')
      .trim();

    if (cleanText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract readable content' },
        { status: 400 }
      );
    }

    const wordCount = cleanText.split(' ').filter(w => w.length > 0).length;

    return NextResponse.json({
      url,
      title: title || hostname,
      content: cleanText,
      headings: headings.filter(h => h.wordIndex < wordCount),
      source: hostname.replace(/^www\./, ''),
      wordCount,
    });
  } catch (error) {
    console.error('Save article error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
