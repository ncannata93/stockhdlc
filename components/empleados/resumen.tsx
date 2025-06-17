"use client"

import { useState, useEffect, useRef } from "react"
import { parseISO, startOfYear, endOfYear, addWeeks, subWeeks, startOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Loader2,
  Calendar,
  BarChart3,
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
  // PRIMERO: Buscar si hay un registro EXACTO para esta semana
  const exactMatch = paidWeeks.find(
    (pw) => pw.employee_id === employeeId && pw.week_start === weekStart && pw.week_end === weekEnd,
  )

  if (exactMatch) {
    console.log(`🎯 Registro EXACTO encontrado para empleado ${employeeId}:`, exactMatch)
    return true
  }

  // SEGUNDO: Si no hay registro exacto, buscar solapamientos
  const overlap = paidWeeks.some((pw) => {
    if (pw.employee_id !== employeeId) return false
    if (pw.week_start === weekStart && pw.week_end === weekEnd) return false
    return weekStart <= pw.week_end && weekEnd >= pw.week_start
  })

  if (overlap) {
    console.log(`🔍 Solapamiento encontrado para empleado ${employeeId}`)
  }

  return overlap
}

interface EmpleadosResumenProps {
  onStatsChange?: () => void
}

export default function EmpleadosResumen({ onStatsChange }: EmpleadosResumenProps) {
  const { toast } = useToast()
  const { getEmployees, getAssignments, getPaidWeeks, updatePaymentStatus } = useEmployeeDB()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [yearlyAssignments, setYearlyAssignments] = useState<EmployeeAssignment[]>([])
  const [paidWeeks, setPaidWeeks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingYearly, setLoadingYearly] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState<number | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("todos")
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    return monday.toISOString().split("T")[0]
  })
  const [activeTab, setActiveTab] = useState("semanal")
  const [lastUpdate, setLastUpdate] = useState(Date.now())
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
    console.log("🔄 Cargando datos del resumen...")
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

      const paidWeeksData = await getPaidWeeks({})
      console.log("💰 Semanas pagadas cargadas:", paidWeeksData.length)
      setPaidWeeks(paidWeeksData)
      setLastUpdate(Date.now())
    } catch (error) {
      console.error("❌ Error cargando datos:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
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

  // FUNCIÓN MEJORADA: Cambiar estado de pago con mejor manejo de errores
  const handlePaymentStatusChange = async (employeeId: number, newStatus: "pendiente" | "pagado", amount: number) => {
    if (updatingPayment === employeeId) {
      console.log("⚠️ Ya hay una actualización en progreso para este empleado")
      return
    }

    console.log("🔄 INICIO handlePaymentStatusChange:", { employeeId, newStatus, amount, startDateStr, endDateStr })

    setUpdatingPayment(employeeId)
    try {
      const success = await updatePaymentStatus(
        employeeId,
        startDateStr,
        endDateStr,
        newStatus,
        amount,
        `Estado cambiado a ${newStatus} el ${new Date().toLocaleDateString()}`,
      )

      console.log("📊 Resultado updatePaymentStatus:", success)

      if (success) {
        toast({
          title: "✅ Estado actualizado",
          description: `Semana marcada como ${newStatus}`,
        })

        // Esperar un momento y recargar datos
        console.log("🔄 Recargando datos después del cambio...")
        setTimeout(async () => {
          await loadData(true)
          if (onStatsChange) {
            console.log("📊 Ejecutando callback onStatsChange...")
            onStatsChange()
          }
        }, 500)
      } else {
        console.error("❌ updatePaymentStatus retornó false")
        toast({
          title: "❌ Error",
          description: "No se pudo actualizar el estado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error en handlePaymentStatusChange:", error)
      toast({
        title: "❌ Error",
        description: "Error inesperado al actualizar",
        variant: "destructive",
      })
    } finally {
      setUpdatingPayment(null)
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
      const isPaid = hasWeekOverlapWithPaidWeeks(startDateStr, endDateStr, paidWeeks, employee.id)

      console.log(`💰 Estado final para ${employee.name}:`, {
        isPaid,
        totalAmount,
        daysWorked,
        weekRange: `${startDateStr} al ${endDateStr}`,
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
    if (reloadInProgress.current) return
    reloadInProgress.current = true
    setRefreshing(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await loadData(true)
      if (onStatsChange) onStatsChange()
    } catch (error) {
      console.error("❌ Error recargando datos:", error)
    } finally {
      setRefreshing(false)
      reloadInProgress.current = false
    }
  }

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
              <CardDescription className="text-sm">Gestión semanal de pagos y asignaciones</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reloadData}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles compactos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Navegación de semanas */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">📅 Semana</Label>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="px-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button variant="outline" size="sm" onClick={goToNextWeek} className="px-2">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrentWeek} className="px-2">
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filtro de empleado */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">👥 Empleado</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
                {safeFormatDate(startDateStr)} al {safeFormatDate(endDateStr)}
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="semanal" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Semanal
              </TabsTrigger>
              <TabsTrigger value="anual" className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                Anual
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
                    <Button onClick={goToCurrentWeek} variant="outline" size="sm">
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
                            {/* Empleado */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <div>
                                  <div className="font-medium">{summary.employee.name}</div>
                                  <div className="text-xs text-muted-foreground">{summary.employee.role}</div>
                                </div>
                              </div>
                            </TableCell>

                            {/* Días trabajados */}
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {summary.daysWorked}
                              </Badge>
                            </TableCell>

                            {/* Total */}
                            <TableCell className="text-center">
                              <div className="font-bold text-green-600">${summary.totalAmount.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">
                                ${summary.employee.daily_rate.toLocaleString()}/día
                              </div>
                            </TableCell>

                            {/* Hoteles */}
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

                            {/* Estado */}
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

                            {/* Acciones */}
                            <TableCell className="text-center">
                              <div className="flex gap-1 justify-center">
                                {summary.isPaid ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handlePaymentStatusChange(summary.employee.id, "pendiente", summary.totalAmount)
                                    }
                                    disabled={updatingPayment === summary.employee.id}
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
                                    disabled={updatingPayment === summary.employee.id || summary.daysWorked === 0}
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
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                          <span className="text-2xl font-bold text-green-600">
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
