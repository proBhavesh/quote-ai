import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yfwxnmihrhytxdmphjds.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Define which environment variables should be available on the server only
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  // Ensure Prisma-related environment variables are only available server-side
  env: {
    // Only explicitly expose public environment variables here
    // DATABASE_URL and other sensitive variables will only be available server-side
  },
};

export default nextConfig;
