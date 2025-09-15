/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint i TypeScript - dla developmentu
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Konfiguracja obrazów
  images: {
    unoptimized: true,
    // Dodaj obsługę różnych formatów obrazów
    formats: ['image/webp', 'image/avif'],
    // Maksymalne rozmiary dla optymalizacji
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Konfiguracja dla AI SDK i PDF
  experimental: {
    // Włącz server actions
    serverActions: true,
    // Włącz streaming
    serverComponentsExternalPackages: ['@ai-sdk/google', '@ai-sdk/openai', 'ai'],
  },
  
  // Headers dla bezpieczeństwa i CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://yourdomain.com' 
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Konfiguracja dla dużych plików PDF
  async rewrites() {
    return [
      {
        source: '/api/analyze-pdf',
        destination: '/api/analyze-pdf',
      },
    ];
  },
  
  // Optymalizacja dla produkcji
  compress: true,
  poweredByHeader: false,
  
  // Konfiguracja webpack dla lepszej obsługi plików
  webpack: (config, { isServer }) => {
    // Optymalizacja dla AI SDK
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
    }
    
    // Obsługa AI SDK w Node.js runtime
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Optymalizacja dla dużych plików
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          ai: {
            test: /[\\/]node_modules[\\/](@ai-sdk|ai)[\\/]/,
            name: 'ai',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };
    
    return config;
  },
  
  // Konfiguracja dla środowiska
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Konfiguracja dla różnych środowisk
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    trailingSlash: false,
  }),
}

export default nextConfig
