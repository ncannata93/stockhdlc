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
import { Loader2, Plus, Check, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function EmpleadosAgregar() {
  const { getEmployees, saveAssignment, getHotels, createHotel } = useEmployeeDB()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<{ id: number; name: string; daily_rate: number }[]>([])
  const [hotels, setHotels] = useState<{ id: string | number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [showHotelDialog, setShowHotelDialog] = useState(false)
  const [creatingHotel, setCreatingHotel] = useState(false)
  const [newHotelName, setNewHotelName] = useState("")
  const [newHotelCode, setNewHotelCode] = useState("")

  // Estado del formulario
  const [formData, setFormData] = useState({
    employee_id: "",
    hotel_names: [] as string[],
    assignment_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [employeesData, hotelsData] = await Promise.all([getEmployees(), getHotels()])

        setEmployees(employeesData.map((emp) => ({ id: emp.id, name: emp.name, daily_rate: emp.daily_rate })))
        setHotels(hotelsData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [getEmployees, getHotels, toast])

  const handleCreateHotel = async () => {
    if (!newHotelName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del hotel es requerido",
        variant: "destructive",
      })
      return
    }

    setCreatingHotel(true)
    try {
      const result = await createHotel({
        name: newHotelName.trim(),
        code: newHotelCode.trim() || undefined,
      })

      if (result) {
        toast({
          title: "Éxito",
          description: `Hotel "${result.name}" creado correctamente`,
        })

        // Reload hotels list
        const hotelsData = await getHotels()
        setHotels(hotelsData)

        // Close dialog and reset form
        setShowHotelDialog(false)
        setNewHotelName("")
        setNewHotelCode("")
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el hotel",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating hotel:", error)
      toast({
        title: "Error",
        description: "Error al crear el hotel",
        variant: "destructive",
      })
    } finally {
      setCreatingHotel(false)
    }
  }

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

      const dividedRate = Math.round(employee.daily_rate / formData.hotel_names.length)
      const assignmentDate = formData.assignment_date

      console.log(`📊 TARIFA HISTÓRICA - Empleado: ${employee.name}`)
      console.log(`💰 Tarifa diaria original: $${employee.daily_rate}`)
      console.log(`🏨 Número de hoteles: ${formData.hotel_names.length}`)
      console.log(`🔒 Tarifa dividida FIJA: $${dividedRate}`)
      console.log(`📅 Fecha: ${assignmentDate}`)

      const promises = formData.hotel_names.map((hotelName, index) => {
        console.log(`🆕 Creando asignación ${index + 1}/${formData.hotel_names.length}:`)
        console.log(`   🏨 Hotel: ${hotelName}`)
        console.log(`   💰 Tarifa histórica: $${dividedRate}`)

        return saveAssignment({
          employee_id: Number.parseInt(formData.employee_id),
          hotel_name: hotelName,
          assignment_date: assignmentDate,
          daily_rate_used: dividedRate,
          notes: formData.notes
            ? `${formData.notes} | Tarifa histórica: $${dividedRate} (dividida entre ${formData.hotel_names.length} hoteles)`
            : `Tarifa histórica: $${dividedRate} (dividida entre ${formData.hotel_names.length} hoteles el ${new Date().toLocaleDateString()})`,
        })
      })

      const results = await Promise.all(promises)

      if (results.every((result) => result !== null)) {
        toast({
          title: "Éxito",
          description: `${formData.hotel_names.length} asignación(es) guardada(s) correctamente`,
        })

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
                <div className="flex items-center justify-between">
                  <Label>Hoteles (selecciona uno o más)</Label>
                  <Dialog open={showHotelDialog} onOpenChange={setShowHotelDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Building2 className="h-4 w-4 mr-2" />
                        Nuevo Hotel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Hotel</DialogTitle>
                        <DialogDescription>
                          Agrega un nuevo hotel al listado para poder asignar empleados.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="hotel-name">Nombre del Hotel *</Label>
                          <Input
                            id="hotel-name"
                            placeholder="Ej: Hotel Paraíso"
                            value={newHotelName}
                            onChange={(e) => setNewHotelName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hotel-code">Código (opcional)</Label>
                          <Input
                            id="hotel-code"
                            placeholder="Ej: PAR"
                            maxLength={3}
                            value={newHotelCode}
                            onChange={(e) => setNewHotelCode(e.target.value.toUpperCase())}
                          />
                          <p className="text-xs text-muted-foreground">
                            Si no se especifica, se generará automáticamente
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowHotelDialog(false)
                            setNewHotelName("")
                            setNewHotelCode("")
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="button" onClick={handleCreateHotel} disabled={creatingHotel}>
                          {creatingHotel ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creando...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Crear Hotel
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hotel-${hotel.id}`}
                        checked={formData.hotel_names.includes(hotel.name)}
                        onCheckedChange={(checked) => handleHotelChange(hotel.name, checked as boolean)}
                      />
                      <Label htmlFor={`hotel-${hotel.id}`} className="text-sm font-normal cursor-pointer">
                        {hotel.name}
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
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-sm text-purple-800 font-medium">🏨 Nuevo Hotel:</p>
              <p className="text-sm text-purple-700 mt-1">
                Si necesitas agregar un hotel que no está en la lista, haz clic en el botón "Nuevo Hotel" junto a la
                sección de hoteles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
