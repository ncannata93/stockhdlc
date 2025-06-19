"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Calendar, BarChart3, Upload, TrendingUp, Clock, RefreshCw, DollarSign } from "lucide-react"
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

interface Stats {
  totalEmpleados: number
  empleadosActivos: number
  asignacionesHoy: number
  empleadosConPagosPendientes: number
}

export default function EmpleadosInicio({ onTabChange, refreshTrigger }: EmpleadosInicioProps) {
  const { toast } = useToast()
  const { getEmployees, getAssignments, getPaidWeeks } = useEmployeeDB()
  const [stats, setStats] = useState<Stats>({
    totalEmpleados: 0,
    empleadosActivos: 0,
    asignacionesHoy: 0,
    empleadosConPagosPendientes: 0,
  })
  const [pendingDetails, setPendingDetails] = useState<PendingPaymentDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadRealStats = useCallback(async () => {
    console.log("🔄 === INICIO CÁLCULO ESTADÍSTICAS EMPLEADOS ===")
    try {
      const employees = await getEmployees()
      console.log(`👥 Empleados cargados: ${employees.length}`)

      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]
      console.log(`📅 Fecha actual: ${todayStr}`)

      // Asignaciones de hoy
      const todayAssignments = await getAssignments({
        start_date: todayStr,
        end_date: todayStr,
      })
      const uniqueEmployeesToday = new Set(todayAssignments.map((a) => a.employee_id))
      console.log(`📋 Asignaciones hoy: ${todayAssignments.length} (empleados únicos: ${uniqueEmployeesToday.size})`)

      // Empleados activos (30 días)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0]
      console.log(`📅 Buscando empleados activos desde: ${thirtyDaysAgoStr}`)

      const recentAssignments = await getAssignments({
        start_date: thirtyDaysAgoStr,
        end_date: todayStr,
      })
      const activeEmployees = new Set(recentAssignments.map((a) => a.employee_id))
      console.log(`🔥 Empleados activos (30 días): ${activeEmployees.size}`)

      // Cargar todas las semanas pagadas para análisis detallado
      const allPaidWeeks = await getPaidWeeks({})
      console.log(`💰 Total registros de semanas pagadas: ${allPaidWeeks.length}`)

      // 🎯 ANÁLISIS DETALLADO DE PAGOS
      let totalPendingAmount = 0
      let totalPaidAmount = 0
      let pendingWeeksCount = 0
      let paidWeeksCount = 0
      let overdueWeeksCount = 0
      let totalOverdueAmount = 0
      const employeesWithPending = new Set<number>()
      const employeesWithOverdue = new Set<number>()

      console.log("🔍 === ANÁLISIS DETALLADO DE PAGOS ===")

      allPaidWeeks.forEach((pw, index) => {
        const employeeName = employees.find((e) => e.id === pw.employee_id)?.name || `ID-${pw.employee_id}`
        const amount = Number(pw.amount) || 0
        const expectedAmount = Number(pw.expected_amount) || 0

        // Calcular si está vencido (más de 7 días desde el fin de semana)
        let isOverdue = false
        if (pw.week_end) {
          try {
            const weekEndDate = new Date(pw.week_end)
            const daysSinceWeekEnd = Math.floor((today.getTime() - weekEndDate.getTime()) / (1000 * 60 * 60 * 24))
            isOverdue = daysSinceWeekEnd > 7 && amount === 0

            if (index < 5) {
              // Log solo los primeros 5 para no saturar
              console.log(`📊 ${employeeName}: Semana ${pw.week_start} - ${pw.week_end}`)
              console.log(`   💰 Amount: $${amount}, Expected: $${expectedAmount}`)
              console.log(`   📅 Días desde fin de semana: ${daysSinceWeekEnd}`)
              console.log(`   ⚠️ Vencido: ${isOverdue}`)
            }
          } catch (error) {
            console.error(`❌ Error procesando fecha para ${employeeName}:`, error)
          }
        }

        if (amount > 0) {
          // PAGADO
          paidWeeksCount++
          totalPaidAmount += amount
        } else if (isOverdue) {
          // VENCIDO
          overdueWeeksCount++
          totalOverdueAmount += expectedAmount
          employeesWithOverdue.add(pw.employee_id)
        } else {
          // PENDIENTE
          pendingWeeksCount++
          totalPendingAmount += expectedAmount
          employeesWithPending.add(pw.employee_id)
        }
      })

      // Empleados con pagos pendientes (incluye vencidos)
      const allEmployeesWithPendingPayments = new Set([...employeesWithPending, ...employeesWithOverdue])

      console.log("📊 === RESUMEN BÁSICO ===")
      console.log(`👥 Total empleados: ${employees.length}`)
      console.log(`🔥 Empleados activos: ${activeEmployees.size}`)
      console.log(`📋 Trabajando hoy: ${uniqueEmployeesToday.size}`)
      console.log(`💰 Con pagos pendientes: ${allEmployeesWithPendingPayments.size}`)

      const finalStats = {
        totalEmpleados: employees.length,
        empleadosActivos: activeEmployees.size,
        asignacionesHoy: uniqueEmployeesToday.size,
        empleadosConPagosPendientes: allEmployeesWithPendingPayments.size,
      }

      console.log("🎯 === ESTADÍSTICAS FINALES ===")
      console.log(finalStats)

      setStats(finalStats)
      setPendingDetails([]) // Simplificar - no mostrar detalles complejos por ahora
    } catch (error) {
      console.error("❌ === ERROR EN CÁLCULO DE ESTADÍSTICAS ===", error)
      setStats({
        totalEmpleados: 0,
        empleadosActivos: 0,
        asignacionesHoy: 0,
        empleadosConPagosPendientes: 0,
      })
    }
    console.log("🏁 === FIN CÁLCULO ESTADÍSTICAS EMPLEADOS ===")
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
