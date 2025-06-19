"use client"

import { useState, useEffect, useCallback } from "react"
import { startOfWeek, addWeeks, subWeeks } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"
import { markWeekAsPaid, markWeekAsPending, isWeekPaid, getPaidWeeksSimple } from "@/lib/simple-payments"
import { Loader2, ChevronLeft, ChevronRight, CalendarDays, User, CheckCircle, Clock, RefreshCw } from "lucide-react"

interface EmpleadosResumenSimpleProps {
  onStatsChange?: () => void
}

export default function EmpleadosResumenSimple({ onStatsChange }: EmpleadosResumenSimpleProps) {
  const { toast } = useToast()
  const { getEmployees, getAssignments } = useEmployeeDB()

  // Estado simple
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    return monday.toISOString().split("T")[0]
  })

  const [employees, setEmployees] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [paidWeeks, setPaidWeeks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  // 🔄 FUNCIÓN SIMPLE: Cargar datos
  const loadData = useCallback(async () => {
    try {
      console.log(`🔄 Cargando datos para semana: ${currentWeek}`)

      // Calcular fechas de la semana
      const startDate = new Date(currentWeek)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      const endDateStr = endDate.toISOString().split("T")[0]

      console.log(`📅 Rango de semana: ${currentWeek} - ${endDateStr}`)

      // Cargar datos en paralelo
      const [employeesData, assignmentsData, paidWeeksData] = await Promise.all([
        getEmployees(),
        getAssignments({
          start_date: currentWeek,
          end_date: endDateStr,
        }),
        getPaidWeeksSimple(),
      ])

      setEmployees(employeesData)
      setAssignments(assignmentsData)
      setPaidWeeks(paidWeeksData)

      console.log(`✅ Datos cargados:`)
      console.log(`   - Empleados: ${employeesData.length}`)
      console.log(`   - Asignaciones: ${assignmentsData.length}`)
      console.log(`   - Semanas pagadas: ${paidWeeksData.length}`)
    } catch (error) {
      console.error("❌ Error cargando datos:", error)
    }
  }, [currentWeek, getEmployees, getAssignments])

  // Cargar datos cuando cambie la semana
  useEffect(() => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [loadData])

  // 🎯 FUNCIÓN SIMPLE: Cambiar estado de pago
  const togglePaymentStatus = async (employeeId: number, isPaid: boolean, amount: number) => {
    if (updating === employeeId) return

    setUpdating(employeeId)
    const employeeName = employees.find((e) => e.id === employeeId)?.name || `ID-${employeeId}`

    try {
      // Calcular fechas de la semana
      const startDate = new Date(currentWeek)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      const endDateStr = endDate.toISOString().split("T")[0]

      let success = false

      if (isPaid) {
        // Cambiar a pendiente (eliminar registro)
        success = await markWeekAsPending(employeeId, currentWeek, endDateStr)
        if (success) {
          toast({
            title: "✅ Marcado como pendiente",
            description: `${employeeName}: Semana marcada como pendiente`,
          })
        }
      } else {
        // Cambiar a pagado (crear/actualizar registro)
        success = await markWeekAsPaid(employeeId, currentWeek, endDateStr, amount)
        if (success) {
          toast({
            title: "✅ Marcado como pagado",
            description: `${employeeName}: Semana marcada como pagada ($${amount.toLocaleString()})`,
          })
        }
      }

      if (success) {
        // Recargar datos
        await loadData()
        if (onStatsChange) onStatsChange()
      } else {
        toast({
          title: "❌ Error",
          description: `No se pudo actualizar el estado de ${employeeName}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error cambiando estado:", error)
      toast({
        title: "❌ Error",
        description: "Error inesperado al cambiar estado",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  // Navegación de semanas
  const goToPreviousWeek = () => {
    const current = new Date(currentWeek)
    const previous = subWeeks(current, 1)
    setCurrentWeek(previous.toISOString().split("T")[0])
  }

  const goToNextWeek = () => {
    const current = new Date(currentWeek)
    const next = addWeeks(current, 1)
    setCurrentWeek(next.toISOString().split("T")[0])
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    setCurrentWeek(monday.toISOString().split("T")[0])
  }

  // Calcular resumen por empleado
  const employeeSummary = employees
    .map((employee) => {
      const employeeAssignments = assignments.filter((a) => a.employee_id === employee.id)
      const daysWorked = employeeAssignments.length
      const totalAmount = employeeAssignments.reduce((sum, a) => sum + (a.daily_rate_used || 0), 0)

      if (daysWorked === 0) return null

      // Calcular fechas de la semana
      const startDate = new Date(currentWeek)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      const endDateStr = endDate.toISOString().split("T")[0]

      const isPaid = isWeekPaid(employee.id, currentWeek, endDateStr, paidWeeks)

      return {
        employee,
        daysWorked,
        totalAmount,
        isPaid,
      }
    })
    .filter(Boolean)

  // Formatear fechas para mostrar
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const startDate = new Date(currentWeek)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Resumen Semanal Simplificado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de navegación */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={currentWeek}
                onChange={(e) => setCurrentWeek(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Semana: {formatDate(currentWeek)} - {formatDate(endDate.toISOString().split("T")[0])}
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="ml-auto">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Tabla de empleados */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : employeeSummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay asignaciones para esta semana</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead className="text-center">Días</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeSummary.map((summary) => (
                  <TableRow key={summary.employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{summary.employee.name}</div>
                          <div className="text-xs text-muted-foreground">{summary.employee.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{summary.daysWorked}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-bold text-green-600">${summary.totalAmount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={summary.isPaid ? "default" : "outline"}
                        className={summary.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                      >
                        {summary.isPaid ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pagada
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pendiente
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant={summary.isPaid ? "outline" : "default"}
                        onClick={() => togglePaymentStatus(summary.employee.id, summary.isPaid, summary.totalAmount)}
                        disabled={updating === summary.employee.id}
                        className={summary.isPaid ? "" : "bg-green-600 hover:bg-green-700 text-white"}
                      >
                        {updating === summary.employee.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : summary.isPaid ? (
                          "Marcar Pendiente"
                        ) : (
                          "Marcar Pagado"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
