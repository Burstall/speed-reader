import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
export const maxDuration = 15;

interface FeedArticle {
  title: string;
  url: string;
  excerpt?: string;
  date?: string;
  author?: string;
  isPremium?: boolean;
}

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

    // Fetch the feed page
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': `https://${parsedUrl.hostname}/`,
    };

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

    let articles: FeedArticle[] = [];

    // Substack inbox - use API instead of scraping (page is JS-rendered)
    if (parsedUrl.hostname === 'substack.com' && parsedUrl.pathname.includes('inbox')) {
      articles = await fetchSubstackInboxAPI(cookie);
    }
    // Substack publication archive pages
    else if (parsedUrl.hostname.includes('substack.com') || parsedUrl.hostname.includes('.substack.')) {
      articles = parseSubstackFeed($, parsedUrl);
    }
    // Financial Times
    else if (parsedUrl.hostname.includes('ft.com')) {
      articles = parseFTFeed($, parsedUrl);
    }
    // Generic feed parsing
    else {
      articles = parseGenericFeed($, parsedUrl);
    }

    // Dedupe by URL
    const seen = new Set<string>();
    articles = articles.filter(a => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    return NextResponse.json({
      articles,
      source: parsedUrl.hostname,
      count: articles.length,
    });
  } catch (error) {
    console.error('Feed fetch error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

async function fetchSubstackInboxAPI(cookie?: string): Promise<FeedArticle[]> {
  const articles: FeedArticle[] = [];

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  };

  if (cookie) {
    headers['Cookie'] = cookie;
  }

  // Try multiple Substack API endpoints
  const endpoints = [
    'https://substack.com/api/v1/reader/posts',
    'https://substack.com/api/v1/inbox',
    'https://substack.com/api/v1/reader/inbox',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying Substack endpoint: ${endpoint}`);
      const response = await fetch(endpoint, { headers });

      if (!response.ok) {
        console.log(`${endpoint} returned ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log(`${endpoint} returned keys:`, Object.keys(data));

      // Try to find posts in various response structures
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let posts: any[] = [];

      if (Array.isArray(data)) {
        posts = data;
      } else if (data.posts) {
        posts = data.posts;
      } else if (data.items) {
        posts = data.items;
      } else if (data.inbox) {
        posts = data.inbox;
      } else if (data.data) {
        posts = Array.isArray(data.data) ? data.data : [data.data];
      }

      if (posts.length === 0) {
        console.log(`No posts found in ${endpoint} response`);
        continue;
      }

      console.log(`Found ${posts.length} posts from ${endpoint}`);

      for (const post of posts) {
        if (!post) continue;

        // Handle nested post structure (post might be wrapper with .post inside)
        const actualPost = post.post || post;

        const title = actualPost.title;
        let url = actualPost.canonical_url;

        // Build URL from slug if no canonical_url
        if (!url && actualPost.slug) {
          const subdomain = actualPost.publication?.subdomain ||
                           post.publication?.subdomain ||
                           actualPost.publication_id;
          if (subdomain) {
            url = `https://${subdomain}.substack.com/p/${actualPost.slug}`;
          }
        }

        if (!title || !url) continue;

        articles.push({
          title: title.slice(0, 200),
          url,
          excerpt: (actualPost.subtitle || actualPost.description || actualPost.truncated_body_text || '').slice(0, 300) || undefined,
          date: actualPost.post_date || actualPost.published_at,
          author: actualPost.publishedBylines?.[0]?.name ||
                  post.publication?.name ||
                  actualPost.publication?.name,
          isPremium: actualPost.audience === 'only_paid',
        });
      }

      if (articles.length > 0) {
        console.log(`Successfully parsed ${articles.length} articles from ${endpoint}`);
        return articles;
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
    }
  }

  console.log('All Substack API endpoints failed or returned no articles');
  return articles;
}

function parseSubstackFeed($: cheerio.CheerioAPI, baseUrl: URL): FeedArticle[] {
  const articles: FeedArticle[] = [];
  const baseOrigin = `${baseUrl.protocol}//${baseUrl.hostname}`;

  // Substack archive page format
  $('article, .post-preview, [class*="post-preview"]').each((_, el) => {
    const $el = $(el);

    // Find the title and link
    const $titleLink = $el.find('a[data-post-id], a.post-preview-title, h2 a, h3 a').first();
    const title = $titleLink.text().trim() ||
                  $el.find('[class*="post-title"]').text().trim() ||
                  $el.find('h2, h3').first().text().trim();

    let href = $titleLink.attr('href') || '';

    if (!title || !href) return;

    // Make URL absolute
    if (href.startsWith('/')) {
      href = baseOrigin + href;
    } else if (!href.startsWith('http')) {
      href = baseOrigin + '/' + href;
    }

    // Get excerpt
    const excerpt = $el.find('.post-preview-description, [class*="subtitle"], .subtitle').text().trim() ||
                    $el.find('p').first().text().trim();

    // Get date
    const dateText = $el.find('time').attr('datetime') ||
                     $el.find('[class*="date"]').text().trim();

    // Check if premium/paid
    const isPremium = $el.find('[class*="lock"], [class*="premium"], [class*="paid"]').length > 0 ||
                      $el.text().toLowerCase().includes('paid subscribers');

    articles.push({
      title: title.slice(0, 200),
      url: href,
      excerpt: excerpt.slice(0, 300) || undefined,
      date: dateText || undefined,
      isPremium,
    });
  });

  // Also try the inbox/feed format
  if (articles.length === 0) {
    $('a[href*="/p/"]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      const title = $el.text().trim();

      if (title && href && title.length > 10 && !href.includes('/comments')) {
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = baseOrigin + href;
        }

        articles.push({
          title: title.slice(0, 200),
          url: fullUrl,
        });
      }
    });
  }

  return articles;
}

