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
import { Checkbox } from "@/components/ui/checkbox"

export default function EmpleadosAgregar() {
  const { getEmployees, saveAssignment } = useEmployeeDB()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<{ id: number; name: string; daily_rate: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    employee_id: "",
    hotel_names: [] as string[], // Array de hoteles seleccionados
    assignment_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  })

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true)
      try {
        const data = await getEmployees()
        setEmployees(data.map((emp) => ({ id: emp.id, name: emp.name, daily_rate: emp.daily_rate })))
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

  const handleEmployeeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, employee_id: value }))
    setSuccess(false)
  }

  const handleHotelChange = (hotelName: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      hotel_names: checked ? [...prev.hotel_names, hotelName] : prev.hotel_names.filter((h) => h !== hotelName),
    }))
    setSuccess(false)
  }

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, assignment_date: value }))
    setSuccess(false)
  }

  const handleNotesChange = (value: string) => {
    setFormData((prev) => ({ ...prev, notes: value }))
    setSuccess(false)
  }

  const getSelectedEmployee = () => {
    return employees.find((emp) => emp.id.toString() === formData.employee_id)
  }

  const calculateDividedRate = () => {
    const employee = getSelectedEmployee()
    if (!employee || formData.hotel_names.length === 0) return 0
    return employee.daily_rate / formData.hotel_names.length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validar datos
      if (!formData.employee_id || formData.hotel_names.length === 0 || !formData.assignment_date) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos obligatorios y selecciona al menos un hotel",
          variant: "destructive",
        })
        return
      }

      const employee = getSelectedEmployee()
      if (!employee) {
        toast({
          title: "Error",
          description: "No se pudo encontrar la información del empleado",
          variant: "destructive",
        })
        return
      }

      // Calcular la tarifa dividida entre los hoteles
      const dividedRate = employee.daily_rate / formData.hotel_names.length

      console.log(`Empleado: ${employee.name}`)
      console.log(`Tarifa diaria original: ${employee.daily_rate}`)
      console.log(`Número de hoteles: ${formData.hotel_names.length}`)
      console.log(`Tarifa dividida: ${dividedRate}`)
      console.log(`Hoteles seleccionados: ${formData.hotel_names.join(", ")}`)

      // Crear una asignación por cada hotel seleccionado
      const promises = formData.hotel_names.map((hotelName, index) => {
        console.log(`Creando asignación ${index + 1} para hotel: ${hotelName} con tarifa: ${dividedRate}`)
        return saveAssignment({
          employee_id: Number.parseInt(formData.employee_id),
          hotel_name: hotelName,
          assignment_date: formData.assignment_date,
          daily_rate_used: dividedRate, // Usar la tarifa dividida calculada
          notes: formData.notes,
        })
      })

      const results = await Promise.all(promises)

      if (results.every((result) => result !== null)) {
        toast({
          title: "Éxito",
          description: `${formData.hotel_names.length} asignación(es) guardada(s) correctamente`,
        })

        // Resetear formulario pero mantener la fecha
        setFormData({
          employee_id: "",
          hotel_names: [],
          assignment_date: formData.assignment_date,
          notes: "",
        })

        setSuccess(true)
      } else {
        toast({
          title: "Error parcial",
          description: "Algunas asignaciones no se pudieron guardar",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al guardar asignaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las asignaciones",
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
                <Select value={formData.employee_id} onValueChange={handleEmployeeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} - ${emp.daily_rate.toLocaleString()}/día
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hoteles (selecciona uno o más)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {HOTELS.map((hotel) => (
                    <div key={hotel} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hotel-${hotel}`}
                        checked={formData.hotel_names.includes(hotel)}
                        onCheckedChange={(checked) => handleHotelChange(hotel, checked as boolean)}
                      />
                      <Label htmlFor={`hotel-${hotel}`} className="text-sm font-normal cursor-pointer">
                        {hotel}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.hotel_names.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Seleccionados: {formData.hotel_names.join(", ")}
                    </div>
                    {getSelectedEmployee() && (
                      <div className="text-sm bg-blue-50 border border-blue-200 rounded-md p-2">
                        <div className="font-medium text-blue-800">Distribución de tarifa:</div>
                        <div className="text-blue-700">
                          ${getSelectedEmployee()?.daily_rate.toLocaleString()} ÷ {formData.hotel_names.length} hoteles
                          = ${calculateDividedRate().toLocaleString()} por hotel
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  type="date"
                  id="date"
                  value={formData.assignment_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Detalles adicionales..."
                  value={formData.notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando {formData.hotel_names.length} asignación(es)...
                  </>
                ) : success ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar {formData.hotel_names.length > 0 ? `${formData.hotel_names.length} ` : ""}Asignación
                    {formData.hotel_names.length !== 1 ? "es" : ""}
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
            <p>Para agregar nuevas asignaciones:</p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Selecciona el empleado que realizará el trabajo</li>
              <li>
                <strong>Selecciona uno o más hoteles</strong> donde trabajará el mismo día
              </li>
              <li>Establece la fecha de las asignaciones</li>
              <li>Opcionalmente, agrega notas o detalles sobre el trabajo</li>
              <li>Haz clic en "Agregar Asignaciones" para guardar</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium">💡 Consejo:</p>
              <p className="text-sm text-blue-700 mt-1">
                Si el empleado trabaja en múltiples hoteles el mismo día, selecciona todos los hoteles. Su tarifa diaria
                se dividirá automáticamente entre los hoteles seleccionados.
              </p>
            </div>
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium">✅ Ejemplo:</p>
              <p className="text-sm text-green-700 mt-1">
                Si Juan trabaja en "Monaco" y "Mallak" el mismo día, y su tarifa es $60,000, recibirá $30,000 por cada
                hotel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
