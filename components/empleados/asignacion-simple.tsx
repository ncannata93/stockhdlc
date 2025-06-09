"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useEmployeeDB } from "@/lib/employee-db"
import { HOTELS } from "@/lib/employee-types"
import { Loader2, Check, Calendar, User, Building, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AsignacionSimple() {
  const { getEmployees, saveAssignment } = useEmployeeDB()
  const { toast } = useToast()
  const [step, setStep] = useState<"fecha" | "empleado" | "hotel" | "exito">("fecha")
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<{ id: number; name: string; daily_rate: number }[]>([])

  // Estado del formulario
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"))
  const [empleadoId, setEmpleadoId] = useState("")
  const [hotelesSeleccionados, setHotelesSeleccionados] = useState<string[]>([])

  // Formatear fecha para mostrar
  const fechaFormateada = () => {
    try {
      return format(new Date(fecha), "EEEE d 'de' MMMM, yyyy", { locale: es })
    } catch (e) {
      return fecha
    }
  }

  // Cargar empleados cuando sea necesario
  const cargarEmpleados = async () => {
    if (employees.length === 0) {
      setLoading(true)
      try {
        const data = await getEmployees()
        setEmployees(
          data.map((emp) => ({
            id: emp.id,
            name: emp.name,
            daily_rate: emp.daily_rate,
          })),
        )
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
  }

  // Manejar selección de hoteles
  const toggleHotel = (hotel: string) => {
    setHotelesSeleccionados((prev) => (prev.includes(hotel) ? prev.filter((h) => h !== hotel) : [...prev, hotel]))
  }

  // Remover hotel seleccionado
  const removerHotel = (hotel: string) => {
    setHotelesSeleccionados((prev) => prev.filter((h) => h !== hotel))
  }

  // Avanzar al siguiente paso
  const siguientePaso = async () => {
    if (step === "fecha") {
      await cargarEmpleados()
      setStep("empleado")
    } else if (step === "empleado") {
      setStep("hotel")
    } else if (step === "hotel") {
      await guardarAsignaciones()
    }
  }

  // Volver al paso anterior
  const pasoAnterior = () => {
    if (step === "empleado") {
      setStep("fecha")
    } else if (step === "hotel") {
      setStep("empleado")
    } else if (step === "exito") {
      // Reiniciar todo
      setFecha(format(new Date(), "yyyy-MM-dd"))
      setEmpleadoId("")
      setHotelesSeleccionados([])
      setStep("fecha")
    }
  }

  // Guardar las asignaciones (una por cada hotel)
  const guardarAsignaciones = async () => {
    setLoading(true)
    try {
      const empleado = employees.find((e) => e.id.toString() === empleadoId)
      if (!empleado) {
        throw new Error("Empleado no encontrado")
      }

      // Calcular tarifa dividida entre hoteles
      const tarifaDividida = empleado.daily_rate / hotelesSeleccionados.length

      // Guardar una asignación por cada hotel
      const promesas = hotelesSeleccionados.map((hotel) =>
        saveAssignment({
          employee_id: empleado.id,
          hotel_name: hotel,
          assignment_date: fecha,
          daily_rate_used: tarifaDividida,
        }),
      )

      const resultados = await Promise.all(promesas)

      if (resultados.every((r) => r)) {
        toast({
          title: "¡Asignaciones guardadas!",
          description: `${empleado.name} asignado a ${hotelesSeleccionados.length} hotel(es) el ${fechaFormateada()}`,
        })
        setStep("exito")
      } else {
        throw new Error("No se pudieron guardar todas las asignaciones")
      }
    } catch (error) {
      console.error("Error al guardar:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las asignaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Reiniciar para nueva asignación
  const nuevaAsignacion = () => {
    setFecha(format(new Date(), "yyyy-MM-dd"))
    setEmpleadoId("")
    setHotelesSeleccionados([])
    setStep("fecha")
  }

  // Obtener nombre del empleado
  const nombreEmpleado = () => {
    const empleado = employees.find((e) => e.id.toString() === empleadoId)
    return empleado?.name || ""
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-600">Asignación Diaria</h1>
        <p className="text-gray-500 mt-1">Formulario simplificado</p>
      </div>

      {step === "fecha" && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="font-medium">Paso 1: Selecciona la fecha</h2>
              <p className="text-sm text-gray-500">¿Qué día trabajó el empleado?</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha de trabajo:</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="text-lg"
            />
          </div>

          <div className="pt-2">
            <Button onClick={siguientePaso} className="w-full text-lg py-6" disabled={!fecha}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {step === "empleado" && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="font-medium">Paso 2: Selecciona el empleado</h2>
              <p className="text-sm text-gray-500">¿Quién trabajó el {fechaFormateada()}?</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="empleado">Empleado:</Label>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <Select value={empleadoId} onValueChange={setEmpleadoId}>
                <SelectTrigger className="text-lg py-6">
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()} className="text-lg py-2">
                      {emp.name} - ${emp.daily_rate.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex space-x-2 pt-2">
            <Button onClick={pasoAnterior} variant="outline" className="flex-1 text-lg py-6">
              Atrás
            </Button>
            <Button onClick={siguientePaso} className="flex-1 text-lg py-6" disabled={!empleadoId || loading}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {step === "hotel" && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg flex items-center space-x-3">
            <Building className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="font-medium">Paso 3: Selecciona los hoteles</h2>
              <p className="text-sm text-gray-500">¿En qué hoteles trabajó {nombreEmpleado()}?</p>
            </div>
          </div>

          {/* Hoteles seleccionados */}
          {hotelesSeleccionados.length > 0 && (
            <div className="space-y-2">
              <Label>Hoteles seleccionados:</Label>
              <div className="flex flex-wrap gap-2">
                {hotelesSeleccionados.map((hotel) => (
                  <div
                    key={hotel}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center space-x-2"
                  >
                    <span>{hotel}</span>
                    <button onClick={() => removerHotel(hotel)} className="text-blue-600 hover:text-blue-800">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Tarifa dividida: $
                {(employees.find((e) => e.id.toString() === empleadoId)?.daily_rate || 0) / hotelesSeleccionados.length}{" "}
                por hotel
              </p>
            </div>
          )}

          {/* Lista de hoteles disponibles */}
          <div className="space-y-2">
            <Label>Selecciona hoteles:</Label>
            <div className="space-y-2">
              {HOTELS.map((hotel) => (
                <div key={hotel} className="flex items-center space-x-3">
                  <Checkbox
                    id={hotel}
                    checked={hotelesSeleccionados.includes(hotel)}
                    onCheckedChange={() => toggleHotel(hotel)}
                  />
                  <Label htmlFor={hotel} className="text-lg cursor-pointer flex-1">
                    {hotel}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button onClick={pasoAnterior} variant="outline" className="flex-1 text-lg py-6">
              Atrás
            </Button>
            <Button
              onClick={siguientePaso}
              className="flex-1 text-lg py-6"
              disabled={hotelesSeleccionados.length === 0 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                `Guardar ${hotelesSeleccionados.length} Asignación${hotelesSeleccionados.length > 1 ? "es" : ""}`
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "exito" && (
        <div className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-medium text-green-800">¡Asignaciones guardadas!</h2>
            <p className="mt-2 text-green-700">
              {nombreEmpleado()} ha sido asignado a {hotelesSeleccionados.length} hotel(es) el {fechaFormateada()}.
            </p>
            <div className="mt-3 text-sm text-green-600">
              <p>Hoteles: {hotelesSeleccionados.join(", ")}</p>
              <p>
                Tarifa por hotel: $
                {(employees.find((e) => e.id.toString() === empleadoId)?.daily_rate || 0) / hotelesSeleccionados.length}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button onClick={nuevaAsignacion} className="w-full text-lg py-6 bg-green-600 hover:bg-green-700">
              Crear Nueva Asignación
            </Button>
            <Button onClick={pasoAnterior} variant="outline" className="w-full text-lg py-4">
              Modificar Esta Asignación
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
