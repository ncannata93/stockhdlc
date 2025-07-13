"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, Package, CreditCard, Clock } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const modules = [
    {
      title: "Empleados",
      description: "Gestión de personal y nóminas",
      icon: Users,
      href: "/empleados",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Servicios",
      description: "Reservaciones y servicios hoteleros",
      icon: Building2,
      href: "/servicios",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Stock",
      description: "Control de inventario y suministros",
      icon: Package,
      href: "/stock",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      title: "Préstamos",
      description: "Sistema de préstamos entre hoteles",
      icon: CreditCard,
      href: "/prestamos",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Hoteles de la Costa</h1>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Header con título y fecha */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Sistema de Gestión Hotelera</h1>

          <div className="flex items-center justify-center gap-2 text-lg text-gray-600 bg-white rounded-lg px-6 py-3 shadow-sm inline-flex">
            <Clock className="h-5 w-5" />
            <span className="font-medium capitalize">{formatDateTime(currentTime)}</span>
          </div>
        </div>

        {/* Módulos Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {modules.map((module) => {
            const IconComponent = module.icon
            return (
              <Link key={module.title} href={module.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardHeader className="text-center pb-4">
                    <div
                      className={`w-16 h-16 rounded-full ${module.color} flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110`}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <CardDescription className="text-gray-600">{module.description}</CardDescription>
                    <Button variant="outline" className="mt-4 w-full group-hover:bg-gray-50 bg-transparent">
                      Acceder
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
