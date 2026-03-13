/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevents TypeScript & ESLint errors from failing the Vercel build
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
