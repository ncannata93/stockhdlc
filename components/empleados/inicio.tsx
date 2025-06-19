"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Calendar, BarChart3, Upload, TrendingUp, Clock, DollarSign, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"

interface EmpleadosInicioProps {
  onTabChange?: (tab: string) => void
  refreshTrigger?: number
}

interface PendingPaymentDetail {
  employeeId: number
  employeeName: string
  weekStart: string
  weekEnd: string
  assignmentCount: number
  totalAmount: number
  isPaid: boolean
  paidAmount?: number
  paidDate?: string
}

export default function EmpleadosInicio({ onTabChange, refreshTrigger }: EmpleadosInicioProps) {
  const { toast } = useToast()
  const { getEmployees, getAssignments, getPaidWeeks } = useEmployeeDB()
  const [stats, setStats] = useState({
    totalEmpleados: 0,
    empleadosActivos: 0,
    asignacionesHoy: 0,
    semanasConAsignaciones: 0,
    semanasPagadas: 0,
    semanasPendientes: 0,
    empleadosConPagosPendientes: 0,
    montoTotalPendiente: 0,
  })
  const [pendingDetails, setPendingDetails] = useState<PendingPaymentDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadRealStats = useCallback(async () => {
    console.log("🔄 INICIO - Cargando estadísticas simples...")
    try {
      const employees = await getEmployees()
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]

      // Asignaciones de hoy
      const todayAssignments = await getAssignments({
        start_date: todayStr,
        end_date: todayStr,
      })
      const uniqueEmployeesToday = new Set(todayAssignments.map((a) => a.employee_id))

      // Empleados activos (30 días)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      const recentAssignments = await getAssignments({
        start_date: thirtyDaysAgo.toISOString().split("T")[0],
        end_date: todayStr,
      })
      const activeEmployees = new Set(recentAssignments.map((a) => a.employee_id))

      // Pagos pendientes simples
      const allPaidWeeks = await getPaidWeeks({})
      const pendingCount = allPaidWeeks.filter((pw) => pw.amount === 0 || !pw.amount).length
      const paidCount = allPaidWeeks.filter((pw) => pw.amount > 0).length
      const totalPending = allPaidWeeks
        .filter((pw) => pw.amount === 0 || !pw.amount)
        .reduce((sum, pw) => sum + (pw.expected_amount || 0), 0)

      setStats({
        totalEmpleados: employees.length,
        empleadosActivos: activeEmployees.size,
        asignacionesHoy: uniqueEmployeesToday.size,
        semanasConAsignaciones: allPaidWeeks.length,
        semanasPagadas: paidCount,
        semanasPendientes: pendingCount,
        empleadosConPagosPendientes: new Set(
          allPaidWeeks.filter((pw) => pw.amount === 0 || !pw.amount).map((pw) => pw.employee_id),
        ).size,
        montoTotalPendiente: totalPending,
      })

      setPendingDetails([]) // Simplificar - no mostrar detalles complejos
    } catch (error) {
      console.error("❌ Error loading stats:", error)
      setStats({
        totalEmpleados: 0,
        empleadosActivos: 0,
        asignacionesHoy: 0,
        semanasConAsignaciones: 0,
        semanasPagadas: 0,
        semanasPendientes: 0,
        empleadosConPagosPendientes: 0,
        montoTotalPendiente: 0,
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
      console.log("🔄 INICIO - Recargando estadísticas por trigger:", refreshTrigger)
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
    console.log(`🔄 Navegando a: ${tab}`)
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

      {/* Estadísticas Básicas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Empleados</p>
              <p className="text-lg sm:text-2xl font-bold">{loading ? "..." : stats.totalEmpleados}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Activos (30d)</p>
              <p className="text-lg sm:text-2xl font-bold">{loading ? "..." : stats.empleadosActivos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Trabajando Hoy</p>
              <p className="text-lg sm:text-2xl font-bold">{loading ? "..." : stats.asignacionesHoy}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Con Pagos Pendientes</p>
              <p className="text-lg sm:text-2xl font-bold">{loading ? "..." : stats.empleadosConPagosPendientes}</p>
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
    </div>
  )
}