function parseFTFeed($: cheerio.CheerioAPI, baseUrl: URL): FeedArticle[] {
  const articles: FeedArticle[] = [];

  $('article, .o-teaser').each((_, el) => {
    const $el = $(el);

    const $link = $el.find('a.js-teaser-heading-link, a[data-trackable="heading-link"], h3 a, h2 a').first();
    const title = $link.text().trim() || $el.find('.o-teaser__heading').text().trim();
    let href = $link.attr('href') || '';

    if (!title || !href) return;

    if (href.startsWith('/')) {
      href = 'https://www.ft.com' + href;
    }

    const excerpt = $el.find('.o-teaser__standfirst, p').first().text().trim();

    articles.push({
      title: title.slice(0, 200),
      url: href,
      excerpt: excerpt.slice(0, 300) || undefined,
    });
  });

  return articles;
}

function parseGenericFeed($: cheerio.CheerioAPI, baseUrl: URL): FeedArticle[] {
  const articles: FeedArticle[] = [];
  const baseOrigin = `${baseUrl.protocol}//${baseUrl.hostname}`;

  // Try common article listing patterns
  $('article, .post, .article, .story, [class*="article-card"], [class*="post-card"]').each((_, el) => {
    const $el = $(el);

    const $link = $el.find('h1 a, h2 a, h3 a, a[class*="title"], a[class*="headline"]').first();
    let title = $link.text().trim();
    let href = $link.attr('href') || '';

    // Fallback to any link with substantial text
    if (!title || !href) {
      const $anyLink = $el.find('a').filter((_, a) => {
        const text = $(a).text().trim();
        return text.length > 20 && text.length < 200;
      }).first();
      title = $anyLink.text().trim();
      href = $anyLink.attr('href') || '';
    }

    if (!title || !href) return;

    if (href.startsWith('/')) {
      href = baseOrigin + href;
    }

    const excerpt = $el.find('p, .excerpt, .summary, [class*="excerpt"]').first().text().trim();

    articles.push({
      title: title.slice(0, 200),
      url: href,
      excerpt: excerpt.slice(0, 300) || undefined,
    });
  });

  return articles;
}
