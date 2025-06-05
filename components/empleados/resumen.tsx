"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Calendar, DollarSign, CheckCircle } from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeeAssignment, EmployeePayment } from "@/lib/employee-types"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

export default function EmpleadosResumen() {
  const { getEmployees, getAssignments, getPayments, savePayment } = useEmployeeDB()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [payments, setPayments] = useState<EmployeePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("todos")
  const [selectedWeek, setSelectedWeek] = useState<string>(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
  )

  // Calcular fechas de inicio y fin de la semana seleccionada
  const startDate = parseISO(selectedWeek)
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Cargar empleados
        const employeesData = await getEmployees()
        setEmployees(employeesData)

        // Cargar asignaciones para la semana seleccionada
        const startDateStr = format(startDate, "yyyy-MM-dd")
        const endDateStr = format(endDate, "yyyy-MM-dd")

        let assignmentsData = await getAssignments({
          start_date: startDateStr,
          end_date: endDateStr,
        })

        // Filtrar por empleado si es necesario
        if (selectedEmployee !== "todos") {
          assignmentsData = assignmentsData.filter((a) => a.employee_id === Number.parseInt(selectedEmployee))
        }

        setAssignments(assignmentsData)

        // Cargar pagos
        const paymentsData = await getPayments({
          start_date: startDateStr,
          end_date: endDateStr,
        })

        setPayments(paymentsData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedEmployee, selectedWeek]) // Solo estas dependencias

  // Agrupar asignaciones por empleado
  const assignmentsByEmployee = assignments.reduce(
    (acc, assignment) => {
      const employeeId = assignment.employee_id
      if (!acc[employeeId]) {
        acc[employeeId] = []
      }
      acc[employeeId].push(assignment)
      return acc
    },
    {} as Record<number, EmployeeAssignment[]>,
  )

  // Calcular resumen por empleado
  const employeeSummary = employees
    .map((employee) => {
      const employeeAssignments = assignmentsByEmployee[employee.id] || []
      const daysWorked = employeeAssignments.length
      const totalAmount = daysWorked * employee.daily_rate

      // Verificar si ya existe un pago para este empleado en esta semana
      const existingPayment = payments.find(
        (p) =>
          p.employee_id === employee.id &&
          p.week_start === format(startDate, "yyyy-MM-dd") &&
          p.week_end === format(endDate, "yyyy-MM-dd"),
      )

      return {
        employee,
        daysWorked,
        totalAmount,
        hotels: [...new Set(employeeAssignments.map((a) => a.hotel_name))],
        payment: existingPayment,
        assignments: employeeAssignments,
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
      const paymentToUpdate = payments.find((p) => p.id === paymentId)
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen Semanal</CardTitle>
          <CardDescription>Resumen de trabajo y pagos por empleado</CardDescription>
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
                    <CardTitle>{summary.employee.name}</CardTitle>
                    <CardDescription>
                      {summary.employee.role} - Tarifa diaria: ${summary.employee.daily_rate.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Días trabajados</div>
                          <div className="text-2xl font-bold">{summary.daysWorked}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Total a pagar</div>
                          <div className="text-2xl font-bold">${summary.totalAmount.toLocaleString()}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-1">Estado de pago</div>
                        {summary.payment ? (
                          <Badge variant={summary.payment.status === "pagado" ? "default" : "outline"}>
                            {summary.payment.status === "pagado" ? "Pagado" : "Pendiente"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No registrado</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm font-medium mb-1">Hoteles visitados</div>
                      <div className="flex flex-wrap gap-2">
                        {summary.hotels.map((hotel) => (
                          <Badge key={hotel} variant="secondary">
                            {hotel}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Detalle de asignaciones</div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Hotel</TableHead>
                            <TableHead>Notas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summary.assignments.map((assignment) => (
                            <TableRow key={assignment.id}>
                              <TableCell>
                                {format(new Date(assignment.assignment_date), "dd/MM/yyyy", { locale: es })}
                              </TableCell>
                              <TableCell>{assignment.hotel_name}</TableCell>
                              <TableCell>{assignment.notes || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 flex justify-end gap-2">
                    {!summary.payment ? (
                      <Button
                        onClick={() => handleCreatePayment(summary.employee.id, summary.totalAmount)}
                        disabled={loading || summary.daysWorked === 0}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrar Pago
                      </Button>
                    ) : summary.payment.status === "pendiente" ? (
                      <Button onClick={() => handleMarkAsPaid(summary.payment!.id)} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marcar como Pagado
                      </Button>
                    ) : null}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
