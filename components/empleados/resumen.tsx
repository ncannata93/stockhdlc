"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { parseISO, addWeeks, subWeeks, startOfWeek, isValid } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  User,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeeAssignment } from "@/lib/employee-types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateForDisplay } from "@/lib/date-utils"
import { useToast } from "@/hooks/use-toast"

const getHotelColor = (hotelName: string) => {
  const colors: Record<string, string> = {
    Jaguel: "bg-red-100 text-red-800 border-red-200",
    Monaco: "bg-blue-100 text-blue-800 border-blue-200",
    Mallak: "bg-green-100 text-green-800 border-green-200",
    Argentina: "bg-purple-100 text-purple-800 border-purple-200",
    Falkner: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Stromboli: "bg-pink-100 text-pink-800 border-pink-200",
    "San Miguel": "bg-indigo-100 text-indigo-800 border-indigo-200",
    Colores: "bg-orange-100 text-orange-800 border-orange-200",
    Puntarenas: "bg-teal-100 text-teal-800 border-teal-200",
    Tupe: "bg-cyan-100 text-cyan-800 border-cyan-200",
    Munich: "bg-amber-100 text-amber-800 border-amber-200",
    Tiburones: "bg-slate-100 text-slate-800 border-slate-200",
    Barlovento: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Carama: "bg-violet-100 text-violet-800 border-violet-200",
  }
  return colors[hotelName] || "bg-gray-100 text-gray-800 border-gray-200"
}

// 🏪 CLASE PARA MANEJAR PERSISTENCIA
class WeekPersistence {
  private static readonly STORAGE_KEY = "empleados-resumen-week"
  private static readonly EMPLOYEE_KEY = "empleados-resumen-employee"

  static getStoredWeek(): string {
    try {
      if (typeof window === "undefined") return this.getDefaultWeek()

      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) {
        console.log("📦 Semana recuperada de localStorage:", stored)
        return stored
      }

      const defaultWeek = this.getDefaultWeek()
      this.setStoredWeek(defaultWeek)
      return defaultWeek
    } catch (error) {
      console.error("Error getting stored week:", error)
      return this.getDefaultWeek()
    }
  }

  static setStoredWeek(week: string): void {
    try {
      if (typeof window === "undefined") return

      console.log("💾 Guardando semana en localStorage:", week)
      localStorage.setItem(this.STORAGE_KEY, week)
    } catch (error) {
      console.error("Error setting stored week:", error)
    }
  }

  static getStoredEmployee(): string {
    try {
      if (typeof window === "undefined") return "todos"

      const stored = localStorage.getItem(this.EMPLOYEE_KEY)
      return stored || "todos"
    } catch (error) {
      console.error("Error getting stored employee:", error)
      return "todos"
    }
  }

  static setStoredEmployee(employee: string): void {
    try {
      if (typeof window === "undefined") return

      localStorage.setItem(this.EMPLOYEE_KEY, employee)
    } catch (error) {
      console.error("Error setting stored employee:", error)
    }
  }

  private static getDefaultWeek(): string {
    try {
      const today = new Date()
      const monday = startOfWeek(today, { weekStartsOn: 1 })
      return monday.toISOString().split("T")[0]
    } catch (error) {
      console.error("Error getting default week:", error)
      return "2024-01-01"
    }
  }
}

const isDateInWeekRange = (date: string, weekStart: string, weekEnd: string): boolean => {
  return date >= weekStart && date <= weekEnd
}

const safeParseDateString = (dateString: any): Date | null => {
  try {
    if (!dateString || typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return null
    }
    const parsed = parseISO(dateString)
    return isValid(parsed) ? parsed : null
  } catch (error) {
    console.error("safeParseDateString error:", error)
    return null
  }
}

const safeFormatDateString = (dateString: any): string => {
  try {
    const parsed = safeParseDateString(dateString)
    return parsed ? formatDateForDisplay(parsed) : ""
  } catch (error) {
    return ""
  }
}

