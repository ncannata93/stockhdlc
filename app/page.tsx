"use client"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package2,
  Users,
  Settings,
  LogIn,
  Wrench,
  ArrowRight,
  BarChart3,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  User,
  LogOut,
  UserPlus,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import { MainNavigation } from "@/components/main-navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { canAccessServices, isUserAdmin, initPermissionsMode } from "@/lib/user-permissions"

export default function Home() {
  const { isAuthenticated, session, signOut } = useAuth()
  const [canAccessServicesModule, setCanAccessServicesModule] = useState<boolean | null>(null)
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(true)
  const router = useRouter()

  // Verificar permisos del usuario actual
  useEffect(() => {
    async function checkPermissions() {
      if (session?.username) {
        setPermissionsLoading(true)
        try {
          // Inicializar sistema de permisos primero
          await initPermissionsMode()

          // Luego verificar permisos específicos
          const [servicesAccess, adminAccess] = await Promise.all([
            canAccessServices(session.username),
            isUserAdmin(session.username),
          ])

          console.log(`Permisos para ${session.username}:`, {
            servicios: servicesAccess,
            admin: adminAccess,
          })

          setCanAccessServicesModule(servicesAccess)
          setIsAdminUser(adminAccess)
        } catch (error) {
          console.error("Error al verificar permisos:", error)
          // Fallback basado en usuarios conocidos
          const username = session.username.toLowerCase()
          const isKnownAdmin = username === "admin" || username === "ncannata"
          const isKnownManager = username === "dpili" || isKnownAdmin

          setCanAccessServicesModule(isKnownManager)
          setIsAdminUser(isKnownAdmin)
        } finally {
          setPermissionsLoading(false)
        }
      } else {
        // Si no hay sesión, resetear estados
        setCanAccessServicesModule(null)
        setIsAdminUser(null)
        setPermissionsLoading(false)
      }
    }

    if (isAuthenticated) {
      checkPermissions()
    } else {
      setPermissionsLoading(false)
    }
  }, [session?.username, isAuthenticated])

  const handleNavigation = (path: string) => {
    if (isAuthenticated) {
      router.push(path)
    } else {
      router.push(`/login?redirectTo=${encodeURIComponent(path)}`)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MainNavigation />

      {/* Header con logout para usuarios autenticados */}
      {isAuthenticated && (
        <div className="absolute top-4 right-4 z-50">
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-gray-200">
              <User className="h-4 w-4 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">{session?.username || "Usuario"}</span>
              {permissionsLoading && <Loader2 className="h-3 w-3 ml-2 animate-spin text-blue-500" />}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-white/80 backdrop-blur-sm border-red-200 text-red-600 hover:bg-red-50 shadow-lg"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-12 sm:pb-24">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl blur-lg opacity-20" />
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-gray-200">
                  <Image
                    src="/logo-hoteles-costa.svg"
                    alt="Hoteles de la Costa"
                    width={160}
                    height={57}
                    className="h-10 sm:h-16 w-auto"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4 sm:mb-6 px-4">
              Sistema Integral de Gestión
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-3 sm:mb-4 max-w-3xl mx-auto leading-relaxed px-4">
              Plataforma Profesional para Administración Hotelera
            </p>
            <p className="text-base sm:text-lg text-gray-500 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Control completo de stock, servicios y recursos humanos
            </p>

            {/* Botón de Asignación Rápida - Fijo en el hero */}
            <div className="mb-6 sm:mb-8">
              <Link href="/asignar">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-8 py-3"
                  title="Asignación Rápida"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  <span className="font-medium">Asignación Rápida</span>
                </Button>
              </Link>
            </div>

            {/* Version Info - Responsive */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-full px-4 sm:px-6 py-3 shadow-lg border border-gray-200 mb-8 sm:mb-12 mx-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span className="font-medium">Versión 1.3.1 - Permisos Mejorados</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                <span>Actualizado: 11/06/2025</span>
              </div>
            </div>

            {/* Stats - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-12 sm:mb-16 px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">3</div>
                <div className="text-xs sm:text-sm text-gray-600">Módulos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">24/7</div>
                <div className="text-xs sm:text-sm text-gray-600">Disponible</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">100%</div>
                <div className="text-xs sm:text-sm text-gray-600">Seguro</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">☁️</div>
                <div className="text-xs sm:text-sm text-gray-600">En la Nube</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-24">
        {/* Loading state para permisos */}
        {isAuthenticated && permissionsLoading && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
              <span className="text-blue-700 text-sm">Verificando permisos...</span>
            </div>
          </div>
        )}

        {/* Module Cards - Mobile Optimized */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16">
          {/* Stock Module */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-shadow">
                  <Package2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Stock</CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base">
                Control completo del inventario y productos para todos los hoteles
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-blue-500" />
                  Reportes en tiempo real
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-blue-500" />
                  Control de stock mínimo
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                onClick={() => handleNavigation("/stock")}
              >
                Acceder al Módulo
              </Button>
            </CardContent>
          </Card>

          {/* Employees Module */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30 hover:scale-[1.02] cursor-pointer">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-green-500/25 transition-shadow">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Empleados</CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base">
                Administración integral del personal y control de asignaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-500" />
                  Asignaciones diarias
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-500" />
                  Reportes de productividad
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                onClick={() => handleNavigation("/empleados")}
              >
                Acceder al Módulo
              </Button>
            </CardContent>
          </Card>

          {/* Services Module - Mostrar siempre si está autenticado, con estado de carga */}
          {isAuthenticated && (
            <Card
              className={`group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 hover:scale-[1.02] cursor-pointer md:col-span-2 lg:col-span-1 ${
                permissionsLoading ? "opacity-50" : canAccessServicesModule === false ? "opacity-30" : ""
              }`}
            >
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-purple-500/25 transition-shadow">
                    <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  {permissionsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  ) : (
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                  Gestión de Servicios
                  {canAccessServicesModule === false && !permissionsLoading && (
                    <span className="text-sm text-red-500 ml-2">(Sin acceso)</span>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  Control de servicios, reservaciones y administración de pagos
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-purple-500" />
                    Reservaciones online
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-purple-500" />
                    Pagos seguros
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                  onClick={() => handleNavigation("/servicios")}
                  disabled={permissionsLoading || canAccessServicesModule === false}
                >
                  {permissionsLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : canAccessServicesModule === false ? (
                    "Sin Permisos"
                  ) : (
                    "Acceder al Módulo"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Admin Section - Solo si es admin */}
        {isAuthenticated && isAdminUser && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:scale-[1.02] transition-all duration-300 cursor-pointer">
              <CardHeader className="text-center pb-3 sm:pb-4">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-white/10 rounded-lg sm:rounded-xl backdrop-blur-sm">
                    <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">Panel de Administración</CardTitle>
                <CardDescription className="text-gray-300 text-sm sm:text-base">
                  Acceso completo a configuraciones avanzadas del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all font-semibold text-sm sm:text-base"
                  onClick={() => handleNavigation("/admin")}
                >
                  Acceder a Administración
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Login Section */}
        {!isAuthenticated && (
          <div className="max-w-md mx-auto mt-8 sm:mt-12">
            <Card className="border-0 shadow-xl bg-white hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Acceso al Sistema</CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  Inicia sesión para acceder a todos los módulos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                  onClick={() => router.push("/login")}
                >
                  <LogIn className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Iniciar Sesión
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Debug info para desarrollo */}
        {isAuthenticated && session?.username === "admin" && (
          <div className="mt-8 max-w-md mx-auto">
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-sm">Debug - Permisos</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div>Usuario: {session.username}</div>
                <div>
                  Servicios:{" "}
                  {canAccessServicesModule === null ? "Cargando..." : canAccessServicesModule ? "✅ Sí" : "❌ No"}
                </div>
                <div>Admin: {isAdminUser === null ? "Cargando..." : isAdminUser ? "✅ Sí" : "❌ No"}</div>
                <div>Cargando: {permissionsLoading ? "Sí" : "No"}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center text-gray-600">
            <p className="text-xs sm:text-sm">© 2025 Hoteles de la Costa. Sistema de Gestión Integral.</p>
            <p className="text-xs text-gray-500 mt-1">
              Desarrollado con tecnología de vanguardia para la excelencia hotelera
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
