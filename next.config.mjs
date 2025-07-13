/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Remove deprecated options for Next.js 15
  },
  serverExternalPackages: ['@firebase/util'],
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
