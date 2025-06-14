"use client"

import { useState, useEffect } from "react"
import { parseISO, startOfYear, endOfYear, addWeeks, subWeeks, startOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Calendar, BarChart3, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
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

export default function EmpleadosResumen() {
  const { getEmployees, getAssignments, getPaidWeeks } = useEmployeeDB()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [yearlyAssignments, setYearlyAssignments] = useState<EmployeeAssignment[]>([])
  const [paidWeeks, setPaidWeeks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingYearly, setLoadingYearly] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("todos")
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    return monday.toISOString().split("T")[0]
  })
  const [activeTab, setActiveTab] = useState("semanal")

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const employeesData = await getEmployees()
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

        setAssignments(finalAssignments)

        const paidWeeksData = await getPaidWeeks({})
        setPaidWeeks(paidWeeksData)
      } catch (error) {
        // Error silencioso
      } finally {
        setLoading(false)
      }
    }

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
        // Error silencioso
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

      // Verificar si la semana está pagada
      const isPaid = paidWeeks.some(
        (pw) => pw.employee_id === employee.id && pw.week_start === startDateStr && pw.week_end === endDateStr,
      )

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
    try {
      const paidWeeksData = await getPaidWeeks({})
      setPaidWeeks(paidWeeksData)
    } catch (error) {
      // Error silencioso
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-6 w-6" />
                Resumen de Empleados
              </CardTitle>
              <CardDescription>Gestión semanal de pagos y asignaciones</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="w-full">
              <Label htmlFor="week-select" className="text-base font-medium">
                📅 Navegación de Semanas
              </Label>
              <div className="flex items-center gap-1 mt-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="px-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                <Input
                  id="week-select"
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button variant="outline" size="sm" onClick={goToNextWeek} className="px-2">
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrentWeek} className="px-2">
                  <span className="hidden sm:inline">Hoy</span>
                  <CalendarDays className="h-4 w-4 sm:hidden" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                📍 <strong>Semana:</strong> {safeFormatDate(startDateStr)} al {safeFormatDate(endDateStr)}
              </div>
            </div>

            <div className="w-full">
              <Label htmlFor="employee-select" className="text-base font-medium">
                👥 Filtrar por Empleado
              </Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee-select" className="mt-2 text-sm">
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
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="semanal" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Resumen Semanal
              </TabsTrigger>
              <TabsTrigger value="anual" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Resumen Anual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="semanal">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando información de la semana...</p>
                  </div>
                </div>
              ) : employeeSummary.length === 0 ? (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="text-center py-12">
                    <CalendarDays className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">No hay actividad en esta semana</h3>
                    <div className="text-yellow-700 space-y-1">
                      <div>
                        📅 <strong>Semana:</strong> {safeFormatDate(startDateStr)} - {safeFormatDate(endDateStr)}
                      </div>
                      <div>
                        👤 <strong>Empleado:</strong>{" "}
                        {selectedEmployee === "todos"
                          ? "Todos"
                          : employees.find((e) => e.id.toString() === selectedEmployee)?.name}
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button onClick={goToCurrentWeek} variant="outline">
                        📍 Ir a la semana actual
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {employeeSummary.map((summary) => (
                    <Card key={summary.employee.id} className="overflow-hidden shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-3 text-xl">
                              👤 {summary.employee.name}
                              <Badge
                                variant={summary.isPaid ? "default" : "outline"}
                                className={`ml-2 px-3 py-1 ${
                                  summary.isPaid
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                }`}
                              >
                                {summary.isPaid ? "✅ Semana Pagada" : "⏰ Pendiente"}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 text-base">
                              🏷️ {summary.employee.role} • 💰 Tarifa actual: $
                              {summary.employee.daily_rate.toLocaleString()}
                            </CardDescription>
                          </div>
                          <div className="text-right bg-white p-4 rounded-lg border shadow-sm">
                            <div className="text-sm text-muted-foreground">💵 Total</div>
                            <div className="text-3xl font-bold text-green-600">
                              ${summary.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Calendar className="h-8 w-8 text-blue-600" />
                            <div>
                              <div className="text-sm font-medium text-blue-800">📅 Días trabajados</div>
                              <div className="text-2xl font-bold text-blue-900">{summary.daysWorked}</div>
                            </div>
                          </div>

                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="text-sm font-medium mb-3 text-purple-800">🏨 Hoteles visitados</div>
                            <div className="flex flex-wrap gap-2">
                              {summary.hotels.map((hotel) => (
                                <Badge key={hotel} className={`${getHotelColor(hotel)} text-sm px-3 py-1`}>
                                  🏨 {hotel}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <div className="text-base font-medium mb-4">📊 Detalle de asignaciones por día</div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-white">
                                  <TableHead className="font-semibold">📅 Fecha</TableHead>
                                  <TableHead className="font-semibold">🏨 Hoteles y Tarifas</TableHead>
                                  <TableHead className="font-semibold">💰 Total del Día</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {summary.assignmentDetails.map((detail) => (
                                  <TableRow key={detail.date} className="hover:bg-white">
                                    <TableCell className="font-medium">📅 {safeFormatDate(detail.date)}</TableCell>
                                    <TableCell>
                                      <div className="space-y-2">
                                        {detail.assignments.map((assignment, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center justify-between p-2 bg-white rounded border"
                                          >
                                            <Badge
                                              className={`${getHotelColor(assignment.hotel_name)} font-medium`}
                                              variant="outline"
                                            >
                                              🏨 {assignment.hotel_name}
                                            </Badge>
                                            <span className="font-bold text-green-600">
                                              ${assignment.daily_rate_used.toLocaleString()}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-xl font-bold text-green-600 bg-green-50 p-2 rounded text-center">
                                        ${detail.totalForDay.toLocaleString()}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                      <CardContent className="bg-gray-50 border-t p-6">
                        <AccionesRapidas
                          employee={summary.employee}
                          totalAmount={summary.totalAmount}
                          daysWorked={summary.daysWorked}
                          weekStart={startDateStr}
                          weekEnd={endDateStr}
                          isPaid={summary.isPaid}
                          onPaymentChange={reloadData}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="anual">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-6 w-6" />📊 Gastos por Hotel en {currentYear}
                  </CardTitle>
                  <CardDescription className="text-base">
                    💰 Distribución de gastos por hotel durante el año actual
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
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {sortedHotels.map((hotel, index) => (
                          <div key={hotel.name} className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-gray-500">#{index + 1}</div>
                                <div>
                                  <Badge
                                    className={`${getHotelColor(hotel.name)} text-base px-4 py-2`}
                                    variant="outline"
                                  >
                                    🏨 {hotel.name}
                                  </Badge>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    📊 {hotel.count} asignaciones • 👥 {hotel.employeeCount} empleados
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  ${hotel.amount.toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  💰{" "}
                                  {((hotel.amount / sortedHotels.reduce((sum, h) => sum + h.amount, 0)) * 100).toFixed(
                                    1,
                                  )}
                                  % del total
                                </div>
                              </div>
                            </div>
                            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getHotelSolidColor(hotel.name)} rounded-full transition-all duration-500`}
                                style={{ width: `${maxAmount > 0 ? (hotel.amount / maxAmount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-xl">📊 Total Anual {currentYear}</span>
                            <div className="text-sm text-muted-foreground mt-1">
                              📈 {sortedHotels.reduce((sum, hotel) => sum + hotel.count, 0)} asignaciones totales
                            </div>
                          </div>
                          <span className="text-4xl font-bold text-green-600">
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
