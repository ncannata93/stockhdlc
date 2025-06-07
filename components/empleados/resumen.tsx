"use client"

import { useState, useEffect } from "react"
import { endOfWeek, parseISO, startOfYear, endOfYear, isBefore, addWeeks, subWeeks, startOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Banknote,
  Users,
  TriangleIcon as ExclamationTriangle,
} from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeeAssignment, EmployeePayment } from "@/lib/employee-types"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateForDisplay } from "@/lib/date-utils"

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
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    // Obtener el lunes de la semana actual
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    return monday.toISOString().split("T")[0] // Formato YYYY-MM-DD
  })
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [activeTab, setActiveTab] = useState("semanal")

  // Calcular fechas de inicio y fin de la semana seleccionada de manera segura
  const startDate = (() => {
    try {
      return parseISO(selectedWeek)
    } catch (e) {
      console.error("Error parsing selectedWeek:", selectedWeek, e)
      return new Date() // Fallback a la fecha actual
    }
  })()

  const endDate = (() => {
    try {
      return endOfWeek(startDate, { weekStartsOn: 1 })
    } catch (e) {
      console.error("Error calculating endDate:", e)
      const fallback = new Date(startDate)
      fallback.setDate(fallback.getDate() + 6)
      return fallback
    }
  })()

  // Fechas para el año actual
  const currentYear = new Date().getFullYear()
  const yearStart = startOfYear(new Date(currentYear, 0, 1))
  const yearEnd = endOfYear(new Date(currentYear, 11, 31))

  // Funciones para navegar entre semanas
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
        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]
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
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Por favor, intenta de nuevo.",
          variant: "destructive",
        })
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
        const yearStartStr = yearStart.toISOString().split("T")[0]
        const yearEndStr = yearEnd.toISOString().split("T")[0]
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

  // Función segura para formatear fechas
  const safeFormatDate = (dateString: string | null | undefined, format = "dd/MM/yyyy"): string => {
    if (!dateString) return ""
    try {
      const date = parseISO(dateString)
      return format === "input" ? date.toISOString().split("T")[0] : formatDateForDisplay(date)
    } catch (e) {
      console.error("Error formatting date:", dateString, e)
      return ""
    }
  }

  // Calcular pagos pendientes de semanas anteriores
  const pendingPayments = allPayments.filter((payment) => {
    // Verificar si es un pago pendiente
    if (payment.status !== "pendiente") return false

    // Verificar si es de una semana anterior a la actual
    try {
      const paymentEndDate = parseISO(payment.week_end)
      return isBefore(paymentEndDate, startDate)
    } catch (e) {
      console.error("Error comparing dates:", payment.week_end, e)
      return false
    }
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

  // Calcular estadísticas generales
  const totalPendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const employeesWithPendingPayments = Object.keys(pendingPaymentsByEmployee).length

  // Calcular resumen por empleado con división de tarifas USANDO LA TARIFA GUARDADA
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

      // Calcular días trabajados y monto total USANDO LA TARIFA GUARDADA
      const daysWorked = Object.keys(assignmentsByDate).length
      let totalAmount = 0

      // Crear detalle de asignaciones con tarifa guardada
      const assignmentDetails = Object.entries(assignmentsByDate).map(([date, dayAssignments]) => {
        // Calcular el total para este día sumando las tarifas guardadas de cada asignación
        const totalForDay = dayAssignments.reduce((sum, assignment) => sum + assignment.daily_rate_used, 0)

        return {
          date,
          assignments: dayAssignments,
          totalForDay,
        }
      })

      // Calcular el monto total sumando los totales de cada día
      totalAmount = assignmentDetails.reduce((sum, detail) => sum + detail.totalForDay, 0)

      // Obtener hoteles únicos
      const hotels = [...new Set(employeeAssignments.map((a) => a.hotel_name))]

      // Verificar si ya existe un pago para este empleado en esta semana
      const existingPayment = payments.find(
        (p) =>
          p.employee_id === employee.id &&
          p.week_start === startDate.toISOString().split("T")[0] &&
          p.week_end === endDate.toISOString().split("T")[0],
      )

      // Obtener pagos pendientes de semanas anteriores para este empleado
      const previousPendingPayments = pendingPaymentsByEmployee[employee.id] || []

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

  // Calcular totales por hotel para el año USANDO LA TARIFA GUARDADA
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

      // Usar la tarifa guardada en la asignación
      const savedDailyRate = assignment.daily_rate_used || 0

      acc[hotelName].count++
      acc[hotelName].amount += savedDailyRate
      acc[hotelName].employees.add(assignment.employee_id)

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
        week_start: startDate.toISOString().split("T")[0],
        week_end: endDate.toISOString().split("T")[0],
        status: "pendiente",
      })

      if (result) {
        toast({
          title: "✅ Pago registrado",
          description: "El pago ha sido registrado correctamente",
        })

        // Actualizar la lista de pagos
        setPayments([...payments, result])
        setAllPayments([...allPayments, result])
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo registrar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al registrar pago:", error)
      toast({
        title: "❌ Error",
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
          title: "✅ Pago actualizado",
          description: "El pago ha sido marcado como pagado",
        })

        // Actualizar la lista de pagos
        setPayments(payments.map((p) => (p.id === paymentId ? result : p)))
        setAllPayments(allPayments.map((p) => (p.id === paymentId ? result : p)))
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo actualizar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al actualizar pago:", error)
      toast({
        title: "❌ Error",
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
          title: "🗑️ Pago eliminado",
          description: "El pago ha sido eliminado correctamente",
        })

        // Actualizar la lista de pagos
        setPayments(payments.filter((p) => p.id !== paymentId))
        setAllPayments(allPayments.filter((p) => p.id !== paymentId))
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo eliminar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar pago:", error)
      toast({
        title: "❌ Error",
        description: "Ocurrió un error al eliminar el pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Panel de estadísticas generales */}
      {pendingPayments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Semanas Impagas</p>
                  <p className="text-2xl font-bold text-red-900">{pendingPayments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Empleados Afectados</p>
                  <p className="text-2xl font-bold text-orange-900">{employeesWithPendingPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Banknote className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Total Pendiente</p>
                  <p className="text-2xl font-bold text-yellow-900">${totalPendingAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-6 w-6" />
                Resumen de Empleados
              </CardTitle>
              <CardDescription>
                Gestión semanal de pagos y asignaciones con navegación fácil entre semanas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)}>
              {showDebugInfo ? "Ocultar Detalles" : "Ver Detalles"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navegación de semanas mejorada */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/2">
              <Label htmlFor="week-select" className="text-base font-medium">
                📅 Navegación de Semanas
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Input
                  id="week-select"
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                  Hoy
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                📍 <strong>Semana seleccionada:</strong> {safeFormatDate(startDate.toISOString())} al{" "}
                {safeFormatDate(endDate.toISOString())}
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <Label htmlFor="employee-select" className="text-base font-medium">
                👥 Filtrar por Empleado
              </Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee-select" className="mt-2">
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

          {/* Alerta de pagos pendientes mejorada */}
          {pendingPayments.length > 0 && (
            <Alert className="mb-6 border-red-300 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800 text-lg">🚨 ¡Atención! Hay semanas sin pagar</AlertTitle>
              <AlertDescription>
                <div className="mt-3 text-red-700">
                  Se encontraron <strong>{pendingPayments.length}</strong> semana(s) impaga(s) que afectan a{" "}
                  <strong>{employeesWithPendingPayments}</strong> empleado(s) por un total de{" "}
                  <strong>${totalPendingAmount.toLocaleString()}</strong>.
                </div>
                <div className="mt-4 max-h-60 overflow-auto bg-white rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-100">
                        <TableHead className="text-red-800 font-semibold">👤 Empleado</TableHead>
                        <TableHead className="text-red-800 font-semibold">📅 Semana</TableHead>
                        <TableHead className="text-red-800 font-semibold">💰 Monto</TableHead>
                        <TableHead className="text-red-800 font-semibold">⚡ Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-red-50">
                          <TableCell className="font-medium">{payment.employee_name}</TableCell>
                          <TableCell>
                            {safeFormatDate(payment.week_start)} - {safeFormatDate(payment.week_end)}
                          </TableCell>
                          <TableCell className="font-bold text-red-700">${payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleMarkAsPaid(payment.id)} className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Pagar
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeletePayment(payment.id)}>
                                🗑️ Eliminar
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
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">🔍 Información de depuración</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2 text-blue-700">
                  <div>
                    <strong>👥 Empleados:</strong> {employees.length}
                  </div>
                  <div>
                    <strong>📋 Asignaciones semanales:</strong> {assignments.length}
                  </div>
                  <div>
                    <strong>📊 Asignaciones anuales:</strong> {yearlyAssignments.length}
                  </div>
                  <div>
                    <strong>💳 Pagos totales:</strong> {allPayments.length}
                  </div>
                  <div>
                    <strong>⏰ Pagos pendientes:</strong> {pendingPayments.length}
                  </div>
                  <div>
                    <strong>🏨 Hoteles con datos:</strong> {Object.keys(hotelYearlyTotals).length}
                  </div>
                  <div>
                    <strong>📅 Semana seleccionada:</strong> {selectedWeek}
                  </div>
                  <div>
                    <strong>🗓️ Fecha inicio:</strong> {startDate.toISOString().split("T")[0]}
                  </div>
                  <div>
                    <strong>🗓️ Fecha fin:</strong> {endDate.toISOString().split("T")[0]}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

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
                        📅 <strong>Semana:</strong> {safeFormatDate(startDate.toISOString())} -{" "}
                        {safeFormatDate(endDate.toISOString())}
                      </div>
                      <div>
                        👤 <strong>Empleado:</strong>{" "}
                        {selectedEmployee === "todos"
                          ? "Todos"
                          : employees.find((e) => e.id.toString() === selectedEmployee)?.name}
                      </div>
                      <div>
                        📊 <strong>Asignaciones encontradas:</strong> {assignments.length}
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
                              {summary.payment && (
                                <Badge
                                  variant={summary.payment.status === "pagado" ? "default" : "outline"}
                                  className={`ml-2 px-3 py-1 ${
                                    summary.payment.status === "pagado"
                                      ? "bg-green-100 text-green-800 border-green-300"
                                      : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  }`}
                                >
                                  {summary.payment.status === "pagado" ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />✅ Semana Pagada
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-4 h-4 mr-1" />⏰ Pago Pendiente
                                    </>
                                  )}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 text-base">
                              🏷️ {summary.employee.role} • 💰 Tarifa actual: $
                              {summary.employee.daily_rate.toLocaleString()}
                            </CardDescription>
                          </div>
                          <div className="text-right bg-white p-4 rounded-lg border shadow-sm">
                            <div className="text-sm text-muted-foreground">💵 Total a pagar</div>
                            <div className="text-3xl font-bold text-green-600">
                              ${summary.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {summary.previousPendingPayments.length > 0 && (
                          <Alert variant="destructive" className="mt-4 border-red-300 bg-red-50">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertTitle className="text-red-800">🚨 Pagos pendientes anteriores</AlertTitle>
                            <AlertDescription className="text-red-700">
                              Este empleado tiene <strong>{summary.previousPendingPayments.length}</strong> semana(s)
                              impaga(s) por un total de{" "}
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
                          <div className="text-base font-medium mb-4 flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            <span>📊 Detalle de asignaciones y tarifas por hotel</span>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-white">
                                  <TableHead className="font-semibold">📅 Fecha</TableHead>
                                  <TableHead className="font-semibold">🏨 Hoteles y Tarifas</TableHead>
                                  <TableHead className="font-semibold">💰 Total del Día</TableHead>
                                  <TableHead className="font-semibold">📝 Notas</TableHead>
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
                                        <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded">
                                          📊 {detail.assignments.length} hotel
                                          {detail.assignments.length > 1 ? "es" : ""} visitado
                                          {detail.assignments.length > 1 ? "s" : ""} este día
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-xl font-bold text-green-600 bg-green-50 p-2 rounded text-center">
                                        ${detail.totalForDay.toLocaleString()}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        {detail.assignments
                                          .map((a) => a.notes)
                                          .filter(Boolean)
                                          .join(", ") || "📝 Sin notas"}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50 flex justify-between items-center border-t">
                        <div className="text-sm text-muted-foreground">
                          📅 <strong>Semana:</strong> {safeFormatDate(startDate.toISOString())} -{" "}
                          {safeFormatDate(endDate.toISOString())}
                        </div>
                        <div className="flex gap-3">
                          {!summary.payment ? (
                            <Button
                              onClick={() => handleCreatePayment(summary.employee.id, summary.totalAmount)}
                              disabled={loading || summary.daysWorked === 0}
                              className="bg-green-600 hover:bg-green-700"
                              size="lg"
                            >
                              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              <DollarSign className="mr-2 h-5 w-5" />💰 Registrar Pago
                            </Button>
                          ) : summary.payment.status === "pendiente" ? (
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleMarkAsPaid(summary.payment!.id)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700"
                                size="lg"
                              >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <CheckCircle className="mr-2 h-5 w-5" />✅ Marcar como Pagado
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleDeletePayment(summary.payment!.id)}
                                disabled={loading}
                                size="lg"
                              >
                                🗑️ Eliminar Pago
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <Badge variant="default" className="px-6 py-3 text-base bg-green-100 text-green-800">
                                <CheckCircle className="mr-2 h-5 w-5" />✅ Semana Pagada
                              </Badge>
                              <Button
                                variant="outline"
                                onClick={() => handleDeletePayment(summary.payment!.id)}
                                disabled={loading}
                                size="lg"
                              >
                                🗑️ Eliminar Pago
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
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-6 w-6" />📊 Gastos por Hotel en {currentYear}
                  </CardTitle>
                  <CardDescription className="text-base">
                    💰 Distribución de gastos por hotel durante el año actual usando las tarifas aplicadas en cada
                    momento
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
                      <div className="text-sm">
                        {yearlyAssignments.length === 0
                          ? "📊 No se encontraron asignaciones para este período"
                          : "🔍 No hay asignaciones que coincidan con los filtros seleccionados"}
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
                              📈 {sortedHotels.reduce((sum, hotel) => sum + hotel.count, 0)} asignaciones totales con
                              tarifas históricas
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
