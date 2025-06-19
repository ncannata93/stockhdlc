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
  BarChart3,
  Building2,
} from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeeAssignment } from "@/lib/employee-types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateForDisplay } from "@/lib/date-utils"
import { useToast } from "@/hooks/use-toast"
import { getWeekRange } from "@/lib/week-utils"
import { createClient } from "@supabase/supabase-js"

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

// 🎯 FUNCIÓN SÚPER SIMPLE - IGUAL QUE SERVICIOS
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

interface EmpleadosResumenProps {
  onStatsChange?: () => void
}

export default function EmpleadosResumen({ onStatsChange }: EmpleadosResumenProps) {
  const { toast } = useToast()
  const { getEmployees, getAssignments, getPaidWeeks } = useEmployeeDB()

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
  const [annualData, setAnnualData] = useState<any[]>([])
  const [loadingAnnual, setLoadingAnnual] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState("semanal")

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
        console.log(`📊 Semanas pagadas cargadas:`, paidWeeksData.length)
        return true
      } catch (error) {
        console.error("❌ Error cargando datos:", error)
        return false
      }
    },
    [getEmployees, getAssignments, getPaidWeeks],
  )

  const loadAnnualData = useCallback(
    async (year: number, employeeFilter: string) => {
      try {
        console.log(`🔄 Cargando datos anuales para año: ${year}, empleado: ${employeeFilter}`)

        const startDate = `${year}-01-01`
        const endDate = `${year}-12-31`

        const [employeesData, allAssignmentsData, paidWeeksData] = await Promise.all([
          getEmployees(),
          getAssignments({}),
          getPaidWeeks({}),
        ])

        // Filtrar asignaciones del año
        const yearAssignments = allAssignmentsData.filter((assignment) => {
          return assignment.assignment_date >= startDate && assignment.assignment_date <= endDate
        })

        let finalAssignments = yearAssignments
        if (employeeFilter !== "todos") {
          const employeeId = Number.parseInt(employeeFilter)
          if (!isNaN(employeeId)) {
            finalAssignments = yearAssignments.filter((a) => a.employee_id === employeeId)
          }
        }

        // 🏨 CALCULAR RESUMEN ANUAL POR HOTEL
        const hotelSummary = finalAssignments.reduce(
          (acc, assignment) => {
            const hotelName = assignment.hotel_name
            if (!acc[hotelName]) {
              acc[hotelName] = {
                hotelName,
                totalDays: 0,
                totalAmount: 0,
                employees: new Set(),
                assignments: [],
                monthlyData: {},
              }
            }

            acc[hotelName].totalDays += 1
            acc[hotelName].totalAmount += assignment.daily_rate_used || 0
            acc[hotelName].employees.add(assignment.employee_id)
            acc[hotelName].assignments.push(assignment)

            // Agrupar por mes
            const month = assignment.assignment_date.substring(0, 7) // YYYY-MM
            if (!acc[hotelName].monthlyData[month]) {
              acc[hotelName].monthlyData[month] = { days: 0, amount: 0 }
            }
            acc[hotelName].monthlyData[month].days += 1
            acc[hotelName].monthlyData[month].amount += assignment.daily_rate_used || 0

            return acc
          },
          {} as Record<string, any>,
        )

        const annualHotelData = Object.values(hotelSummary).map((hotel: any) => ({
          ...hotel,
          uniqueEmployees: hotel.employees.size,
          averagePerDay: hotel.totalDays > 0 ? hotel.totalAmount / hotel.totalDays : 0,
        }))

        // Ordenar por total amount descendente
        annualHotelData.sort((a, b) => b.totalAmount - a.totalAmount)

        setAnnualData(annualHotelData)
        console.log(`✅ Datos anuales por hotel cargados: ${annualHotelData.length} hoteles`)
        return true
      } catch (error) {
        console.error("❌ Error cargando datos anuales:", error)
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

  // Cargar datos anuales cuando cambia el año o empleado
  useEffect(() => {
    setLoadingAnnual(true)
    loadAnnualData(selectedYear, persistentEmployee).finally(() => {
      setLoadingAnnual(false)
    })
  }, [selectedYear, persistentEmployee, loadAnnualData])

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

  // 🎯 FUNCIÓN SÚPER SIMPLE CON LOGS DETALLADOS
  const handlePaymentStatusChange = useCallback(
    async (employeeId: number, newStatus: "pendiente" | "pagado", amount: number) => {
      console.log("🚀 === INICIO handlePaymentStatusChange ===")
      console.log("📋 Parámetros:", { employeeId, newStatus, amount })
      console.log("🔒 updatingPayment actual:", updatingPayment)

      if (updatingPayment === employeeId) {
        console.log("⚠️ Operación ya en progreso para empleado", employeeId)
        return
      }

      const employeeName = employees.find((e) => e.id === employeeId)?.name || `ID-${employeeId}`
      console.log("👤 Empleado encontrado:", employeeName)

      setUpdatingPayment(employeeId)
      console.log("🔄 Estado updatingPayment cambiado a:", employeeId)

      try {
        console.log(
          `🔄 ${newStatus === "pagado" ? "Marcando como pagado" : "Marcando como pendiente"} para ${employeeName}`,
        )

        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("No se pudo conectar a Supabase")
        }
        console.log("✅ Cliente Supabase obtenido")

        // Calcular fechas de la semana actual
        const { weekStart: startDateStr, weekEnd: endDateStr } = getWeekRange(persistentWeek)
        console.log("📅 Fechas calculadas:", { startDateStr, endDateStr, persistentWeek })

        // Preparar datos para upsert
        const upsertData = {
          employee_id: employeeId,
          week_start: startDateStr,
          week_end: endDateStr,
          amount: newStatus === "pagado" ? amount : 0,
          paid_date: new Date().toISOString().split("T")[0],
          notes: `Estado cambiado a ${newStatus} el ${new Date().toLocaleDateString()}`,
        }
        console.log("📝 Datos para upsert:", upsertData)

        // 🎯 LÓGICA SÚPER SIMPLE - IGUAL QUE SERVICIOS
        console.log("🔄 Ejecutando upsert en Supabase...")
        const { data, error } = await supabase.from("paid_weeks").upsert(upsertData, {
          onConflict: "employee_id,week_start,week_end",
        })

        console.log("📊 Resultado de Supabase:", { data, error })

        if (error) {
          console.error("❌ Error en Supabase:", error)
          throw error
        }

        console.log("✅ Upsert exitoso")

        toast({
          title: "✅ Estado actualizado",
          description: `${employeeName}: Semana marcada como ${newStatus}`,
        })

        console.log("🔄 Recargando datos...")
        // Recargar datos
        await loadWeekData(persistentWeek, persistentEmployee)

        if (onStatsChange) {
          console.log("📊 Ejecutando onStatsChange...")
          onStatsChange()
        }

        console.log(`✅ ${employeeName} marcado como ${newStatus} exitosamente`)
      } catch (error) {
        console.error(`❌ Error en handlePaymentStatusChange:`, error)
        toast({
          title: "❌ Error",
          description: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
          variant: "destructive",
        })
      } finally {
        console.log("🔄 Limpiando estado updatingPayment...")
        setUpdatingPayment(null)
        console.log("🏁 === FIN handlePaymentStatusChange ===")
      }
    },
    [employees, loadWeekData, persistentWeek, persistentEmployee, onStatsChange, toast, updatingPayment],
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

  // Usar getWeekRange para calcular las fechas de la semana
  const { weekStart: startDateStr, weekEnd: endDateStr } = getWeekRange(persistentWeek)

  // 📊 CALCULAR RESUMEN DE EMPLEADOS - 🔒 USANDO TARIFAS HISTÓRICAS
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
          // 🔒 CRÍTICO: Usar daily_rate_used (tarifa histórica) NO employee.daily_rate (tarifa actual)
          const totalForDay = dayAssignments.reduce((sum, assignment) => {
            const historicalRate = assignment.daily_rate_used || 0
            return sum + historicalRate
          }, 0)
          return { date, assignments: dayAssignments, totalForDay }
        })

        // 🔒 TOTAL BASADO EN TARIFAS HISTÓRICAS
        const totalAmount = assignmentDetails.reduce((sum, detail) => sum + detail.totalForDay, 0)

        // 📊 CALCULAR TARIFA PROMEDIO HISTÓRICA PARA MOSTRAR
        const totalHistoricalRates = employeeAssignments.reduce(
          (sum, assignment) => sum + (assignment.daily_rate_used || 0),
          0,
        )
        const averageHistoricalRate =
          employeeAssignments.length > 0 ? totalHistoricalRates / employeeAssignments.length : employee.daily_rate

        const hotels = [...new Set(employeeAssignments.map((a) => a.hotel_name))]

        // 🎯 VERIFICACIÓN SÚPER SIMPLE CON LOGS
        console.log(`🔍 Verificando pago para ${employee.name} (ID: ${employee.id})`)
        console.log(`📅 Semana buscada EXACTA: ${startDateStr} - ${endDateStr}`)

        // Buscar registro EXACTO de la semana (no solapamientos)
        const exactRecord = paidWeeks.find((pw) => {
          const paidStart = new Date(pw.week_start).toISOString().split("T")[0]
          const paidEnd = new Date(pw.week_end).toISOString().split("T")[0]
          const isEmployee = pw.employee_id === employee.id
          const isExactWeek = paidStart === startDateStr && paidEnd === endDateStr

          if (isEmployee && isExactWeek) {
            console.log(
              `📊 Registro EXACTO encontrado para ${employee.name}: ${paidStart} - ${paidEnd}, Amount: ${pw.amount}`,
            )
          }

          return isEmployee && isExactWeek
        })

        const isPaid = exactRecord ? Number(exactRecord.amount) > 0 : false

        console.log(
          `${isPaid ? "✅" : "❌"} ${employee.name}: ${isPaid ? "PAGADO" : "PENDIENTE"} (Registro exacto: ${exactRecord ? `Amount: ${exactRecord.amount}` : "No encontrado"})`,
        )

        return {
          employee,
          daysWorked,
          totalAmount,
          averageHistoricalRate,
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
                <div className="text-xs text-gray-500 mt-1">📦 Semana persistente: {persistentWeek}</div>
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="semanal" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Vista Semanal
              </TabsTrigger>
              <TabsTrigger value="anual" className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                Vista Anual por Hotel
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
                                ${Math.round(summary.averageHistoricalRate).toLocaleString()}/día histórico
                                {summary.averageHistoricalRate !== summary.employee.daily_rate && (
                                  <div className="text-xs text-orange-600">
                                    (Actual: ${summary.employee.daily_rate.toLocaleString()})
                                  </div>
                                )}
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
                              <Button
                                variant={summary.isPaid ? "outline" : "default"}
                                size="sm"
                                onClick={() => {
                                  console.log("🖱️ CLICK EN BOTÓN:", {
                                    employeeId: summary.employee.id,
                                    employeeName: summary.employee.name,
                                    currentStatus: summary.isPaid ? "pagado" : "pendiente",
                                    newStatus: summary.isPaid ? "pendiente" : "pagado",
                                    amount: summary.totalAmount,
                                  })
                                  handlePaymentStatusChange(
                                    summary.employee.id,
                                    summary.isPaid ? "pendiente" : "pagado",
                                    summary.totalAmount,
                                  )
                                }}
                                disabled={updatingPayment === summary.employee.id}
                                className={`text-xs px-3 py-1 h-8 ${
                                  summary.isPaid
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                              >
                                {updatingPayment === summary.employee.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : summary.isPaid ? (
                                  "✅ Pagado"
                                ) : (
                                  "💰 Pagar"
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="anual" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Resumen Anual por Hotel - {selectedYear}
                      </CardTitle>
                      <CardDescription>Total de actividad por hotel durante el año</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingAnnual ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : annualData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No hay datos para el año {selectedYear}</p>
                      <p className="text-sm">Selecciona un año diferente o verifica las asignaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Resumen general */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-700">
                              {annualData.reduce((sum, hotel) => sum + hotel.totalDays, 0)}
                            </div>
                            <div className="text-sm text-blue-600">Total Días Trabajados</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-700">
                              ${annualData.reduce((sum, hotel) => sum + hotel.totalAmount, 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-green-600">Total Generado</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-purple-50 border-purple-200">
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-purple-700">{annualData.length}</div>
                            <div className="text-sm text-purple-600">Hoteles Activos</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Tabla de hoteles */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Hotel</TableHead>
                            <TableHead className="text-center">Días Trabajados</TableHead>
                            <TableHead className="text-center">Total Generado</TableHead>
                            <TableHead className="text-center">Empleados</TableHead>
                            <TableHead className="text-center">Promedio/Día</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {annualData.map((hotel) => (
                            <TableRow key={hotel.hotelName}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <div className="font-medium">{hotel.hotelName}</div>
                                    <Badge className={`${getHotelColor(hotel.hotelName)} text-xs mt-1`}>
                                      {hotel.hotelName}
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {hotel.totalDays}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="font-bold text-green-600">${hotel.totalAmount.toLocaleString()}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  {hotel.uniqueEmployees}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="text-sm font-medium">
                                  ${Math.round(hotel.averagePerDay).toLocaleString()}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
