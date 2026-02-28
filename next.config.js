/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
    experimental: {
        staleTimes: {
            dynamic: 30, // cache dynamic routes for 30 seconds on client
            static: 180, // cache static routes for 3 minutes
        },
    },

    // Allow external images (Google profile pics, avatar placeholder, etc.)
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'ui-avatars.com',
                pathname: '/api/**',
            },
        ],
    },

    // Security headers (applied to all routes)
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(self)',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
