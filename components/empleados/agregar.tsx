"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEmployeeDB } from "@/lib/employee-db"
import { HOTELS } from "@/lib/employee-types"
import { Loader2, Plus, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EmpleadosAgregar() {
  const { getEmployees, saveAssignment } = useEmployeeDB()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    employee_id: "",
    hotel_name: "",
    assignment_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  })

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true)
      try {
        const data = await getEmployees()
        setEmployees(data.map((emp) => ({ id: emp.id, name: emp.name })))
      } catch (error) {
        console.error("Error al cargar empleados:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los empleados",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadEmployees()
  }, [getEmployees, toast])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validar datos
      if (!formData.employee_id || !formData.hotel_name || !formData.assignment_date) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos obligatorios",
          variant: "destructive",
        })
        return
      }

      // Guardar asignación
      const result = await saveAssignment({
        employee_id: Number.parseInt(formData.employee_id),
        hotel_name: formData.hotel_name,
        assignment_date: formData.assignment_date,
        notes: formData.notes,
      })

      if (result) {
        toast({
          title: "Éxito",
          description: "Asignación guardada correctamente",
        })

        // Resetear formulario pero mantener la fecha
        setFormData({
          employee_id: "",
          hotel_name: "",
          assignment_date: formData.assignment_date,
          notes: "",
        })

        setSuccess(true)
      }
    } catch (error) {
      console.error("Error al guardar asignación:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la asignación",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Asignación</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Empleado</Label>
                <Select value={formData.employee_id} onValueChange={(value) => handleChange("employee_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel</Label>
                <Select value={formData.hotel_name} onValueChange={(value) => handleChange("hotel_name", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOTELS.map((hotel) => (
                      <SelectItem key={hotel} value={hotel}>
                        {hotel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  type="date"
                  id="date"
                  value={formData.assignment_date}
                  onChange={(e) => handleChange("assignment_date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Detalles adicionales..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : success ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Asignación
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose">
            <p>Para agregar una nueva asignación:</p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Selecciona el empleado que realizará el trabajo</li>
              <li>Elige el hotel donde se realizará la tarea</li>
              <li>Establece la fecha de la asignación</li>
              <li>Opcionalmente, agrega notas o detalles sobre el trabajo</li>
              <li>Haz clic en "Agregar Asignación" para guardar</li>
            </ol>
            <p className="mt-4">
              Las asignaciones guardadas aparecerán en el historial y en el calendario para su seguimiento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
