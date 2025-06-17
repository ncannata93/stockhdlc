"use client"

import { useState, useEffect, useRef } from "react"
import { parseISO, startOfYear, endOfYear, addWeeks, subWeeks, startOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  User,
  DollarSign,
  Clock,
  RefreshCw,
} from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeeAssignment } from "@/lib/employee-types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateForDisplay } from "@/lib/date-utils"
import AccionesRapidas from "./acciones-rapidas"

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

const getHotelSolidColor = (hotelName: string) => {
  const colors: Record<string, string> = {
    Jaguel: "bg-red-500",
    Monaco: "bg-blue-500",
    Mallak: "bg-green-500",
    Argentina: "bg-purple-500",
    Falkner: "bg-yellow-500",
    Stromboli: "bg-pink-500",
    "San Miguel": "bg-indigo-500",
    Colores: "bg-orange-500",
    Puntarenas: "bg-teal-500",
    Tupe: "bg-cyan-500",
    Munich: "bg-amber-500",
    Tiburones: "bg-slate-500",
    Barlovento: "bg-emerald-500",
    Carama: "bg-violet-500",
  }
  return colors[hotelName] || "bg-gray-500"
}

const isDateInWeekRange = (date: string, weekStart: string, weekEnd: string): boolean => {
  return date >= weekStart && date <= weekEnd
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
      console.log(`🔍 SOLAPAMIENTO ENCONTRADO en Resumen para empleado ${employeeId}:`, {
        semana_calculada: `${weekStart} al ${weekEnd}`,
        semana_pagada: `${pw.week_start} al ${pw.week_end}`,
        solapamiento: overlap,
      })
    }

    return overlap
  })
}

interface EmpleadosResumenProps {
  onStatsChange?: () => void
}

