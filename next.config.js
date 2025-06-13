/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@radix-ui", "class-variance-authority", "clsx", "tailwind-merge", "lucide-react"],
}

module.exports = nextConfig
