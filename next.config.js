/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removing the static export configuration to enable server-side rendering
  // output: 'export',
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;