"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Package, UserPlus, Loader2, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function AdminPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  // Asegurarse de que estamos en el cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Solo ejecutar la lógica de redirección cuando estamos en el cliente y isLoading es false
    if (isClient && !isLoading) {
      console.log("Estado de autenticación:", { isAuthenticated, isAdmin, isLoading })

      if (!isAuthenticated) {
        console.log("Redirigiendo a /login porque no está autenticado")
        router.push("/login")
      } else if (!isAdmin) {
        console.log("Redirigiendo a /stock porque no es administrador")
        router.push("/stock")
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router, isClient])

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isLoading || !isClient || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">
            {isLoading ? "Verificando autenticación..." : "Redirigiendo..."}
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => router.push("/admin/create-user")}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold">Crear Usuario</h2>
                <p className="text-gray-600">Crear nuevos usuarios del sistema</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push("/admin/users")}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold">Gestión de Usuarios</h2>
                <p className="text-gray-600">Administrar usuarios existentes</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push("/stock")}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold">Gestión de Stock</h2>
                <p className="text-gray-600">Administrar inventario y productos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
