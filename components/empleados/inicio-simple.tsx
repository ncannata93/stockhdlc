"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"
import { getPaidWeeksSimple, isWeekPaid } from "@/lib/simple-payments"
import { subWeeks, startOfWeek, endOfWeek } from "date-fns"
import { Users, TrendingUp, Clock, DollarSign, RefreshCw, AlertCircle } from "lucide-react"

interface EmpleadosInicioSimpleProps {
  onTabChange?: (tab: string) => void
  refreshTrigger?: number
}

export default function EmpleadosInicioSimple({ onTabChange, refreshTrigger }: EmpleadosInicioSimpleProps) {
  const { toast } = useToast()
  const { getEmployees, getAssignments } = useEmployeeDB()
  const [stats, setStats] = useState({
    totalEmpleados: 0,
    empleadosActivos: 0,
    asignacionesHoy: 0,
    semanasPendientes: 0,
    montoTotalPendiente: 0,
  })
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      console.log("🔄 INICIO SIMPLE - Cargando estadísticas...")

      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]

      // Obtener datos básicos
      const [employees, todayAssignments, paidWeeks] = await Promise.all([
        getEmployees(),
        getAssignments({ start_date: todayStr, end_date: todayStr }),
        getPaidWeeksSimple(),
      ])

      // Calcular empleados activos (últimos 30 días)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      const recentAssignments = await getAssignments({
        start_date: thirtyDaysAgo.toISOString().split("T")[0],
        end_date: todayStr,
      })
      const activeEmployees = new Set(recentAssignments.map((a) => a.employee_id))

      // Analizar últimas 8 semanas para pagos pendientes
      const eightWeeksAgo = subWeeks(today, 8)
      const allRecentAssignments = await getAssignments({
        start_date: eightWeeksAgo.toISOString().split("T")[0],
        end_date: todayStr,
      })

      // Agrupar por empleado y semana
      const weeklyData = new Map<string, any>()

      allRecentAssignments.forEach((assignment) => {
        const assignmentDate = new Date(assignment.assignment_date)
        const weekStart = startOfWeek(assignmentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(assignmentDate, { weekStartsOn: 1 })
        const weekStartStr = weekStart.toISOString().split("T")[0]
        const weekEndStr = weekEnd.toISOString().split("T")[0]
        const weekKey = `${assignment.employee_id}-${weekStartStr}`

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            employeeId: assignment.employee_id,
            employeeName: assignment.employee_name,
            weekStart: weekStartStr,
            weekEnd: weekEndStr,
            totalAmount: 0,
          })
        }

        const weekData = weeklyData.get(weekKey)!
        weekData.totalAmount += assignment.daily_rate_used || 0
      })

      // Contar semanas pendientes
      let semanasPendientes = 0
      let montoTotalPendiente = 0

      weeklyData.forEach((weekData) => {
        const isPaid = isWeekPaid(weekData.employeeId, weekData.weekStart, weekData.weekEnd, paidWeeks)
        if (!isPaid) {
          semanasPendientes++
          montoTotalPendiente += weekData.totalAmount
        }
      })

      setStats({
        totalEmpleados: employees.length,
        empleadosActivos: activeEmployees.size,
        asignacionesHoy: new Set(todayAssignments.map((a) => a.employee_id)).size,
        semanasPendientes,
        montoTotalPendiente,
      })

      console.log("✅ INICIO SIMPLE - Estadísticas cargadas:", {
        totalEmpleados: employees.length,
        empleadosActivos: activeEmployees.size,
        semanasPendientes,
        montoTotalPendiente,
      })
    } catch (error) {
      console.error("❌ INICIO SIMPLE - Error:", error)
    }
  }, [getEmployees, getAssignments])

  useEffect(() => {
    setLoading(true)
    loadStats().finally(() => setLoading(false))
  }, [loadStats])

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadStats()
    }
  }, [refreshTrigger, loadStats])

  const handleRefresh = async () => {
    await loadStats()
    toast({
      title: "✅ Actualizado",
      description: "Estadísticas actualizadas",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard Simplificado</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas básicas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Empleados</p>
              <p className="text-2xl font-bold">{loading ? "..." : stats.totalEmpleados}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Activos (30d)</p>
              <p className="text-2xl font-bold">{loading ? "..." : stats.empleadosActivos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trabajando Hoy</p>
              <p className="text-2xl font-bold">{loading ? "..." : stats.asignacionesHoy}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Semanas Pendientes</p>
              <p className="text-2xl font-bold">{loading ? "..." : stats.semanasPendientes}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerta de pagos pendientes */}
      {stats.semanasPendientes > 0 && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">
                {stats.semanasPendientes} semana{stats.semanasPendientes !== 1 ? "s" : ""} pendiente
                {stats.semanasPendientes !== 1 ? "s" : ""} de pago
              </span>
            </div>
            <div className="text-sm text-red-700 mb-3">
              Monto total pendiente: ${stats.montoTotalPendiente.toLocaleString()}
            </div>
            <Button onClick={() => onTabChange?.("resumen")} className="w-full bg-red-600 hover:bg-red-700 text-white">
              Gestionar Pagos Pendientes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
