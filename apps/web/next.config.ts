import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@orbit/design-system'],
  allowedDevOrigins: ['127.0.0.1'],
  agentRules: false,
  devIndicators: { position: 'top-left' },
};

export default nextConfig;
