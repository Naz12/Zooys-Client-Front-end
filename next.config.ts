import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    PORT: '3000',
  },
  
  // CORS configuration for API routes
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
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
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_FORCE_HTTPS === 'true') {
      return [
        {
          source: '/(.*)',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://yourdomain.com/:path*',
          permanent: true,
        },
      ];
    }
    return [];
  },


  // Image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Handle Node.js modules for client-side builds
    if (!isServer) {
      // Ignore Node.js built-in modules in client-side bundle
      // This prevents errors when libraries try to use Node.js modules in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        // Don't set canvas: false here - we want to resolve it to our stub
        'node:fs': false,
        'node:path': false,
        'node:crypto': false,
        'node:stream': false,
        'node:util': false,
        'node:os': false,
        'node:net': false,
        'node:tls': false,
        'node:child_process': false,
      };
      
      // Use webpack's IgnorePlugin to ignore node:fs and related imports
      const webpack = require('webpack');
      const path = require('path');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^node:/,
        })
      );
      
      // Fix for react-pdf: Replace canvas module with stub
      // Note: The postinstall script (scripts/patch-pdfjs.js) patches pdfjs-dist directly
      // We just need to ensure canvas resolves to our stub as a fallback
      const canvasStubPath = path.resolve(process.cwd(), 'lib', 'webpack', 'canvas-stub.js');
      
      // Set alias - this ensures any remaining canvas requires resolve to our stub
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': canvasStubPath,
      };
      
      // Use NormalModuleReplacementPlugin as backup
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^canvas$/,
          canvasStubPath
        )
      );
      
    }
    
    return config;
  },

  // Server external packages
  serverExternalPackages: ['axios', 'pptxgenjs'],

  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react'],
    // Handle ESM packages like react-pdf
    esmExternals: 'loose',
  },

  // Output configuration (only for production builds)
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
  }),
  
  // Explicitly set the project root to prevent workspace conflicts
  outputFileTracingRoot: process.cwd(),

  // Compression
  compress: true,

  // PoweredByHeader
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;