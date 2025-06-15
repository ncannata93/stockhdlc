"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Calendar, BarChart3, Upload, TrendingUp, Clock, DollarSign, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"

interface EmpleadosInicioProps {
  onTabChange?: (tab: string) => void
}

export default function EmpleadosInicio({ onTabChange }: EmpleadosInicioProps) {
  const { toast } = useToast()
  const { getEmployees, getAssignments, getPaidWeeks } = useEmployeeDB()
  const [stats, setStats] = useState({
    totalEmpleados: 0,
    empleadosActivos: 0,
    asignacionesHoy: 0,
    pagosPendientes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRealStats = async () => {
      setLoading(true)
      try {
        // Obtener todos los empleados
        const employees = await getEmployees()

        // Obtener fecha de hoy
        const today = new Date()
        const todayStr = today.toISOString().split("T")[0]

        // Obtener asignaciones de hoy
        const todayAssignments = await getAssignments({
          start_date: todayStr,
          end_date: todayStr,
        })

        // Obtener empleados únicos que trabajan hoy
        const uniqueEmployeesToday = new Set(todayAssignments.map((a) => a.employee_id))

        // Obtener asignaciones de la semana actual para calcular pagos pendientes
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        const weekAssignments = await getAssignments({
          start_date: startOfWeek.toISOString().split("T")[0],
          end_date: endOfWeek.toISOString().split("T")[0],
        })

        // Obtener semanas pagadas para calcular pendientes
        const paidWeeks = await getPaidWeeks({
          start_date: startOfWeek.toISOString().split("T")[0],
          end_date: endOfWeek.toISOString().split("T")[0],
        })

        // Calcular empleados con asignaciones pero sin pagos
        const employeesWithAssignments = new Set(weekAssignments.map((a) => a.employee_id))
        const employeesWithPayments = new Set(paidWeeks.map((p) => p.employee_id))
        const pendingPayments = employeesWithAssignments.size - employeesWithPayments.size

        // Calcular empleados activos (con asignaciones en los últimos 30 días)
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)

        const recentAssignments = await getAssignments({
          start_date: thirtyDaysAgo.toISOString().split("T")[0],
          end_date: todayStr,
        })

        const activeEmployees = new Set(recentAssignments.map((a) => a.employee_id))

        setStats({
          totalEmpleados: employees.length,
          empleadosActivos: activeEmployees.size,
          asignacionesHoy: uniqueEmployeesToday.size,
          pagosPendientes: Math.max(0, pendingPayments),
        })
      } catch (error) {
        console.error("Error loading stats:", error)
        // En caso de error, mostrar valores por defecto
        setStats({
          totalEmpleados: 0,
          empleadosActivos: 0,
          asignacionesHoy: 0,
          pagosPendientes: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    loadRealStats()
  }, [getEmployees, getAssignments, getPaidWeeks])

  const handleQuickAction = (action: string, tab: string) => {
    toast({
      title: "Navegando...",
      description: `Abriendo ${action}`,
    })
    onTabChange?.(tab)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-lg sm:text-2xl font-bold">{loading ? "..." : stats.totalEmpleados}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Activos</p>
              <p className="text-lg sm:text-2xl font-bold">{loading ? "..." : stats.empleadosActivos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Hoy</p>
              <p className="text-lg sm:text-2xl font-bold">{loading ? "..." : stats.asignacionesHoy}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pendientes</p>
              <p className="text-lg sm:text-2xl font-bold">{loading ? "..." : stats.pagosPendientes}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Acciones Rápidas</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Gestiona empleados y asignaciones</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Button
              variant="outline"
              className="h-16 sm:h-20 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm"
              onClick={() => handleQuickAction("Gestionar Empleados", "empleados")}
            >
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-center leading-tight">
                Gestionar
                <br />
                Empleados
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-16 sm:h-20 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm"
              onClick={() => handleQuickAction("Nueva Asignación", "agregar")}
            >
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-center leading-tight">
                Nueva
                <br />
                Asignación
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-16 sm:h-20 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm"
              onClick={() => handleQuickAction("Resumen de Pagos", "resumen")}
            >
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-center leading-tight">
                Resumen de
                <br />
                Pagos
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-16 sm:h-20 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm"
              onClick={() => handleQuickAction("Ver Calendario", "calendario")}
            >
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-center leading-tight">
                Ver
                <br />
                Calendario
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-16 sm:h-20 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm"
              onClick={() => handleQuickAction("Ver Historial", "historial")}
            >
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-center leading-tight">
                Ver
                <br />
                Historial
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-16 sm:h-20 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm"
              onClick={() => handleQuickAction("Importar Datos", "importar")}
            >
              <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-center leading-tight">
                Importar
                <br />
                Datos
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen del Día */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumen del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Empleados trabajando hoy</span>
              <Badge variant="secondary">{loading ? "..." : stats.asignacionesHoy}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Pagos pendientes</span>
              <Badge variant={stats.pagosPendientes > 0 ? "destructive" : "secondary"}>
                {loading ? "..." : stats.pagosPendientes}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Empleados activos (30 días)</span>
              <Badge variant="default">{loading ? "..." : stats.empleadosActivos}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
