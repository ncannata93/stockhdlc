"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  UserPlus,
  Calendar,
  BarChart3,
  Upload,
  TrendingUp,
  Clock,
  DollarSign,
  RefreshCw,
  Eye,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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

// FUNCIÓN MEJORADA: Verifica si una semana tiene solapamiento con semanas pagadas
const hasWeekOverlapWithPaidWeeks = (
  weekStart: string,
  weekEnd: string,
  paidWeeks: any[],
  employeeId: number,
): boolean => {
  return paidWeeks.some((pw) => {
    if (pw.employee_id !== employeeId) return false

    // Verificar solapamiento: si hay cualquier día en común entre las dos semanas
    const overlap = weekStart <= pw.week_end && weekEnd >= pw.week_start

    if (overlap) {
      console.log(`🔍 SOLAPAMIENTO ENCONTRADO en Inicio para empleado ${employeeId}:`, {
        semana_calculada: `${weekStart} al ${weekEnd}`,
        semana_pagada: `${pw.week_start} al ${pw.week_end}`,
        solapamiento: overlap,
      })
    }

    return overlap
  })
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

      // CÁLCULO DETALLADO DE PAGOS PENDIENTES CON NUEVA LÓGICA
      // Obtener todas las asignaciones de las últimas 8 semanas
      const eightWeeksAgo = subWeeks(today, 8)
      const allRecentAssignments = await getAssignments({
        start_date: eightWeeksAgo.toISOString().split("T")[0],
        end_date: todayStr,
      })

      // Obtener todas las semanas pagadas
      const allPaidWeeks = await getPaidWeeks({
        start_date: eightWeeksAgo.toISOString().split("T")[0],
        end_date: todayStr,
      })

      console.log("📊 Asignaciones recientes (8 semanas):", allRecentAssignments.length)
      console.log("💰 Semanas pagadas encontradas:", allPaidWeeks.length)

      // DEBUG: Mostrar todas las semanas pagadas
      console.log("🔍 DEBUGGING INICIO - Semanas pagadas en detalle:")
      allPaidWeeks.forEach((paidWeek, index) => {
        console.log(`  ${index + 1}. Empleado ID: ${paidWeek.employee_id}, Nombre: ${paidWeek.employee_name}`)
        console.log(`     Semana: ${paidWeek.week_start} al ${paidWeek.week_end}`)
        console.log(`     Monto: $${paidWeek.amount}`)
        console.log(`     Fecha pago: ${paidWeek.paid_date}`)
      })

      // Agrupar asignaciones por empleado y semana
      const weeklyAssignments = new Map<string, PendingPaymentDetail>()

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
            totalAmount: 0,
            isPaid: false,
          })
        }

        const weekData = weeklyAssignments.get(weekKey)!
        weekData.assignmentCount++
        weekData.totalAmount += assignment.daily_rate_used || 0
      })

      console.log("📅 Semanas con asignaciones encontradas:", weeklyAssignments.size)

      // DEBUG: Mostrar todas las semanas con asignaciones
      console.log("🔍 DEBUGGING INICIO - Semanas con asignaciones:")
      weeklyAssignments.forEach((weekData, weekKey) => {
        console.log(`  Key: ${weekKey}`)
        console.log(`  Empleado: ${weekData.employeeName} (ID: ${weekData.employeeId})`)
        console.log(`  Semana: ${weekData.weekStart} al ${weekData.weekEnd}`)
        console.log(`  Días: ${weekData.assignmentCount}, Monto: $${weekData.totalAmount}`)
      })

      // NUEVA LÓGICA: Marcar semanas como pagadas usando solapamiento
      const pendingWeeks: PendingPaymentDetail[] = []
      const paidWeeks: PendingPaymentDetail[] = []
      const employeesWithPendingPayments = new Set<number>()
      let totalPendingAmount = 0
      let totalPaidWeeks = 0

      weeklyAssignments.forEach((weekData, weekKey) => {
        // Usar la misma lógica de solapamiento que en el componente Resumen
        const isPaid = hasWeekOverlapWithPaidWeeks(
          weekData.weekStart,
          weekData.weekEnd,
          allPaidWeeks,
          weekData.employeeId,
        )

        if (isPaid) {
          // Semana pagada (con solapamiento)
          weekData.isPaid = true

          // Buscar la semana pagada específica para obtener detalles
          const matchingPaidWeek = allPaidWeeks.find((pw) => {
            return (
              pw.employee_id === weekData.employeeId &&
              weekData.weekStart <= pw.week_end &&
              weekData.weekEnd >= pw.week_start
            )
          })

          if (matchingPaidWeek) {
            weekData.paidAmount = matchingPaidWeek.amount
            weekData.paidDate = matchingPaidWeek.paid_date
          }

          paidWeeks.push(weekData)
          totalPaidWeeks++

          console.log(`✅ INICIO - Semana PAGADA (solapamiento) encontrada:`)
          console.log(`   ${weekData.employeeName}: ${weekData.weekStart} al ${weekData.weekEnd}`)
          console.log(`   Monto trabajado: $${weekData.totalAmount}, Monto pagado: $${weekData.paidAmount || "N/A"}`)
        } else {
          // Semana pendiente
          weekData.isPaid = false
          pendingWeeks.push(weekData)
          employeesWithPendingPayments.add(weekData.employeeId)
          totalPendingAmount += weekData.totalAmount

          console.log(`🔴 INICIO - Semana PENDIENTE:`)
          console.log(`   ${weekData.employeeName}: ${weekData.weekStart} al ${weekData.weekEnd}`)
          console.log(`   Monto: $${weekData.totalAmount}`)
        }
      })

      // Ordenar por empleado y fecha
      pendingWeeks.sort((a, b) => {
        if (a.employeeName !== b.employeeName) {
          return a.employeeName.localeCompare(b.employeeName)
        }
        return a.weekStart.localeCompare(b.weekStart)
      })

      setPendingDetails(pendingWeeks)

      setStats({
        totalEmpleados: employees.length,
        empleadosActivos: activeEmployees.size,
        asignacionesHoy: uniqueEmployeesToday.size,
        semanasConAsignaciones: weeklyAssignments.size,
        semanasPagadas: totalPaidWeeks,
        semanasPendientes: pendingWeeks.length,
        empleadosConPagosPendientes: employeesWithPendingPayments.size,
        montoTotalPendiente: totalPendingAmount,
      })

      console.log("📊 RESUMEN FINAL INICIO:")
      console.log("- Total semanas con asignaciones:", weeklyAssignments.size)
      console.log("- Semanas pagadas (con solapamiento):", totalPaidWeeks)
      console.log("- Semanas pendientes:", pendingWeeks.length)
      console.log("- Empleados con pagos pendientes:", employeesWithPendingPayments.size)
      console.log("- Monto total pendiente:", totalPendingAmount)

      // DEBUG: Verificar si hay discrepancias
      if (weeklyAssignments.size !== totalPaidWeeks + pendingWeeks.length) {
        console.error("❌ DISCREPANCIA DETECTADA EN INICIO:")
        console.error(`Total semanas: ${weeklyAssignments.size}`)
        console.error(`Pagadas + Pendientes: ${totalPaidWeeks + pendingWeeks.length}`)
      } else {
        console.log("✅ Cálculos coherentes en Inicio")
      }
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
      setPendingDetails([])
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

      {/* Estadísticas de Pagos Detalladas */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Análisis de Pagos (Últimas 8 semanas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{loading ? "..." : stats.semanasConAsignaciones}</div>
              <div className="text-sm text-muted-foreground">Semanas con Trabajo</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{loading ? "..." : stats.semanasPagadas}</div>
              <div className="text-sm text-muted-foreground">Semanas Pagadas</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{loading ? "..." : stats.semanasPendientes}</div>
              <div className="text-sm text-muted-foreground">Semanas Pendientes</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                ${loading ? "..." : stats.montoTotalPendiente.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Monto Pendiente</div>
            </div>
          </div>

          {/* Botón para ir al resumen de pagos */}
          {stats.semanasPendientes > 0 && !loading && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => handleQuickAction("Ver Pagos Pendientes", "resumen")}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <DollarSign className="h-4 w-4" />
                Gestionar Pagos Pendientes
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Ver Detalle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Detalle de Pagos Pendientes</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {pendingDetails.map((detail, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{detail.employeeName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Semana: {format(new Date(detail.weekStart), "dd/MM/yyyy")} -{" "}
                              {format(new Date(detail.weekEnd), "dd/MM/yyyy")}
                            </p>
                            <p className="text-sm">Días trabajados: {detail.assignmentCount}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">${detail.totalAmount.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-6 pt-4 border-t">
                      <Button
                        onClick={() => {
                          handleQuickAction("Ir a Gestionar Pagos", "resumen")
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        Ir a Gestionar Estos Pagos
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {stats.semanasPendientes > 0 && !loading && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Hay {stats.semanasPendientes} semana{stats.semanasPendientes !== 1 ? "s" : ""} pendiente
              {stats.semanasPendientes !== 1 ? "s" : ""} de pago
            </span>
          </div>
          <div className="text-xs text-red-700 mb-3">
            {stats.empleadosConPagosPendientes} empleado{stats.empleadosConPagosPendientes !== 1 ? "s" : ""}
            {stats.empleadosConPagosPendientes !== 1 ? " tienen" : " tiene"} pagos pendientes por $
            {stats.montoTotalPendiente.toLocaleString()}
          </div>
          <Button
            onClick={() => handleQuickAction("Gestionar Pagos Pendientes", "resumen")}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            Gestionar Pagos Pendientes
          </Button>
        </div>
      )}

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
