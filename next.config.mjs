/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para asegurar que las rutas relativas funcionen correctamente
  // cuando se despliega en una subruta
  basePath: process.env.NODE_ENV === 'production' ? '/stock' : '',
  
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
