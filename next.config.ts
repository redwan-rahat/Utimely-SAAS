import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: process.cwd(),
  reactCompiler: true,
};

export default nextConfig;
