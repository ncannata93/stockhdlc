"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserPlus,
  Calendar,
  BarChart3,
  Upload,
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"
import { startOfWeek, endOfWeek, subWeeks } from "date-fns"

interface EmpleadosInicioProps {
  onTabChange?: (tab: string) => void
  refreshTrigger?: number
}

export default function EmpleadosInicio({ onTabChange, refreshTrigger }: EmpleadosInicioProps) {
  const { toast } = useToast()
  const { getEmployees, getAssignments, getPaidWeeks } = useEmployeeDB()
  const [stats, setStats] = useState({
    totalEmpleados: 0,
    empleadosActivos: 0,
    asignacionesHoy: 0,
    pagosPendientes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadRealStats = useCallback(async () => {
    console.log("🔄 Cargando estadísticas del inicio...")
    try {
      // Obtener todos los empleados
      const employees = await getEmployees()
      console.log("👥 Empleados encontrados:", employees.length)

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
      console.log("📅 Empleados trabajando hoy:", uniqueEmployeesToday.size)

      // Calcular empleados activos (con asignaciones en los últimos 30 días)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      const recentAssignments = await getAssignments({
        start_date: thirtyDaysAgo.toISOString().split("T")[0],
        end_date: todayStr,
      })

      const activeEmployees = new Set(recentAssignments.map((a) => a.employee_id))
      console.log("🔥 Empleados activos (30 días):", activeEmployees.size)

      // CÁLCULO MEJORADO DE PAGOS PENDIENTES
      // Obtener todas las asignaciones de las últimas 12 semanas
      const twelveWeeksAgo = subWeeks(today, 12)
      const allRecentAssignments = await getAssignments({
        start_date: twelveWeeksAgo.toISOString().split("T")[0],
        end_date: todayStr,
      })

      // Obtener todas las semanas pagadas
      const allPaidWeeks = await getPaidWeeks({
        start_date: twelveWeeksAgo.toISOString().split("T")[0],
        end_date: todayStr,
      })

      console.log("📊 Asignaciones recientes (12 semanas):", allRecentAssignments.length)
      console.log("💰 Semanas pagadas encontradas:", allPaidWeeks.length)

      // Agrupar asignaciones por empleado y semana
      const weeklyAssignments = new Map<
        string,
        {
          employeeId: number
          employeeName: string
          weekStart: string
          weekEnd: string
          assignmentCount: number
        }
      >()

      allRecentAssignments.forEach((assignment) => {
        const assignmentDate = new Date(assignment.assignment_date)
        const weekStart = startOfWeek(assignmentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(assignmentDate, { weekStartsOn: 1 })

        const weekStartStr = weekStart.toISOString().split("T")[0]
        const weekEndStr = weekEnd.toISOString().split("T")[0]
        const weekKey = `${assignment.employee_id}-${weekStartStr}-${weekEndStr}`

        if (!weeklyAssignments.has(weekKey)) {
          weeklyAssignments.set(weekKey, {
            employeeId: assignment.employee_id,
            employeeName: assignment.employee_name || "Desconocido",
            weekStart: weekStartStr,
            weekEnd: weekEndStr,
            assignmentCount: 0,
          })
        }
        weeklyAssignments.get(weekKey)!.assignmentCount++
      })

      console.log("📅 Semanas con asignaciones encontradas:", weeklyAssignments.size)

      // Crear set de semanas pagadas con el mismo formato
      const paidWeeksSet = new Set<string>()
      allPaidWeeks.forEach((paidWeek) => {
        const weekKey = `${paidWeek.employee_id}-${paidWeek.week_start}-${paidWeek.week_end}`
        paidWeeksSet.add(weekKey)
      })

      console.log("💰 Semanas pagadas (set):", paidWeeksSet.size)

      // Calcular semanas pendientes de pago
      let pendingPayments = 0
      const pendingDetails: any[] = []

      weeklyAssignments.forEach((weekData, weekKey) => {
        if (!paidWeeksSet.has(weekKey)) {
          pendingPayments++
          pendingDetails.push({
            weekKey,
            ...weekData,
          })
        }
      })

      console.log("🔴 Pagos pendientes calculados:", pendingPayments)

      setStats({
        totalEmpleados: employees.length,
        empleadosActivos: activeEmployees.size,
        asignacionesHoy: uniqueEmployeesToday.size,
        pagosPendientes: pendingPayments,
      })

      console.log("📊 Estadísticas finales:", {
        totalEmpleados: employees.length,
        empleadosActivos: activeEmployees.size,
        asignacionesHoy: uniqueEmployeesToday.size,
        pagosPendientes: pendingPayments,
      })
    } catch (error) {
      console.error("❌ Error loading stats:", error)
      setStats({
        totalEmpleados: 0,
        empleadosActivos: 0,
        asignacionesHoy: 0,
        pagosPendientes: 0,
      })
    }
  }, [getEmployees, getAssignments, getPaidWeeks])

  // Cargar estadísticas iniciales
  useEffect(() => {
    const loadInitialStats = async () => {
      setLoading(true)
      await loadRealStats()
      setLoading(false)
    }
    loadInitialStats()
  }, [loadRealStats])

  // Recargar cuando cambie refreshTrigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log("🔄 Recargando estadísticas por trigger:", refreshTrigger)
      loadRealStats()
    }
  }, [refreshTrigger, loadRealStats])

  // Función para refrescar manualmente
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRealStats()
    setRefreshing(false)
    toast({
      title: "✅ Estadísticas actualizadas",
      description: "Los datos se han actualizado correctamente",
    })
  }

  const handleQuickAction = (action: string, tab: string) => {
    toast({
      title: "Navegando...",
      description: `Abriendo ${action}`,
    })
    onTabChange?.(tab)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header con botón de refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard de Empleados</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

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
              <p className="text-lg sm:text-2xl font-bold text-red-600">{loading ? "..." : stats.pagosPendientes}</p>
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
              <span className="text-xs sm:text-sm text-muted-foreground">Semanas pendientes de pago</span>
              <Badge variant={stats.pagosPendientes > 0 ? "destructive" : "secondary"}>
                {loading ? "..." : stats.pagosPendientes}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Empleados activos (30 días)</span>
              <Badge variant="default">{loading ? "..." : stats.empleadosActivos}</Badge>
            </div>
            {stats.pagosPendientes > 0 && !loading && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Hay {stats.pagosPendientes} semana{stats.pagosPendientes !== 1 ? "s" : ""} pendiente
                    {stats.pagosPendientes !== 1 ? "s" : ""} de pago
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
                  onClick={() => handleQuickAction("Ver Pagos Pendientes", "resumen")}
                >
                  Ver Pagos Pendientes
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
