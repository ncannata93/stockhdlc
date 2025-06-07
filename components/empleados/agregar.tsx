"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeeAssignment } from "@/lib/employee-types"
import { User, Calendar, Save, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EmpleadosAgregar() {
  // Estados para empleado
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    role: "",
    daily_rate: "",
    active: true,
  })

  // Estados para asignación
  const [assignmentForm, setAssignmentForm] = useState({
    employee_id: "",
    hotel_name: "",
    assignment_date: "",
    daily_rate_used: "",
    notes: "",
    paid: false,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeForm, setActiveForm] = useState<"employee" | "assignment">("employee")

  const { addEmployee, addAssignment } = useEmployeeDB()
  const { toast } = useToast()

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const employeeData: Omit<Employee, "id" | "created_at"> = {
        name: employeeForm.name.trim(),
        role: employeeForm.role.trim() || null,
        daily_rate: employeeForm.daily_rate ? Number.parseFloat(employeeForm.daily_rate) : null,
        active: employeeForm.active,
      }

      const success = await addEmployee(employeeData)

      if (success) {
        setSuccess("Empleado agregado correctamente")
        setEmployeeForm({
          name: "",
          role: "",
          daily_rate: "",
          active: true,
        })
        toast({
          title: "Empleado agregado",
          description: `${employeeData.name} ha sido agregado al sistema`,
        })
      } else {
        setError("No se pudo agregar el empleado")
      }
    } catch (error) {
      console.error("Error al agregar empleado:", error)
      setError("Ocurrió un error al agregar el empleado")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const assignmentData: Omit<EmployeeAssignment, "id" | "employee_name"> = {
        employee_id: Number.parseInt(assignmentForm.employee_id),
        hotel_name: assignmentForm.hotel_name.trim(),
        assignment_date: assignmentForm.assignment_date,
        daily_rate_used: assignmentForm.daily_rate_used ? Number.parseFloat(assignmentForm.daily_rate_used) : null,
        notes: assignmentForm.notes.trim() || null,
        paid: assignmentForm.paid,
      }

      const success = await addAssignment(assignmentData)

      if (success) {
        setSuccess("Asignación agregada correctamente")
        setAssignmentForm({
          employee_id: "",
          hotel_name: "",
          assignment_date: "",
          daily_rate_used: "",
          notes: "",
          paid: false,
        })
        toast({
          title: "Asignación agregada",
          description: `Asignación para ${assignmentData.hotel_name} creada correctamente`,
        })
      } else {
        setError("No se pudo agregar la asignación")
      }
    } catch (error) {
      console.error("Error al agregar asignación:", error)
      setError("Ocurrió un error al agregar la asignación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector de formulario */}
      <div className="flex gap-2">
        <Button
          variant={activeForm === "employee" ? "default" : "outline"}
          onClick={() => setActiveForm("employee")}
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          Agregar Empleado
        </Button>
        <Button
          variant={activeForm === "assignment" ? "default" : "outline"}
          onClick={() => setActiveForm("assignment")}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Agregar Asignación
        </Button>
      </div>

      {/* Mensajes de estado */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Formulario de Empleado */}
      {activeForm === "employee" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Agregar Nuevo Empleado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee-name">Nombre Completo *</Label>
                  <Input
                    id="employee-name"
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-role">Puesto/Rol</Label>
                  <Input
                    id="employee-role"
                    type="text"
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="Ej: Limpieza, Mantenimiento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-rate">Tarifa Diaria ($)</Label>
                  <Input
                    id="employee-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={employeeForm.daily_rate}
                    onChange={(e) => setEmployeeForm((prev) => ({ ...prev, daily_rate: e.target.value }))}
                    placeholder="Ej: 150.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-active">Estado</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="employee-active"
                      type="checkbox"
                      checked={employeeForm.active}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, active: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="employee-active" className="text-sm">
                      Empleado activo
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading || !employeeForm.name.trim()} className="w-full">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? "Guardando..." : "Agregar Empleado"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulario de Asignación */}
      {activeForm === "assignment" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agregar Nueva Asignación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-employee">ID del Empleado *</Label>
                  <Input
                    id="assignment-employee"
                    type="number"
                    min="1"
                    value={assignmentForm.employee_id}
                    onChange={(e) => setAssignmentForm((prev) => ({ ...prev, employee_id: e.target.value }))}
                    placeholder="Ej: 1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment-hotel">Nombre del Hotel *</Label>
                  <Input
                    id="assignment-hotel"
                    type="text"
                    value={assignmentForm.hotel_name}
                    onChange={(e) => setAssignmentForm((prev) => ({ ...prev, hotel_name: e.target.value }))}
                    placeholder="Ej: Hotel Plaza"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment-date">Fecha de Asignación *</Label>
                  <Input
                    id="assignment-date"
                    type="date"
                    value={assignmentForm.assignment_date}
                    onChange={(e) => setAssignmentForm((prev) => ({ ...prev, assignment_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment-rate">Tarifa Utilizada ($)</Label>
                  <Input
                    id="assignment-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={assignmentForm.daily_rate_used}
                    onChange={(e) => setAssignmentForm((prev) => ({ ...prev, daily_rate_used: e.target.value }))}
                    placeholder="Ej: 150.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-notes">Notas</Label>
                <Textarea
                  id="assignment-notes"
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales sobre la asignación..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="assignment-paid"
                  type="checkbox"
                  checked={assignmentForm.paid}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, paid: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="assignment-paid" className="text-sm">
                  Marcar como pagado
                </Label>
              </div>

              <Button
                type="submit"
                disabled={
                  loading ||
                  !assignmentForm.employee_id ||
                  !assignmentForm.hotel_name ||
                  !assignmentForm.assignment_date
                }
                className="w-full"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? "Guardando..." : "Agregar Asignación"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
