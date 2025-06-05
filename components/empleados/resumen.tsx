"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, parseISO, startOfYear, endOfYear, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, BarChart3, AlertTriangle } from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeeAssignment, EmployeePayment } from "@/lib/employee-types"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Función para obtener color del hotel
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

// Función para obtener color sólido del hotel para gráficos
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

export default function EmpleadosResumen() {
  const { getEmployees, getAssignments, getPayments, savePayment, deletePayment } = useEmployeeDB()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [yearlyAssignments, setYearlyAssignments] = useState<EmployeeAssignment[]>([])
  const [payments, setPayments] = useState<EmployeePayment[]>([])
  const [allPayments, setAllPayments] = useState<EmployeePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingYearly, setLoadingYearly] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("todos")
  const [selectedWeek, setSelectedWeek] = useState<string>(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
  )
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [activeTab, setActiveTab] = useState("semanal")

  // Calcular fechas de inicio y fin de la semana seleccionada
  const startDate = parseISO(selectedWeek)
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 })

  // Fechas para el año actual
  const currentYear = new Date().getFullYear()
  const yearStart = startOfYear(new Date(currentYear, 0, 1))
  const yearEnd = endOfYear(new Date(currentYear, 11, 31))

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        console.log("Cargando empleados...")
        const employeesData = await getEmployees()
        console.log("Empleados cargados:", employeesData.length)
        setEmployees(employeesData)

        // Cargar todos los pagos para verificar pendientes
        console.log("Cargando todos los pagos...")
        const allPaymentsData = await getPayments({})
        console.log("Pagos cargados:", allPaymentsData.length)
        setAllPayments(allPaymentsData)

        // Cargar asignaciones para la semana seleccionada
        const startDateStr = format(startDate, "yyyy-MM-dd")
        const endDateStr = format(endDate, "yyyy-MM-dd")
        console.log("Cargando asignaciones para semana:", startDateStr, "a", endDateStr)

        let assignmentsData = await getAssignments({
          start_date: startDateStr,
          end_date: endDateStr,
        })
        console.log("Asignaciones semanales cargadas:", assignmentsData.length)

        // Filtrar por empleado si es necesario
        if (selectedEmployee !== "todos") {
          assignmentsData = assignmentsData.filter((a) => a.employee_id === Number.parseInt(selectedEmployee))
        }

        setAssignments(assignmentsData)

        // Cargar pagos de la semana
        const paymentsData = await getPayments({
          start_date: startDateStr,
          end_date: endDateStr,
        })
        console.log("Pagos semanales cargados:", paymentsData.length)
        setPayments(paymentsData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedEmployee, selectedWeek])

  // Cargar datos anuales cuando se cambia a la pestaña anual
  useEffect(() => {
    const loadYearlyData = async () => {
      if (activeTab !== "anual") return

      setLoadingYearly(true)
      try {
        console.log("Cargando datos anuales...")

        // Cargar asignaciones para todo el año
        const yearStartStr = format(yearStart, "yyyy-MM-dd")
        const yearEndStr = format(yearEnd, "yyyy-MM-dd")
        console.log("Rango anual:", yearStartStr, "a", yearEndStr)

        let yearlyAssignmentsData = await getAssignments({
          start_date: yearStartStr,
          end_date: yearEndStr,
        })
        console.log("Asignaciones anuales cargadas:", yearlyAssignmentsData.length)

        // Filtrar por empleado si es necesario
        if (selectedEmployee !== "todos") {
          yearlyAssignmentsData = yearlyAssignmentsData.filter(
            (a) => a.employee_id === Number.parseInt(selectedEmployee),
          )
          console.log("Asignaciones filtradas por empleado:", yearlyAssignmentsData.length)
        }

        setYearlyAssignments(yearlyAssignmentsData)
      } catch (error) {
        console.error("Error al cargar datos anuales:", error)
      } finally {
        setLoadingYearly(false)
      }
    }

    loadYearlyData()
  }, [activeTab, selectedEmployee, employees])

  // Calcular pagos pendientes de semanas anteriores
  const pendingPayments = allPayments.filter((payment) => {
    // Verificar si es un pago pendiente
    if (payment.status !== "pendiente") return false

    // Verificar si es de una semana anterior a la actual
    const paymentEndDate = parseISO(payment.week_end)
    return isBefore(paymentEndDate, startDate)
  })

  console.log("Pagos pendientes encontrados:", pendingPayments.length)

  // Agrupar pagos pendientes por empleado
  const pendingPaymentsByEmployee = pendingPayments.reduce(
    (acc, payment) => {
      const employeeId = payment.employee_id
      if (!acc[employeeId]) {
        acc[employeeId] = []
      }
      acc[employeeId].push(payment)
      return acc
    },
    {} as Record<number, EmployeePayment[]>,
  )

  // Calcular resumen por empleado con división de tarifas
  const employeeSummary = employees
    .map((employee) => {
      const employeeAssignments = assignments.filter((a) => a.employee_id === employee.id)

      // Agrupar asignaciones por fecha para calcular división de tarifas
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

      // Calcular días trabajados y monto total
      const daysWorked = Object.keys(assignmentsByDate).length
      let totalAmount = 0

      // Calcular el monto dividiendo la tarifa diaria entre los hoteles del mismo día
      Object.values(assignmentsByDate).forEach((dayAssignments) => {
        const dailyRate = employee.daily_rate / dayAssignments.length
        totalAmount += dailyRate * dayAssignments.length
      })

      // Obtener hoteles únicos
      const hotels = [...new Set(employeeAssignments.map((a) => a.hotel_name))]

      // Verificar si ya existe un pago para este empleado en esta semana
      const existingPayment = payments.find(
        (p) =>
          p.employee_id === employee.id &&
          p.week_start === format(startDate, "yyyy-MM-dd") &&
          p.week_end === format(endDate, "yyyy-MM-dd"),
      )

      // Obtener pagos pendientes de semanas anteriores para este empleado
      const previousPendingPayments = pendingPaymentsByEmployee[employee.id] || []

      // Crear detalle de asignaciones con tarifa dividida
      const assignmentDetails = Object.entries(assignmentsByDate).map(([date, dayAssignments]) => {
        const dailyRatePerHotel = employee.daily_rate / dayAssignments.length
        return {
          date,
          assignments: dayAssignments,
          dailyRatePerHotel,
          totalForDay: employee.daily_rate,
        }
      })

      return {
        employee,
        daysWorked,
        totalAmount,
        hotels,
        payment: existingPayment,
        assignmentDetails,
        assignments: employeeAssignments,
        previousPendingPayments,
      }
    })
    .filter((summary) => {
      // Si hay un empleado seleccionado, filtrar solo ese
      if (selectedEmployee !== "todos") {
        return summary.employee.id === Number.parseInt(selectedEmployee)
      }
      // Si no hay filtro, mostrar solo los que trabajaron al menos un día
      return summary.daysWorked > 0
    })

  // Calcular totales por hotel para el año
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

      // Encontrar el empleado
      const employee = employees.find((e) => e.id === assignment.employee_id)
      if (employee) {
        // Contar cuántas asignaciones tiene este empleado en este día
        const sameDay = yearlyAssignments.filter(
          (a) => a.employee_id === assignment.employee_id && a.assignment_date === assignment.assignment_date,
        )

        // Dividir la tarifa entre el número de hoteles visitados ese día
        const dailyRate = employee.daily_rate / sameDay.length

        acc[hotelName].count++
        acc[hotelName].amount += dailyRate
        acc[hotelName].employees.add(employee.id)
      }

      return acc
    },
    {} as Record<string, { count: number; amount: number; employees: Set<number> }>,
  )

  console.log("Totales por hotel:", hotelYearlyTotals)

  // Ordenar hoteles por monto total
  const sortedHotels = Object.entries(hotelYearlyTotals)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([hotel, data]) => ({
      name: hotel,
      count: data.count,
      amount: data.amount,
      employeeCount: data.employees.size,
    }))

  console.log("Hoteles ordenados:", sortedHotels)

  // Calcular el monto máximo para la escala del gráfico
  const maxAmount = sortedHotels.length > 0 ? sortedHotels[0].amount : 0

  const handleCreatePayment = async (employeeId: number, amount: number) => {
    setLoading(true)
    try {
      const result = await savePayment({
        employee_id: employeeId,
        amount: amount,
        payment_date: new Date().toISOString().split("T")[0],
        week_start: format(startDate, "yyyy-MM-dd"),
        week_end: format(endDate, "yyyy-MM-dd"),
        status: "pendiente",
      })

      if (result) {
        toast({
          title: "Pago registrado",
          description: "El pago ha sido registrado correctamente",
        })

        // Actualizar la lista de pagos
        setPayments([...payments, result])
        setAllPayments([...allPayments, result])
      } else {
        toast({
          title: "Error",
          description: "No se pudo registrar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al registrar pago:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar el pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (paymentId: number) => {
    setLoading(true)
    try {
      const paymentToUpdate = allPayments.find((p) => p.id === paymentId)
      if (!paymentToUpdate) return

      const result = await savePayment({
        ...paymentToUpdate,
        status: "pagado",
      })

      if (result) {
        toast({
          title: "Pago actualizado",
          description: "El pago ha sido marcado como pagado",
        })

        // Actualizar la lista de pagos
        setPayments(payments.map((p) => (p.id === paymentId ? result : p)))
        setAllPayments(allPayments.map((p) => (p.id === paymentId ? result : p)))
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al actualizar pago:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm("¿Estás seguro de eliminar este pago? Esta acción no se puede deshacer.")) {
      return
    }

    setLoading(true)
    try {
      const success = await deletePayment(paymentId)

      if (success) {
        toast({
          title: "Pago eliminado",
          description: "El pago ha sido eliminado correctamente",
        })

        // Actualizar la lista de pagos
        setPayments(payments.filter((p) => p.id !== paymentId))
        setAllPayments(allPayments.filter((p) => p.id !== paymentId))
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar pago:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Resumen de Empleados</CardTitle>
              <CardDescription>Información detallada de trabajo y pagos por empleado</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)}>
              {showDebugInfo ? "Ocultar Detalles" : "Ver Detalles"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/2">
              <Label htmlFor="week-select">Semana</Label>
              <Input
                id="week-select"
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Semana del {format(startDate, "d 'de' MMMM", { locale: es })} al{" "}
                {format(endDate, "d 'de' MMMM, yyyy", { locale: es })}
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <Label htmlFor="employee-select">Empleado</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder="Todos los empleados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los empleados</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alerta de pagos pendientes - Siempre visible si hay pagos pendientes */}
          {pendingPayments.length > 0 && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Pagos pendientes de semanas anteriores</AlertTitle>
              <AlertDescription>
                <div className="mt-2 text-orange-700">
                  Hay <strong>{pendingPayments.length}</strong> pago(s) pendiente(s) de semanas anteriores que requieren
                  atención.
                </div>
                <div className="mt-3 max-h-60 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-orange-800">Empleado</TableHead>
                        <TableHead className="text-orange-800">Semana</TableHead>
                        <TableHead className="text-orange-800">Monto</TableHead>
                        <TableHead className="text-orange-800">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.employee_name}</TableCell>
                          <TableCell>
                            {format(parseISO(payment.week_start), "dd/MM", { locale: es })} -{" "}
                            {format(parseISO(payment.week_end), "dd/MM/yyyy", { locale: es })}
                          </TableCell>
                          <TableCell className="font-bold">${payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleMarkAsPaid(payment.id)}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Pagar
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeletePayment(payment.id)}>
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {showDebugInfo && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Información de depuración</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong>Empleados:</strong> {employees.length}
                  </div>
                  <div>
                    <strong>Asignaciones semanales:</strong> {assignments.length}
                  </div>
                  <div>
                    <strong>Asignaciones anuales:</strong> {yearlyAssignments.length}
                  </div>
                  <div>
                    <strong>Pagos totales:</strong> {allPayments.length}
                  </div>
                  <div>
                    <strong>Pagos pendientes:</strong> {pendingPayments.length}
                  </div>
                  <div>
                    <strong>Hoteles con datos:</strong> {Object.keys(hotelYearlyTotals).length}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="semanal">Resumen Semanal</TabsTrigger>
              <TabsTrigger value="anual">Resumen Anual por Hotel</TabsTrigger>
            </TabsList>

            <TabsContent value="semanal">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : employeeSummary.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos para mostrar con los filtros seleccionados
                </div>
              ) : (
                <div className="space-y-6">
                  {employeeSummary.map((summary) => (
                    <Card key={summary.employee.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {summary.employee.name}
                              {summary.payment && (
                                <Badge
                                  variant={summary.payment.status === "pagado" ? "default" : "outline"}
                                  className="ml-2"
                                >
                                  {summary.payment.status === "pagado" ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Semana Pagada
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mr-1" />
                                      Pago Pendiente
                                    </>
                                  )}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              {summary.employee.role} - Tarifa diaria: ${summary.employee.daily_rate.toLocaleString()}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total a pagar</div>
                            <div className="text-2xl font-bold text-primary">
                              ${summary.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {summary.previousPendingPayments.length > 0 && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Pagos pendientes anteriores</AlertTitle>
                            <AlertDescription>
                              Este empleado tiene <strong>{summary.previousPendingPayments.length}</strong> pago(s)
                              pendiente(s) de semanas anteriores por un total de{" "}
                              <strong>
                                $
                                {summary.previousPendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                              </strong>
                              .
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">Días trabajados</div>
                              <div className="text-xl font-bold">{summary.daysWorked}</div>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-2">Hoteles visitados</div>
                            <div className="flex flex-wrap gap-1">
                              {summary.hotels.map((hotel) => (
                                <Badge key={hotel} className={getHotelColor(hotel)}>
                                  {hotel}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium mb-3">Detalle de asignaciones y tarifas</div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Hoteles</TableHead>
                                <TableHead>Tarifa por Hotel</TableHead>
                                <TableHead>Total del Día</TableHead>
                                <TableHead>Notas</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {summary.assignmentDetails.map((detail) => (
                                <TableRow key={detail.date}>
                                  <TableCell className="font-medium">
                                    {format(new Date(detail.date), "dd/MM/yyyy", { locale: es })}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {detail.assignments.map((assignment, idx) => (
                                        <Badge
                                          key={idx}
                                          className={getHotelColor(assignment.hotel_name)}
                                          variant="outline"
                                        >
                                          {assignment.hotel_name}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {detail.assignments.length} hotel{detail.assignments.length > 1 ? "es" : ""}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">${detail.dailyRatePerHotel.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">por hotel</div>
                                  </TableCell>
                                  <TableCell className="font-bold">${detail.totalForDay.toLocaleString()}</TableCell>
                                  <TableCell>
                                    {detail.assignments
                                      .map((a) => a.notes)
                                      .filter(Boolean)
                                      .join(", ") || "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/30 flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Semana: {format(startDate, "dd/MM", { locale: es })} -{" "}
                          {format(endDate, "dd/MM/yyyy", { locale: es })}
                        </div>
                        <div className="flex gap-2">
                          {!summary.payment ? (
                            <Button
                              onClick={() => handleCreatePayment(summary.employee.id, summary.totalAmount)}
                              disabled={loading || summary.daysWorked === 0}
                            >
                              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              <DollarSign className="mr-2 h-4 w-4" />
                              Registrar Pago
                            </Button>
                          ) : summary.payment.status === "pendiente" ? (
                            <div className="flex gap-2">
                              <Button onClick={() => handleMarkAsPaid(summary.payment!.id)} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar como Pagado
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleDeletePayment(summary.payment!.id)}
                                disabled={loading}
                              >
                                Eliminar Pago
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Badge variant="default" className="px-4 py-2">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Semana Pagada
                              </Badge>
                              <Button
                                variant="outline"
                                onClick={() => handleDeletePayment(summary.payment!.id)}
                                disabled={loading}
                              >
                                Eliminar Pago
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="anual">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Gastos por Hotel en {currentYear}
                  </CardTitle>
                  <CardDescription>
                    Distribución de gastos por hotel durante el año actual
                    {selectedEmployee !== "todos" &&
                      ` para ${employees.find((e) => e.id.toString() === selectedEmployee)?.name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingYearly ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : sortedHotels.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="mb-2">No hay datos para mostrar en el año {currentYear}</div>
                      <div className="text-sm">
                        {yearlyAssignments.length === 0
                          ? "No se encontraron asignaciones para este período"
                          : "No hay asignaciones que coincidan con los filtros seleccionados"}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        {sortedHotels.map((hotel) => (
                          <div key={hotel.name} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <Badge className={getHotelColor(hotel.name)} variant="outline">
                                  {hotel.name}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {hotel.count} asignaciones • {hotel.employeeCount} empleados
                                </span>
                              </div>
                              <span className="font-bold text-lg">${hotel.amount.toLocaleString()}</span>
                            </div>
                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getHotelSolidColor(hotel.name)} rounded-full transition-all duration-300`}
                                style={{ width: `${maxAmount > 0 ? (hotel.amount / maxAmount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-lg">Total Anual {currentYear}</span>
                          <span className="text-2xl font-bold text-primary">
                            ${sortedHotels.reduce((sum, hotel) => sum + hotel.amount, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {sortedHotels.reduce((sum, hotel) => sum + hotel.count, 0)} asignaciones totales
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
