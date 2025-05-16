"use client"

import { useRouter } from "next/navigation"
import { Package, ArrowRight } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-center max-w-3xl mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="bg-blue-100 p-4 rounded-full">
            <Package className="h-16 w-16 text-blue-600" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">HOTELES DE LA COSTA</h1>
        <h2 className="text-xl md:text-2xl text-gray-600 mb-8">Sistema de Gestión</h2>

        <p className="text-gray-600 mb-8 text-lg">
          Bienvenido al sistema de gestión para Hoteles de la Costa. Acceda al módulo de stock para administrar su
          inventario.
        </p>

        <button
          onClick={() => router.push("/stock")}
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-md shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Gestión de Stock
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>

      <footer className="mt-16 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Hoteles de la Costa. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
