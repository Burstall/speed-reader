# SEO Configuration - Canonical Tags

This document explains how canonical tags are implemented to prevent the "Duplicate page without canonical tag" issue in Google Search Console.

## Problem

Google was finding multiple URLs with similar content but no canonical tags to indicate which version should be indexed. This commonly occurs with:
- URL parameters (e.g., `?ref=123`, `?utm_source=twitter`)
- Hash fragments (e.g., `/#/page`, `/page#section`)
- Trailing slash variations (e.g., `/page` vs `/page/`)
- Protocol variations (http vs https)
- Subdomain variations (www vs non-www)

## Solution

We've implemented canonical tags across all pages using Next.js metadata API.

### 1. Environment Variable

Set `NEXT_PUBLIC_SITE_URL` to your production URL:

```env
NEXT_PUBLIC_SITE_URL=https://speedrdr.com
```

This is used as the base URL for all canonical tags.

### 2. Root Layout Canonical

[src/app/layout.tsx](src/app/layout.tsx) sets the metadata base and home page canonical:

```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedrdr.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  // ... other metadata
};
```

### 3. Page-Specific Canonicals

Each page has its own layout file with a canonical tag:

- [src/app/login/layout.tsx](src/app/login/layout.tsx) - `/login`
- [src/app/share/layout.tsx](src/app/share/layout.tsx) - `/share`
- [src/app/sync/layout.tsx](src/app/sync/layout.tsx) - `/sync`
- [src/app/auth/receive/layout.tsx](src/app/auth/receive/layout.tsx) - `/auth/receive` (noindex)

### 4. Configuration

[next.config.js](next.config.js) enforces:

```javascript
{
  trailingSlash: false,  // Prevents /page vs /page/ duplicates
  async redirects() {
    // Can add www to non-www redirects here
  }
}
```

## Implementation Details

### Why Layout Files?

Since all pages use `'use client'`, we can't export metadata directly from page.tsx files. Instead, we create layout.tsx files for each route that:
1. Export the metadata (server component)
2. Pass through children unchanged

### Canonical URL Structure

All canonical URLs are relative to `metadataBase`:
- Home: `https://yourdomain.com/`
- Login: `https://yourdomain.com/login`
- Share: `https://yourdomain.com/share`
- Sync: `https://yourdomain.com/sync`
- Auth: `https://yourdomain.com/auth/receive` (not indexed)

### Special Cases

**Auth/Receive Page**: Set to `noindex` since it's a utility page for receiving credentials from the extension:

```typescript
robots: {
  index: false,
  follow: false,
}
```

**Dynamic Content**: The main page (`/`) loads content via URL parameters and hash fragments, but the canonical always points to `/` - Google will consolidate all parameter variations to the main page.

## Deployment

### Vercel

Set the environment variable in Vercel dashboard:
1. Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_SITE_URL` = `https://speedrdr.com`
3. Redeploy

### Other Platforms

Set `NEXT_PUBLIC_SITE_URL` in your platform's environment configuration before building.

## Verification

After deployment, verify canonical tags are present:

```bash
curl -I https://speedrdr.com
# Check response headers

curl https://speedrdr.com | grep canonical
# Should show: <link rel="canonical" href="https://speedrdr.com/"/>
```

Or use Google Search Console:
1. Wait for Google to recrawl (can take days/weeks)
2. Check "Page indexing" report
3. "Duplicate page without canonical tag" should decrease

## Best Practices

1. **Always set NEXT_PUBLIC_SITE_URL** - Don't rely on the fallback value
2. **Use HTTPS** - Never set it to an http:// URL in production
3. **No trailing slash** - Keep URLs consistent: `https://domain.com` not `https://domain.com/`
4. **Protocol and subdomain consistency** - Decide on www vs non-www and stick to it
5. **Monitor Google Search Console** - Watch for new duplicate issues

## References

- [Google: Duplicate page without canonical tag](https://support.google.com/webmasters/answer/7440203#duplicate_page_without_canonical_tag)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Next.js metadataBase](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase)