const hasSignificantWeekOverlap = (
  weekStart: string,
  weekEnd: string,
  paidWeeks: any[],
  employeeId: number,
): boolean => {
  try {
    if (!weekStart || !weekEnd || !Array.isArray(paidWeeks) || !employeeId) return false

    const employeePaidWeeks = paidWeeks.filter((pw) => pw.employee_id === employeeId)
    const exactMatch = employeePaidWeeks.find((pw) => pw.week_start === weekStart && pw.week_end === weekEnd)

    if (exactMatch) return exactMatch.amount > 0

    const significantOverlaps = employeePaidWeeks.filter((pw) => {
      if (pw.week_start === weekStart && pw.week_end === weekEnd) return false
      if (pw.amount === 0) return false

      const overlapStart = weekStart > pw.week_start ? weekStart : pw.week_start
      const overlapEnd = weekEnd < pw.week_end ? weekEnd : pw.week_end

      if (overlapStart <= overlapEnd) {
        const startDate = new Date(overlapStart)
        const endDate = new Date(overlapEnd)
        const overlapDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return overlapDays > 1
      }
      return false
    })

    return significantOverlaps.length > 0
  } catch (error) {
    console.error("hasSignificantWeekOverlap error:", error)
    return false
  }
}

interface EmpleadosResumenProps {
  onStatsChange?: () => void
}

