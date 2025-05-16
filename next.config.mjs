/** @type {import('next').NextConfig} */
const nextConfig = {
  // Eliminar la configuración de basePath para que la raíz sea accesible
  // basePath: process.env.NODE_ENV === 'production' ? '/stock' : '',
  
  // Otras configuraciones que puedas necesitar
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
