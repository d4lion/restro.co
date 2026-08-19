import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests in development mode (e.g., when accessing via Ngrok)
  async headers() {
    return [
      {
        source: "/_next/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS,HEAD" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS,HEAD" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },

  // Allow images from local filesystem and Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Experimental features & Server Actions origin configuration for Ngrok / external hosts
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
      allowedOrigins: [
        "b1c7-190-158-28-68.ngrok-free.app",
        "*.ngrok-free.app",
        "*.ngrok.io",
        "*.ngrok-free.dev",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
    },
  },

  // Allow HMR and static chunks for Ngrok dev tunnel
  allowedDevOrigins: [
    "b1c7-190-158-28-68.ngrok-free.app",
    "localhost:3000"
  ],
};

export default nextConfig;