export default function EmpleadosResumen({ onStatsChange }: EmpleadosResumenProps) {
  const { toast } = useToast()
  const { getEmployees, getAssignments, getPaidWeeks, updatePaymentStatus } = useEmployeeDB()

  // 🏪 ESTADO PERSISTENTE - LA ÚNICA FUENTE DE VERDAD
  const [persistentWeek, setPersistentWeek] = useState<string>(() => WeekPersistence.getStoredWeek())
  const [persistentEmployee, setPersistentEmployee] = useState<string>(() => WeekPersistence.getStoredEmployee())

  // Estado de datos
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [paidWeeks, setPaidWeeks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // 🔒 REFS PARA PREVENIR CAMBIOS DURANTE OPERACIONES
  const operationInProgress = useRef(false)
  const mountedRef = useRef(false)

  // 🎯 FUNCIÓN PARA CAMBIAR SEMANA DE FORMA SEGURA
  const changeWeekSafely = useCallback(
    (newWeek: string, source: string) => {
      if (operationInProgress.current) {
        console.log(`🔒 OPERACIÓN EN PROGRESO - Ignorando cambio de semana desde ${source}`)
        return false
      }

      if (!newWeek || typeof newWeek !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(newWeek)) {
        console.error(`❌ Fecha inválida desde ${source}:`, newWeek)
        return false
      }

      console.log(`📅 CAMBIO DE SEMANA AUTORIZADO: ${persistentWeek} → ${newWeek} (${source})`)

      // Actualizar AMBOS: estado y localStorage
      setPersistentWeek(newWeek)
      WeekPersistence.setStoredWeek(newWeek)

      return true
    },
    [persistentWeek],
  )

  // 🎯 FUNCIÓN PARA CAMBIAR EMPLEADO DE FORMA SEGURA
  const changeEmployeeSafely = useCallback(
    (newEmployee: string, source: string) => {
      if (operationInProgress.current) {
        console.log(`🔒 OPERACIÓN EN PROGRESO - Ignorando cambio de empleado desde ${source}`)
        return false
      }

      console.log(`👤 CAMBIO DE EMPLEADO AUTORIZADO: ${persistentEmployee} → ${newEmployee} (${source})`)

      // Actualizar AMBOS: estado y localStorage
      setPersistentEmployee(newEmployee)
      WeekPersistence.setStoredEmployee(newEmployee)

      return true
    },
    [persistentEmployee],
  )

  // 🔄 FUNCIÓN DE CARGA DE DATOS
  const loadWeekData = useCallback(
    async (weekStr: string, employeeFilter: string) => {
      try {
        console.log(`🔄 Cargando datos para semana: ${weekStr}, empleado: ${employeeFilter}`)

        const startDate = safeParseDateString(weekStr)
        if (!startDate) {
          console.error("Fecha de inicio inválida:", weekStr)
          return false
        }

        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        const endDateStr = endDate.toISOString().split("T")[0]

        const [employeesData, allAssignmentsData, paidWeeksData] = await Promise.all([
          getEmployees(),
          getAssignments({}),
          getPaidWeeks({}),
        ])

        const filteredAssignments = allAssignmentsData.filter((assignment) => {
          return isDateInWeekRange(assignment.assignment_date, weekStr, endDateStr)
        })

        let finalAssignments = filteredAssignments
        if (employeeFilter !== "todos") {
          const employeeId = Number.parseInt(employeeFilter)
          if (!isNaN(employeeId)) {
            finalAssignments = filteredAssignments.filter((a) => a.employee_id === employeeId)
          }
        }

        setEmployees(employeesData)
        setAssignments(finalAssignments)
        setPaidWeeks(paidWeeksData)
        setLastUpdate(Date.now())

        console.log(`✅ Datos cargados: ${employeesData.length} empleados, ${finalAssignments.length} asignaciones`)
        return true
      } catch (error) {
        console.error("❌ Error cargando datos:", error)
        return false
      }
    },
    [getEmployees, getAssignments, getPaidWeeks],
  )

  // 🚀 CARGA INICIAL Y CUANDO CAMBIAN LOS FILTROS
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      console.log("🚀 MONTAJE INICIAL DEL COMPONENTE")
    }

    console.log(`🔄 useEffect disparado - Semana: ${persistentWeek}, Empleado: ${persistentEmployee}`)

    setLoading(true)
    loadWeekData(persistentWeek, persistentEmployee).finally(() => {
      setLoading(false)
    })
  }, [persistentWeek, persistentEmployee, loadWeekData])

  // 🎯 NAVEGACIÓN DE SEMANAS
  const goToPreviousWeek = useCallback(async () => {
    const currentDate = safeParseDateString(persistentWeek)
    if (!currentDate) return

    const previousWeek = subWeeks(currentDate, 1)
    const newWeekStr = previousWeek.toISOString().split("T")[0]

    if (changeWeekSafely(newWeekStr, "goToPreviousWeek")) {
      // El useEffect se encargará de cargar los datos
    }
  }, [persistentWeek, changeWeekSafely])

  const goToNextWeek = useCallback(async () => {
    const currentDate = safeParseDateString(persistentWeek)
    if (!currentDate) return

    const nextWeek = addWeeks(currentDate, 1)
    const newWeekStr = nextWeek.toISOString().split("T")[0]

    if (changeWeekSafely(newWeekStr, "goToNextWeek")) {
      // El useEffect se encargará de cargar los datos
    }
  }, [persistentWeek, changeWeekSafely])

  const goToCurrentWeek = useCallback(async () => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    const newWeekStr = monday.toISOString().split("T")[0]

    if (changeWeekSafely(newWeekStr, "goToCurrentWeek")) {
      // El useEffect se encargará de cargar los datos
    }
  }, [changeWeekSafely])

  const handleWeekChange = useCallback(
    (newWeek: string) => {
      if (changeWeekSafely(newWeek, "handleWeekChange")) {
        // El useEffect se encargará de cargar los datos
      }
    },
    [changeWeekSafely],
  )

  const handleEmployeeChange = useCallback(
    (newEmployee: string) => {
      if (changeEmployeeSafely(newEmployee, "handleEmployeeChange")) {
        // El useEffect se encargará de cargar los datos
      }
    },
    [changeEmployeeSafely],
  )

  // 🎯 CAMBIO DE ESTADO DE PAGO - COMPLETAMENTE AISLADO
  const handlePaymentStatusChange = useCallback(
    async (employeeId: number, newStatus: "pendiente" | "pagado", amount: number) => {
      if (updatingPayment === employeeId || operationInProgress.current) {
        console.log("⚠️ Operación ya en progreso")
        return
      }

      const employeeName = employees.find((e) => e.id === employeeId)?.name || `ID-${employeeId}`

      // 🔒 BLOQUEAR TODAS LAS OPERACIONES
      operationInProgress.current = true
      setUpdatingPayment(employeeId)

      // 📦 PRESERVAR ESTADO DESDE LOCALSTORAGE (LA FUENTE DE VERDAD)
      const preservedWeek = WeekPersistence.getStoredWeek()
      const preservedEmployee = WeekPersistence.getStoredEmployee()

      console.log(`🔄 ===== INICIO PAGO PARA ${employeeName.toUpperCase()} =====`)
      console.log(`🔒 OPERACIÓN BLOQUEADA - Estado preservado:`, { preservedWeek, preservedEmployee })

      try {
        const startDate = safeParseDateString(preservedWeek)
        if (!startDate) {
          throw new Error("Fecha preservada inválida")
        }

        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        const endDateStr = endDate.toISOString().split("T")[0]

        const success = await updatePaymentStatus(
          employeeId,
          preservedWeek,
          endDateStr,
          newStatus,
          amount,
          `Estado cambiado a ${newStatus} el ${new Date().toLocaleDateString()}`,
        )

        if (success) {
          toast({
            title: "✅ Estado actualizado",
            description: `${employeeName}: Semana marcada como ${newStatus}`,
          })

          // 🔄 RECARGAR DATOS CON ESTADO PRESERVADO
          console.log(`🔄 Recargando datos con estado preservado...`)
          await loadWeekData(preservedWeek, preservedEmployee)

          // 🔒 VERIFICAR QUE EL ESTADO NO HAYA CAMBIADO
          const currentWeek = WeekPersistence.getStoredWeek()
          const currentEmployee = WeekPersistence.getStoredEmployee()

          if (currentWeek !== preservedWeek) {
            console.log(`🚨 ALERTA: Semana cambió durante operación: ${preservedWeek} → ${currentWeek}`)
            console.log(`🔧 RESTAURANDO semana a: ${preservedWeek}`)
            WeekPersistence.setStoredWeek(preservedWeek)
            setPersistentWeek(preservedWeek)
          }

          if (currentEmployee !== preservedEmployee) {
            console.log(`🚨 ALERTA: Empleado cambió durante operación: ${preservedEmployee} → ${currentEmployee}`)
            console.log(`🔧 RESTAURANDO empleado a: ${preservedEmployee}`)
            WeekPersistence.setStoredEmployee(preservedEmployee)
            setPersistentEmployee(preservedEmployee)
          }

          if (onStatsChange) {
            onStatsChange()
          }

          console.log(`✅ Operación completada - Estado final: semana=${preservedWeek}, empleado=${preservedEmployee}`)
        } else {
          toast({
            title: "❌ Error",
            description: `${employeeName}: No se pudo actualizar el estado`,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error(`❌ Error en handlePaymentStatusChange:`, error)
        toast({
          title: "❌ Error",
          description: "Error inesperado al actualizar",
          variant: "destructive",
        })
      } finally {
        // 🔓 DESBLOQUEAR OPERACIONES
        operationInProgress.current = false
        setUpdatingPayment(null)
        console.log(`🔄 ===== FIN PAGO PARA ${employeeName.toUpperCase()} =====\n`)
      }
    },
    [employees, updatePaymentStatus, loadWeekData, onStatsChange, toast, updatingPayment],
  )

  // 🔄 FUNCIÓN DE RECARGA MANUAL
  const reloadData = useCallback(async () => {
    if (operationInProgress.current) return

    setRefreshing(true)
    const currentWeek = WeekPersistence.getStoredWeek()
    const currentEmployee = WeekPersistence.getStoredEmployee()

    console.log(`🔄 Recarga manual - Estado actual: semana=${currentWeek}, empleado=${currentEmployee}`)

    try {
      await loadWeekData(currentWeek, currentEmployee)
      if (onStatsChange) onStatsChange()
      console.log(`✅ Recarga completada`)
    } catch (error) {
      console.error("❌ Error recargando datos:", error)
    } finally {
      setRefreshing(false)
    }
  }, [loadWeekData, onStatsChange])

  // 🧮 CALCULAR FECHAS ACTUALES
  const currentStartDate = safeParseDateString(persistentWeek)
  const currentEndDate = currentStartDate
    ? (() => {
        const end = new Date(currentStartDate)
        end.setDate(currentStartDate.getDate() + 6)
        return end
      })()
    : null

  const startDateStr = persistentWeek
  const endDateStr = currentEndDate ? currentEndDate.toISOString().split("T")[0] : ""

  // 📊 CALCULAR RESUMEN DE EMPLEADOS
  const employeeSummary = employees
    .map((employee) => {
      try {
        const employeeAssignments = assignments.filter((a) => a.employee_id === employee.id)
        const assignmentsByDate = employeeAssignments.reduce(
          (acc, assignment) => {
            const date = assignment.assignment_date
            if (!acc[date]) acc[date] = []
            acc[date].push(assignment)
            return acc
          },
          {} as Record<string, EmployeeAssignment[]>,
        )

        const daysWorked = Object.keys(assignmentsByDate).length
        const assignmentDetails = Object.entries(assignmentsByDate).map(([date, dayAssignments]) => {
          const totalForDay = dayAssignments.reduce((sum, assignment) => sum + (assignment.daily_rate_used || 0), 0)
          return { date, assignments: dayAssignments, totalForDay }
        })

        const totalAmount = assignmentDetails.reduce((sum, detail) => sum + detail.totalForDay, 0)
        const hotels = [...new Set(employeeAssignments.map((a) => a.hotel_name))]
        const isPaid = hasSignificantWeekOverlap(startDateStr, endDateStr, paidWeeks, employee.id)

        return {
          employee,
          daysWorked,
          totalAmount,
          hotels,
          assignmentDetails,
          assignments: employeeAssignments,
          isPaid,
        }
      } catch (error) {
        console.error("Error processing employee summary:", error)
        return null
      }
    })
    .filter((summary): summary is NonNullable<typeof summary> => {
      if (!summary) return false
      if (persistentEmployee !== "todos") {
        return summary.employee.id === Number.parseInt(persistentEmployee)
      }
      return summary.daysWorked > 0
    })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5" />
                Resumen de Empleados
              </CardTitle>
              <CardDescription className="text-sm">
                Gestión semanal de pagos y asignaciones
                <div className="text-xs text-gray-500 mt-1">
                  📦 Semana persistente: {persistentWeek} | 🔒 Operación:{" "}
                  {operationInProgress.current ? "ACTIVA" : "INACTIVA"}
                </div>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reloadData}
              disabled={refreshing || operationInProgress.current}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Navegación de semanas */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">📅 Semana</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousWeek}
                  className="px-2"
                  disabled={operationInProgress.current}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={persistentWeek}
                  onChange={(e) => handleWeekChange(e.target.value)}
                  className="flex-1 text-sm"
                  disabled={operationInProgress.current}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextWeek}
                  className="px-2"
                  disabled={operationInProgress.current}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToCurrentWeek}
                  className="px-2"
                  disabled={operationInProgress.current}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filtro de empleado */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">👥 Empleado</Label>
              <Select
                value={persistentEmployee}
                onValueChange={handleEmployeeChange}
                disabled={operationInProgress.current}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">🏢 Todos los empleados</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      👤 {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info de la semana */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">📍 Período</Label>
              <div className="text-sm p-2 bg-blue-50 rounded border border-blue-200">
                {safeFormatDateString(startDateStr)} al {safeFormatDateString(endDateStr)}
              </div>
            </div>
          </div>

          <Tabs value="semanal" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="semanal" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Vista Semanal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="semanal" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : employeeSummary.length === 0 ? (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">No hay actividad</h3>
                    <p className="text-yellow-700 text-sm mb-4">No se encontraron asignaciones para esta semana</p>
                    <Button
                      onClick={goToCurrentWeek}
                      variant="outline"
                      size="sm"
                      disabled={operationInProgress.current}
                    >
                      📍 Ir a la semana actual
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Empleado</TableHead>
                          <TableHead className="text-center w-[80px]">Días</TableHead>
                          <TableHead className="text-center w-[120px]">Total</TableHead>
                          <TableHead className="w-[200px]">Hoteles</TableHead>
                          <TableHead className="text-center w-[100px]">Estado</TableHead>
                          <TableHead className="text-center w-[120px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeSummary.map((summary) => (
                          <TableRow key={`${summary.employee.id}-${lastUpdate}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <div>
                                  <div className="font-medium">{summary.employee.name}</div>
                                  <div className="text-xs text-muted-foreground">{summary.employee.role}</div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {summary.daysWorked}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-center">
                              <div className="font-bold text-green-600">${summary.totalAmount.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">
                                ${summary.employee.daily_rate.toLocaleString()}/día
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {summary.hotels.slice(0, 3).map((hotel) => (
                                  <Badge key={hotel} className={`${getHotelColor(hotel)} text-xs`}>
                                    {hotel}
                                  </Badge>
                                ))}
                                {summary.hotels.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{summary.hotels.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge
                                variant={summary.isPaid ? "default" : "outline"}
                                className={`text-xs ${
                                  summary.isPaid
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                }`}
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
                              <div className="flex gap-1 justify-center">
                                {summary.isPaid ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handlePaymentStatusChange(summary.employee.id, "pendiente", summary.totalAmount)
                                    }
                                    disabled={updatingPayment === summary.employee.id || operationInProgress.current}
                                    className="text-xs px-2 py-1 h-7"
                                  >
                                    {updatingPayment === summary.employee.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Pendiente
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() =>
                                      handlePaymentStatusChange(summary.employee.id, "pagado", summary.totalAmount)
                                    }
                                    disabled={
                                      updatingPayment === summary.employee.id ||
                                      summary.daysWorked === 0 ||
                                      operationInProgress.current
                                    }
                                    className="text-xs px-2 py-1 h-7 bg-green-600 hover:bg-green-700"
                                  >
                                    {updatingPayment === summary.employee.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Pagar
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
