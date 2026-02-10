/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
  },
  // Redirect trailing slashes to prevent duplicate content
  trailingSlash: false,
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  // Redirect common duplicate URL patterns
  async redirects() {
    return [
      // Redirect www to non-www (if applicable - adjust based on your domain preference)
      // Uncomment if you want to enforce www or non-www
      // {
      //   source: '/:path*',
      //   has: [
      //     {
      //       type: 'host',
      //       value: 'www.yourdomain.com',
      //     },
      //   ],
      //   destination: 'https://yourdomain.com/:path*',
      //   permanent: true,
      // },
    ];
  },
};

module.exports = nextConfig;
