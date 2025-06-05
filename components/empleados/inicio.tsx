"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users, MapPin, TrendingUp, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { getSupabaseClient } from "@/lib/supabase"
import { HOTELS } from "@/lib/employee-types"

interface DashboardStats {
  totalEmployees: number
  totalAssignments: number
  weeklyAssignments: number
  hotelDistribution: { hotel: string; count: number }[]
  recentAssignments: {
    id: number
    employee_name: string
    hotel_name: string
    assignment_date: string
  }[]
}

// Colores consistentes para TODOS los hoteles
const hotelColors: Record<string, string> = {
  Jaguel: "bg-red-100 text-red-800",
  Monaco: "bg-blue-100 text-blue-800",
  Mallak: "bg-green-100 text-green-800",
  Argentina: "bg-purple-100 text-purple-800",
  Falkner: "bg-yellow-100 text-yellow-800",
  Stromboli: "bg-pink-100 text-pink-800",
  "San Miguel": "bg-indigo-100 text-indigo-800",
  Colores: "bg-orange-100 text-orange-800",
  Puntarenas: "bg-teal-100 text-teal-800",
  Tupe: "bg-cyan-100 text-cyan-800",
  Munich: "bg-amber-100 text-amber-800",
  Tiburones: "bg-slate-100 text-slate-800",
  Barlovento: "bg-emerald-100 text-emerald-800",
  Carama: "bg-violet-100 text-violet-800",
  default: "bg-gray-100 text-gray-800",
}

const getHotelColor = (hotelName: string) => {
  return hotelColors[hotelName] || hotelColors.default
}

export default function EmpleadosInicio() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalAssignments: 0,
    weeklyAssignments: 0,
    hotelDistribution: [],
    recentAssignments: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError("No se pudo conectar a la base de datos")
        return
      }

      // Obtener empleados
      const { data: employees, error: employeesError } = await supabase.from("employees").select("id, name")

      if (employeesError) {
        console.error("Error al cargar empleados:", employeesError)
        throw new Error("Error al cargar empleados")
      }

      // Obtener todas las asignaciones
      const { data: assignments, error: assignmentsError } = await supabase
        .from("employee_assignments")
        .select(`
          id,
          employee_id,
          hotel_name,
          assignment_date,
          employees!inner(name)
        `)
        .order("assignment_date", { ascending: false })

      if (assignmentsError) {
        console.error("Error al cargar asignaciones:", assignmentsError)
        throw new Error("Error al cargar asignaciones")
      }

      // Calcular estadísticas
      const totalEmployees = employees?.length || 0
      const totalAssignments = assignments?.length || 0

      // Asignaciones de esta semana
      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

      const weeklyAssignments =
        assignments?.filter((assignment) => {
          const assignmentDate = new Date(assignment.assignment_date)
          return isWithinInterval(assignmentDate, { start: weekStart, end: weekEnd })
        }).length || 0

      // Distribución por hoteles
      const hotelCounts: Record<string, number> = {}
      assignments?.forEach((assignment) => {
        const hotel = assignment.hotel_name
        hotelCounts[hotel] = (hotelCounts[hotel] || 0) + 1
      })

      const hotelDistribution = Object.entries(hotelCounts)
        .map(([hotel, count]) => ({ hotel, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10 hoteles

      // Asignaciones recientes (últimas 10)
      const recentAssignments = (assignments || []).slice(0, 10).map((assignment: any) => ({
        id: assignment.id,
        employee_name: assignment.employees?.name || "Sin nombre",
        hotel_name: assignment.hotel_name,
        assignment_date: assignment.assignment_date,
      }))

      setStats({
        totalEmployees,
        totalAssignments,
        weeklyAssignments,
        hotelDistribution,
        recentAssignments,
      })
    } catch (err: any) {
      console.error("Error al cargar datos del dashboard:", err)
      setError(err.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" onClick={loadDashboardData} className="ml-2">
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Empleados registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asignaciones</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Asignaciones totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyAssignments}</div>
            <p className="text-xs text-muted-foreground">Asignaciones semanales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoteles Activos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hotelDistribution.length}</div>
            <p className="text-xs text-muted-foreground">Con asignaciones</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por hoteles */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Hoteles</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.hotelDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.hotelDistribution.map((item) => (
                  <div key={item.hotel} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getHotelColor(item.hotel)}>{item.hotel}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium">{item.count}</div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max(10, (item.count / Math.max(...stats.hotelDistribution.map((h) => h.count))) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay asignaciones registradas</p>
                <p className="text-sm">Agrega asignaciones para ver la distribución</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asignaciones recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Asignaciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentAssignments.length > 0 ? (
              <div className="space-y-3">
                {stats.recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{assignment.employee_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(assignment.assignment_date), "dd/MM/yyyy", { locale: es })}
                      </div>
                    </div>
                    <Badge className={getHotelColor(assignment.hotel_name)}>{assignment.hotel_name}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay asignaciones recientes</p>
                <p className="text-sm">Las asignaciones aparecerán aquí</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista completa de hoteles disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Todos los Hoteles Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {HOTELS.map((hotel) => (
              <Badge key={hotel} variant="outline" className={`${getHotelColor(hotel)} justify-center`}>
                {hotel}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
