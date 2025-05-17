"use client"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Package2, Users, Settings, LogIn } from "lucide-react"

export default function Home() {
  const { isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()

  const handleNavigation = (path: string) => {
    if (isAuthenticated) {
      router.push(path)
    } else {
      // Si no está autenticado, redirigir a login con la ruta de destino
      router.push(`/login?redirectTo=${encodeURIComponent(path)}`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Hoteles de la Costa</h1>
          <p className="mt-2 text-gray-600">Sistema de Gestión</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>Selecciona una opción para continuar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full flex justify-start items-center" onClick={() => handleNavigation("/stock")}>
              <Package2 className="mr-2 h-5 w-5" />
              Gestión de Stock
            </Button>

            <Button className="w-full flex justify-start items-center" onClick={() => handleNavigation("/empleados")}>
              <Users className="mr-2 h-5 w-5" />
              Gestión de Empleados
            </Button>

            {isAdmin && (
              <Button
                className="w-full flex justify-start items-center"
                variant="outline"
                onClick={() => handleNavigation("/admin")}
              >
                <Settings className="mr-2 h-5 w-5" />
                Administración
              </Button>
            )}
          </CardContent>
          <CardFooter>
            {!isAuthenticated ? (
              <Button className="w-full" variant="outline" onClick={() => router.push("/login")}>
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Button>
            ) : (
              <p className="text-sm text-gray-500 text-center w-full">Ya has iniciado sesión</p>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
