/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for REZILIENT.js
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['rezilient.js'],
  },
  
  // Performance optimizations
  swcMinify: true,
  compress: true,
  
  // PWA and offline-first configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Powered-By',
            value: 'REZILIENT.js',
          },
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
  
  // Environment variables
  env: {
    REZILIENT_VERSION: '1.0.0',
    CARBON_AWARE_ENABLED: 'true',
    OFFLINE_FIRST_ENABLED: 'true',
  },
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Webpack configuration for REZILIENT.js
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add support for REZILIENT.js modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'rezilient.js': require.resolve('rezilient.js'),
    };
    
    // Optimize bundle for carbon efficiency
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          rezilient: {
            name: 'rezilient',
            test: /[\\/]node_modules[\\/]rezilient\.js[\\/]/,
            chunks: 'all',
            priority: 30,
          },
        },
      };
    }
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Redirects for SEO and UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API routing
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },
};

module.exports = nextConfig;
