"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEmployeeDB } from "@/lib/employee-db"
import { BarChart, Calendar, Users, Clock, Hotel, AlertTriangle, Plus, FileText, TrendingUp } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EmpleadosInicio() {
  const { getEmployees, getAssignments } = useEmployeeDB()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalAssignments: 0,
    uniqueHotels: 0,
    thisWeekAssignments: 0,
    thisMonthAssignments: 0,
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

        // Cargar asignaciones de esta semana
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

        // Cargar asignaciones de este mes
        const startOfMonth = new Date()
        startOfMonth.setDate(1)

        const [monthlyAssignments, weeklyAssignments, currentMonthAssignments] = await Promise.all([
          getAssignments({
            start_date: thirtyDaysAgo.toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
          }),
          getAssignments({
            start_date: startOfWeek.toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
          }),
          getAssignments({
            start_date: startOfMonth.toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
          }),
        ])

        // Calcular estadísticas
        const uniqueEmployeesWithAssignments = new Set(monthlyAssignments.map((a) => a.employee_id))
        const uniqueHotels = new Set(monthlyAssignments.map((a) => a.hotel_name))

        setStats({
          totalEmployees: employees.length,
          activeEmployees: uniqueEmployeesWithAssignments.size,
          totalAssignments: monthlyAssignments.length,
          uniqueHotels: uniqueHotels.size,
          thisWeekAssignments: weeklyAssignments.length,
          thisMonthAssignments: currentMonthAssignments.length,
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
      {/* Header con saludo */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Gestión de Empleados</h1>
        <p className="text-lg text-gray-600">Bienvenido al panel de control</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error de Conexión</AlertTitle>
          <AlertDescription>
            <div className="mb-2">{error}</div>
            <Button asChild size="sm" variant="outline">
              <Link href="/empleados/diagnostico">Ir a Diagnóstico</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{loading ? "..." : stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Empleados registrados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? "..." : stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{loading ? "..." : stats.thisWeekAssignments}</div>
            <p className="text-xs text-muted-foreground">Asignaciones activas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoteles Activos</CardTitle>
            <Hotel className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{loading ? "..." : stats.uniqueHotels}</div>
            <p className="text-xs text-muted-foreground">Con asignaciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-20 flex-col gap-2" variant="outline">
              <Link href="/empleados/agregar">
                <Plus className="h-6 w-6" />
                <span>Nueva Asignación</span>
              </Link>
            </Button>
            <Button asChild className="h-20 flex-col gap-2" variant="outline">
              <Link href="/empleados/resumen">
                <TrendingUp className="h-6 w-6" />
                <span>Resumen de Pagos</span>
              </Link>
            </Button>
            <Button asChild className="h-20 flex-col gap-2" variant="outline">
              <Link href="/empleados/calendario">
                <Calendar className="h-6 w-6" />
                <span>Ver Calendario</span>
              </Link>
            </Button>
            <Button asChild className="h-20 flex-col gap-2" variant="outline">
              <Link href="/empleados/historial">
                <FileText className="h-6 w-6" />
                <span>Ver Historial</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Asignaciones este mes</span>
                    <span className="font-medium">{loading ? "..." : stats.thisMonthAssignments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Asignaciones esta semana</span>
                    <span className="font-medium">{loading ? "..." : stats.thisWeekAssignments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Empleados activos</span>
                    <span className="font-medium">{loading ? "..." : stats.activeEmployees}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consejos y Ayuda</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <span>Puede seleccionar múltiples hoteles al crear asignaciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <span>Las tarifas históricas se mantienen automáticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <span>Use el resumen para gestionar pagos pendientes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <span>El calendario muestra todas las asignaciones por color</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
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
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                ) : (
                  <div className="w-full text-center">
                    <BarChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    {stats.totalAssignments > 0 ? (
                      <div className="space-y-2">
                        <p className="text-lg font-medium">
                          {stats.totalAssignments} asignaciones en los últimos 30 días
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.thisMonthAssignments}</div>
                            <div className="text-xs text-muted-foreground">Este mes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.thisWeekAssignments}</div>
                            <div className="text-xs text-muted-foreground">Esta semana</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{stats.uniqueHotels}</div>
                            <div className="text-xs text-muted-foreground">Hoteles</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No hay datos suficientes para mostrar análisis</p>
                    )}
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