export default function EmpleadosResumen({ onStatsChange }: EmpleadosResumenProps) {
  const { getEmployees, getAssignments, getPaidWeeks } = useEmployeeDB()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [yearlyAssignments, setYearlyAssignments] = useState<EmployeeAssignment[]>([])
  const [paidWeeks, setPaidWeeks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingYearly, setLoadingYearly] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("todos")
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    return monday.toISOString().split("T")[0]
  })
  const [activeTab, setActiveTab] = useState("semanal")
  // Agregar un timestamp para forzar re-renders
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  // Ref para evitar múltiples recargas simultáneas
  const reloadInProgress = useRef(false)

  const startDate = parseISO(selectedWeek)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)

  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = endDate.toISOString().split("T")[0]

  const currentYear = new Date().getFullYear()
  const yearStart = startOfYear(new Date(currentYear, 0, 1))
  const yearEnd = endOfYear(new Date(currentYear, 11, 31))

  const goToPreviousWeek = () => {
    const previousWeek = subWeeks(startDate, 1)
    setSelectedWeek(previousWeek.toISOString().split("T")[0])
  }

  const goToNextWeek = () => {
    const nextWeek = addWeeks(startDate, 1)
    setSelectedWeek(nextWeek.toISOString().split("T")[0])
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    setSelectedWeek(monday.toISOString().split("T")[0])
  }

  const loadData = async (forceRefresh = false) => {
    console.log("🔄 Cargando datos del resumen...", forceRefresh ? "(forzado)" : "")
    setLoading(true)
    try {
      const employeesData = await getEmployees()
      console.log("📊 Empleados cargados:", employeesData.length)
      setEmployees(employeesData)

      const allAssignmentsData = await getAssignments({})
      const filteredAssignments = allAssignmentsData.filter((assignment) => {
        const assignmentDate = assignment.assignment_date
        return isDateInWeekRange(assignmentDate, startDateStr, endDateStr)
      })

      let finalAssignments = filteredAssignments
      if (selectedEmployee !== "todos") {
        finalAssignments = filteredAssignments.filter((a) => a.employee_id === Number.parseInt(selectedEmployee))
      }

      console.log("📊 Asignaciones filtradas:", finalAssignments.length)
      setAssignments(finalAssignments)

      // Siempre recargar las semanas pagadas para obtener el estado más reciente
      const paidWeeksData = await getPaidWeeks({})
      console.log("💰 Semanas pagadas cargadas:", paidWeeksData.length)

      // DEBUGGING DETALLADO DE SEMANAS PAGADAS
      console.log("🔍 DEBUGGING - Todas las semanas pagadas en la BD:")
      paidWeeksData.forEach((pw) => {
        console.log(`  📅 Empleado ${pw.employee_name} (ID: ${pw.employee_id}):`, {
          week_start: pw.week_start,
          week_end: pw.week_end,
          amount: pw.amount,
          paid_date: pw.paid_date,
        })
      })

      console.log("🔍 DEBUGGING RESUMEN - Semana actual que estamos verificando:")
      console.log(`  📅 Rango: ${startDateStr} al ${endDateStr}`)
      console.log(
        `  📊 Empleados con asignaciones en esta semana:`,
        finalAssignments.map((a) => a.employee_name).filter((name, index, arr) => arr.indexOf(name) === index),
      )

      setPaidWeeks(paidWeeksData)

      // Actualizar timestamp para forzar re-render
      setLastUpdate(Date.now())
    } catch (error) {
      console.error("❌ Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedEmployee, selectedWeek, startDateStr, endDateStr])

  useEffect(() => {
    const loadYearlyData = async () => {
      if (activeTab !== "anual") return

      setLoadingYearly(true)
      try {
        const yearStartStr = yearStart.toISOString().split("T")[0]
        const yearEndStr = yearEnd.toISOString().split("T")[0]

        let yearlyAssignmentsData = await getAssignments({
          start_date: yearStartStr,
          end_date: yearEndStr,
        })

        if (selectedEmployee !== "todos") {
          yearlyAssignmentsData = yearlyAssignmentsData.filter(
            (a) => a.employee_id === Number.parseInt(selectedEmployee),
          )
        }

        setYearlyAssignments(yearlyAssignmentsData)
      } catch (error) {
        console.error("❌ Error cargando datos anuales:", error)
      } finally {
        setLoadingYearly(false)
      }
    }

    loadYearlyData()
  }, [activeTab, selectedEmployee, employees])

  const safeFormatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ""
    try {
      if (typeof dateString === "string" && !/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return ""
      }
      const date = parseISO(dateString)
      if (isNaN(date.getTime())) {
        return ""
      }
      return formatDateForDisplay(date)
    } catch (e) {
      return ""
    }
  }

  const employeeSummary = employees
    .map((employee) => {
      const employeeAssignments = assignments.filter((a) => a.employee_id === employee.id)

      const assignmentsByDate = employeeAssignments.reduce(
        (acc, assignment) => {
          const date = assignment.assignment_date
          if (!acc[date]) {
            acc[date] = []
          }
          acc[date].push(assignment)
          return acc
        },
        {} as Record<string, EmployeeAssignment[]>,
      )

      const daysWorked = Object.keys(assignmentsByDate).length
      let totalAmount = 0

      const assignmentDetails = Object.entries(assignmentsByDate).map(([date, dayAssignments]) => {
        const totalForDay = dayAssignments.reduce((sum, assignment) => sum + assignment.daily_rate_used, 0)
        return {
          date,
          assignments: dayAssignments,
          totalForDay,
        }
      })

      totalAmount = assignmentDetails.reduce((sum, detail) => sum + detail.totalForDay, 0)

      const hotels = [...new Set(employeeAssignments.map((a) => a.hotel_name))]

      // NUEVA LÓGICA: Verificar si la semana tiene solapamiento con semanas pagadas
      const isPaid = hasWeekOverlapWithPaidWeeks(startDateStr, endDateStr, paidWeeks, employee.id)

      console.log(`💰 RESUMEN - Estado final para ${employee.name} (${lastUpdate}):`, {
        isPaid,
        totalAmount,
        daysWorked,
        weekRange: `${startDateStr} al ${endDateStr}`,
        semanasPagadasDelEmpleado: paidWeeks
          .filter((pw) => pw.employee_id === employee.id)
          .map((pw) => `${pw.week_start} al ${pw.week_end}`),
      })

      return {
        employee,
        daysWorked,
        totalAmount,
        hotels,
        assignmentDetails,
        assignments: employeeAssignments,
        isPaid,
      }
    })
    .filter((summary) => {
      if (selectedEmployee !== "todos") {
        return summary.employee.id === Number.parseInt(selectedEmployee)
      }
      return summary.daysWorked > 0
    })

  const hotelYearlyTotals = yearlyAssignments.reduce(
    (acc, assignment) => {
      const hotelName = assignment.hotel_name
      if (!acc[hotelName]) {
        acc[hotelName] = {
          count: 0,
          amount: 0,
          employees: new Set(),
        }
      }

      const savedDailyRate = assignment.daily_rate_used || 0
      acc[hotelName].count++
      acc[hotelName].amount += savedDailyRate
      acc[hotelName].employees.add(assignment.employee_id)

      return acc
    },
    {} as Record<string, { count: number; amount: number; employees: Set<number> }>,
  )

  const sortedHotels = Object.entries(hotelYearlyTotals)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([hotel, data]) => ({
      name: hotel,
      count: data.count,
      amount: data.amount,
      employeeCount: data.employees.size,
    }))

  const maxAmount = sortedHotels.length > 0 ? sortedHotels[0].amount : 0

  const reloadData = async () => {
    // Evitar múltiples recargas simultáneas
    if (reloadInProgress.current) {
      console.log("⚠️ Recarga ya en progreso, ignorando...")
      return
    }

    reloadInProgress.current = true
    console.log("🔄 INICIO - Recargando datos después de cambio de pago...")
    setRefreshing(true)

    try {
      // Esperar un momento para que la BD procese los cambios
      console.log("⏳ Esperando 2 segundos para sincronización...")
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Limpiar estados antes de recargar
      console.log("🧹 Limpiando estados...")
      setPaidWeeks([])
      setAssignments([])

      // Recargar empleados
      const employeesData = await getEmployees()
      console.log("📊 Empleados recargados:", employeesData.length)
      setEmployees(employeesData)

      // Recargar asignaciones
      const allAssignmentsData = await getAssignments({})
      const filteredAssignments = allAssignmentsData.filter((assignment) => {
        const assignmentDate = assignment.assignment_date
        return isDateInWeekRange(assignmentDate, startDateStr, endDateStr)
      })

      let finalAssignments = filteredAssignments
      if (selectedEmployee !== "todos") {
        finalAssignments = filteredAssignments.filter((a) => a.employee_id === Number.parseInt(selectedEmployee))
      }

      console.log("📊 Asignaciones recargadas:", finalAssignments.length)
      setAssignments(finalAssignments)

      // CRÍTICO: Recargar semanas pagadas con logging detallado
      console.log("💰 RECARGANDO semanas pagadas...")
      const paidWeeksData = await getPaidWeeks({})
      console.log("💰 Semanas pagadas RECARGADAS:", paidWeeksData.length)

      // Log detallado de las semanas pagadas
      console.log("🔍 DESPUÉS DE RECARGAR - Semanas pagadas por empleado:")
      const employeesPaidWeeks = {}
      paidWeeksData.forEach((pw) => {
        if (!employeesPaidWeeks[pw.employee_id]) {
          employeesPaidWeeks[pw.employee_id] = []
        }
        employeesPaidWeeks[pw.employee_id].push(`${pw.week_start} al ${pw.week_end}`)
      })

      Object.entries(employeesPaidWeeks).forEach(([empId, weeks]) => {
        const emp = employeesData.find((e) => e.id.toString() === empId)
        console.log(`  👤 ${emp?.name || "ID:" + empId}: ${weeks.join(", ")}`)
      })

      setPaidWeeks(paidWeeksData)

      // Forzar actualización del timestamp
      const newTimestamp = Date.now()
      console.log("🕐 Actualizando timestamp:", newTimestamp)
      setLastUpdate(newTimestamp)

      console.log("✅ ÉXITO - Datos recargados completamente")

      // Notificar al componente padre
      if (onStatsChange) {
        console.log("📊 Ejecutando callback onStatsChange...")
        onStatsChange()
      }
    } catch (error) {
      console.error("❌ Error recargando datos:", error)
    } finally {
      setRefreshing(false)
      reloadInProgress.current = false
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
                Resumen de Empleados
              </CardTitle>
              <CardDescription className="text-sm">Gestión semanal de pagos y asignaciones</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reloadData}
              disabled={refreshing || reloadInProgress.current}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Navegación de semanas - Móvil optimizado */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">📅 Navegación de Semanas</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="px-2 sm:px-3">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button variant="outline" size="sm" onClick={goToNextWeek} className="px-2 sm:px-3">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek} className="px-2 sm:px-3">
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded-md border border-blue-200">
              📍 <strong>Semana:</strong> {safeFormatDate(startDateStr)} al {safeFormatDate(endDateStr)}
            </div>
          </div>

          {/* Filtro de empleado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">👥 Filtrar por Empleado</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Todos los empleados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">🏢 Todos los empleados</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    👤 {employee.name} - {employee.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="semanal" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Resumen </span>Semanal
              </TabsTrigger>
              <TabsTrigger value="anual" className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Resumen </span>Anual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="semanal" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando información...</p>
                  </div>
                </div>
              ) : employeeSummary.length === 0 ? (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">No hay actividad</h3>
                    <p className="text-yellow-700 text-sm mb-4">No se encontraron asignaciones para esta semana</p>
                    <Button onClick={goToCurrentWeek} variant="outline" size="sm">
                      📍 Ir a la semana actual
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {employeeSummary.map((summary) => (
                    <Card key={`${summary.employee.id}-${lastUpdate}`} className="overflow-hidden">
                      {/* Header del empleado - Móvil optimizado */}
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                        <div className="space-y-3">
                          {/* Nombre y estado */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-blue-600" />
                              <div>
                                <h3 className="font-semibold text-lg">{summary.employee.name}</h3>
                                <p className="text-sm text-muted-foreground">{summary.employee.role}</p>
                              </div>
                            </div>
                            <Badge
                              variant={summary.isPaid ? "default" : "outline"}
                              className={`text-xs ${
                                summary.isPaid
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
                              }`}
                            >
                              {summary.isPaid ? "✅ Pagada" : "⏰ Pendiente"}
                            </Badge>
                          </div>

                          {/* Estadísticas principales - Móvil optimizado */}
                          <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="bg-white p-2 sm:p-3 rounded-lg border shadow-sm">
                              <div className="flex flex-col items-center text-center">
                                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mb-1" />
                                <div className="text-base sm:text-lg font-bold text-green-600 leading-tight">
                                  ${summary.totalAmount.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">Total</div>
                              </div>
                            </div>
                            <div className="bg-white p-2 sm:p-3 rounded-lg border shadow-sm">
                              <div className="flex flex-col items-center text-center">
                                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mb-1" />
                                <div className="text-base sm:text-lg font-bold text-blue-600 leading-tight">
                                  {summary.daysWorked}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">Días</div>
                              </div>
                            </div>
                            <div className="bg-white p-2 sm:p-3 rounded-lg border shadow-sm">
                              <div className="flex flex-col items-center text-center">
                                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mb-1" />
                                <div className="text-sm sm:text-base font-bold text-gray-600 leading-tight">
                                  ${summary.employee.daily_rate.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">Tarifa</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-4">
                        {/* Hoteles visitados */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">🏨 Hoteles visitados</h4>
                          <div className="flex flex-wrap gap-2">
                            {summary.hotels.map((hotel) => (
                              <Badge key={hotel} className={`${getHotelColor(hotel)} text-xs`}>
                                {hotel}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Detalle por días - Vista móvil */}
                        <div>
                          <h4 className="text-sm font-medium mb-3">📊 Detalle por días</h4>
                          <div className="space-y-3">
                            {summary.assignmentDetails.map((detail) => (
                              <div key={detail.date} className="bg-gray-50 rounded-lg p-3 border">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium">📅 {safeFormatDate(detail.date)}</span>
                                  <span className="text-lg font-bold text-green-600">
                                    ${detail.totalForDay.toLocaleString()}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {detail.assignments.map((assignment, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                      <Badge className={`${getHotelColor(assignment.hotel_name)} text-xs`}>
                                        🏨 {assignment.hotel_name}
                                      </Badge>
                                      <span className="font-medium text-green-600">
                                        ${assignment.daily_rate_used.toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Acciones rápidas */}
                        <div className="pt-4 border-t">
                          <AccionesRapidas
                            employee={summary.employee}
                            totalAmount={summary.totalAmount}
                            daysWorked={summary.daysWorked}
                            weekStart={startDateStr}
                            weekEnd={endDateStr}
                            isPaid={summary.isPaid}
                            onPaymentChange={reloadData}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="anual">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5" />📊 Gastos por Hotel {currentYear}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    💰 Distribución de gastos por hotel durante el año
                    {selectedEmployee !== "todos" &&
                      ` para ${employees.find((e) => e.id.toString() === selectedEmployee)?.name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingYearly ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Cargando datos anuales...</p>
                      </div>
                    </div>
                  ) : sortedHotels.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <div className="mb-2 text-lg font-semibold">
                        No hay datos para mostrar en el año {currentYear}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {sortedHotels.map((hotel, index) => (
                          <div key={hotel.name} className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                                <div>
                                  <Badge className={`${getHotelColor(hotel.name)} text-sm`}>🏨 {hotel.name}</Badge>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    📊 {hotel.count} asignaciones • 👥 {hotel.employeeCount} empleados
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-green-600">${hotel.amount.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">
                                  {((hotel.amount / sortedHotels.reduce((sum, h) => sum + h.amount, 0)) * 100).toFixed(
                                    1,
                                  )}
                                  %
                                </div>
                              </div>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getHotelSolidColor(hotel.name)} rounded-full transition-all duration-500`}
                                style={{ width: `${maxAmount > 0 ? (hotel.amount / maxAmount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-lg">📊 Total Anual {currentYear}</span>
                            <div className="text-sm text-muted-foreground mt-1">
                              📈 {sortedHotels.reduce((sum, hotel) => sum + hotel.count, 0)} asignaciones totales
                            </div>
                          </div>
                          <span className="text-2xl sm:text-3xl font-bold text-green-600">
                            ${sortedHotels.reduce((sum, hotel) => sum + hotel.amount, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
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
