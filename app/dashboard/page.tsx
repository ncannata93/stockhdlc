"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import ProtectedRoute from "@/components/protected-route"

export default function DashboardPage() {
  const { session, signOut } = useAuth()

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Panel de Control</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bienvenido, {session?.username}</CardTitle>
            <CardDescription>
              {session?.isAdmin ? "Tienes permisos de administrador" : "Tienes permisos de usuario"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Selecciona un módulo para comenzar:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 hover:bg-slate-50 cursor-pointer">
                <h3 className="font-medium">Módulo de Stock</h3>
                <p className="text-sm text-slate-500">Gestión de inventario</p>
              </Card>
              <Card className="p-4 hover:bg-slate-50 cursor-pointer">
                <h3 className="font-medium">Módulo de Empleados</h3>
                <p className="text-sm text-slate-500">Gestión de personal</p>
              </Card>
              <Card className="p-4 hover:bg-slate-50 cursor-pointer">
                <h3 className="font-medium">Módulo de Servicios</h3>
                <p className="text-sm text-slate-500">Gestión de servicios</p>
              </Card>
            </div>
            <div className="mt-6">
              <Button onClick={() => signOut()} variant="outline">
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
