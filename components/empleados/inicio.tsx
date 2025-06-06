"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEmployeeDB } from "@/lib/employee-db"
import { BarChart, Calendar, Users, Clock, Hotel, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DebugPanel } from "@/components/debug-panel"

export default function EmpleadosInicio() {
  const { getEmployees, getAssignments } = useEmployeeDB()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalAssignments: 0,
    uniqueHotels: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Cargar empleados
        const employees = await getEmployees()

        // Cargar asignaciones del último mes
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const assignments = await getAssignments({
          start_date: thirtyDaysAgo.toISOString().split("T")[0],
          end_date: new Date().toISOString().split("T")[0],
        })

        // Calcular estadísticas
        const uniqueEmployeesWithAssignments = new Set(assignments.map((a) => a.employee_id))
        const uniqueHotels = new Set(assignments.map((a) => a.hotel_name))

        setStats({
          totalEmployees: employees.length,
          activeEmployees: uniqueEmployeesWithAssignments.size,
          totalAssignments: assignments.length,
          uniqueHotels: uniqueHotels.size,
        })
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError(`Error al cargar datos: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Panel de depuración */}
      <DebugPanel />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <div className="mb-2">{error}</div>
            <Button asChild size="sm" variant="outline">
              <Link href="/empleados/diagnostico">Ir a Diagnóstico</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Empleados registrados en el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Con asignaciones en los últimos 30 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaciones</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">En los últimos 30 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoteles</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.uniqueHotels}</div>
            <p className="text-xs text-muted-foreground">Con asignaciones recientes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenido al Sistema de Gestión de Empleados</CardTitle>
              <CardDescription>Administre empleados, asignaciones y pagos de manera eficiente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
                        <Link href="/empleados/agregar" className="text-blue-500 hover:underline">
                          Agregar nueva asignación
                        </Link>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                        <Link href="/empleados/resumen" className="text-green-500 hover:underline">
                          Ver resumen de pagos
                        </Link>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-purple-500" />
                        <Link href="/empleados/calendario" className="text-purple-500 hover:underline">
                          Consultar calendario
                        </Link>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-orange-500" />
                        <Link href="/empleados/historial" className="text-orange-500 hover:underline">
                          Ver historial de asignaciones
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Consejos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-gray-500" />
                        Puede seleccionar múltiples hoteles al crear asignaciones
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-gray-500" />
                        Las tarifas históricas se mantienen aunque actualice la tarifa del empleado
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-gray-500" />
                        Use el resumen para ver pagos pendientes y registrar nuevos pagos
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-gray-500" />
                        Si encuentra problemas, use la herramienta de diagnóstico
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Actividad</CardTitle>
              <CardDescription>Visualización de la actividad reciente en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] flex items-center justify-center">
                {loading ? (
                  <p>Cargando datos...</p>
                ) : (
                  <div className="w-full">
                    <BarChart className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                    <p className="text-center text-muted-foreground">
                      {stats.totalAssignments > 0
                        ? `${stats.totalAssignments} asignaciones en los últimos 30 días`
                        : "No hay datos suficientes para mostrar análisis"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
