"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Datos de ejemplo para el calendario
const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const años = ["2024", "2025", "2026"]

// Lista de empleados
const empleados = [
  { id: 1, nombre: "Diego" },
  { id: 2, nombre: "Tucu" },
  { id: 3, nombre: "David" },
  { id: 4, nombre: "Freire" },
]

// Lista de hoteles
const hoteles = [
  { id: 1, nombre: "Jaguel" },
  { id: 2, nombre: "Monaco" },
  { id: 3, nombre: "Mallak" },
  { id: 4, nombre: "Argentina" },
  { id: 5, nombre: "Falkner" },
  { id: 6, nombre: "Stromboli" },
  { id: 7, nombre: "San Miguel" },
  { id: 8, nombre: "Colores" },
  { id: 9, nombre: "Puntarenas" },
  { id: 10, nombre: "Tupe" },
  { id: 11, nombre: "Munich" },
  { id: 12, nombre: "Tiburones" },
  { id: 13, nombre: "Barlovento" },
  { id: 14, nombre: "Carama" },
]

// Datos de ejemplo actualizados con los empleados y hoteles proporcionados
const asignacionesIniciales = [
  { id: 1, fecha: "2025-05-01", empleado: "Diego", hotel: "Jaguel" },
  { id: 2, fecha: "2025-05-01", empleado: "Tucu", hotel: "Monaco" },
  { id: 3, fecha: "2025-05-02", empleado: "David", hotel: "Mallak" },
  { id: 4, fecha: "2025-05-03", empleado: "Freire", hotel: "Argentina" },
  { id: 5, fecha: "2025-05-04", empleado: "Diego", hotel: "Falkner" },
  { id: 6, fecha: "2025-05-05", empleado: "Tucu", hotel: "Stromboli" },
  { id: 7, fecha: "2025-05-06", empleado: "David", hotel: "San Miguel" },
  { id: 8, fecha: "2025-05-07", empleado: "Freire", hotel: "Colores" },
  { id: 9, fecha: "2025-05-08", empleado: "Diego", hotel: "Puntarenas" },
  { id: 10, fecha: "2025-05-09", empleado: "Tucu", hotel: "Tupe" },
  { id: 11, fecha: "2025-05-10", empleado: "David", hotel: "Munich" },
  { id: 12, fecha: "2025-05-15", empleado: "Freire", hotel: "Tiburones" },
  { id: 13, fecha: "2025-05-16", empleado: "Diego", hotel: "Barlovento" },
  { id: 14, fecha: "2025-05-17", empleado: "Tucu", hotel: "Carama" },
  { id: 15, fecha: "2025-05-18", empleado: "David", hotel: "Jaguel" },
]

// Función para obtener el color del hotel
const getHotelColor = (hotel: string) => {
  const hotelColors: { [key: string]: string } = {
    Jaguel: "bg-blue-100 text-blue-800",
    Monaco: "bg-green-100 text-green-800",
    Mallak: "bg-amber-100 text-amber-800",
    Argentina: "bg-red-100 text-red-800",
    Falkner: "bg-purple-100 text-purple-800",
    Stromboli: "bg-pink-100 text-pink-800",
    "San Miguel": "bg-indigo-100 text-indigo-800",
    Colores: "bg-yellow-100 text-yellow-800",
    Puntarenas: "bg-cyan-100 text-cyan-800",
    Tupe: "bg-emerald-100 text-emerald-800",
    Munich: "bg-violet-100 text-violet-800",
    Tiburones: "bg-orange-100 text-orange-800",
    Barlovento: "bg-lime-100 text-lime-800",
    Carama: "bg-rose-100 text-rose-800",
  }

  return hotelColors[hotel] || "bg-gray-100 text-gray-800"
}

export default function CalendarioPage() {
  const [mes, setMes] = useState("4") // Mayo (0-indexed)
  const [año, setAño] = useState("2025")
  const [asignaciones, setAsignaciones] = useState(asignacionesIniciales)
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState<any>(null)
  const [editarDialogOpen, setEditarDialogOpen] = useState(false)
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false)
  const [asignacionEditada, setAsignacionEditada] = useState({
    id: 0,
    fecha: "",
    empleado: "",
    hotel: "",
  })

  // Generar días del mes
  const getDiasEnMes = (año: number, mes: number) => {
    return new Date(año, mes + 1, 0).getDate()
  }

  const getPrimerDiaSemana = (año: number, mes: number) => {
    return new Date(año, mes, 1).getDay()
  }

  const diasEnMes = getDiasEnMes(Number.parseInt(año), Number.parseInt(mes))
  const primerDiaSemana = getPrimerDiaSemana(Number.parseInt(año), Number.parseInt(mes))

  // Crear array de días
  const dias = []
  for (let i = 0; i < primerDiaSemana; i++) {
    dias.push(null) // Días vacíos al inicio
  }
  for (let i = 1; i <= diasEnMes; i++) {
    dias.push(i)
  }

  // Obtener asignaciones para un día específico
  const getAsignacionesPorDia = (dia: number) => {
    const fechaStr = `${año}-${(Number.parseInt(mes) + 1).toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`
    return asignaciones.filter((a) => a.fecha === fechaStr)
  }

  // Manejar clic en una asignación
  const handleAsignacionClick = (asignacion: any) => {
    setAsignacionSeleccionada(asignacion)
    setAsignacionEditada({
      id: asignacion.id,
      fecha: asignacion.fecha,
      empleado: asignacion.empleado,
      hotel: asignacion.hotel,
    })
    setEditarDialogOpen(true)
  }

  // Manejar edición de asignación
  const handleEditarAsignacion = () => {
    // Actualizar la asignación en el estado
    const nuevasAsignaciones = asignaciones.map((a) => (a.id === asignacionEditada.id ? asignacionEditada : a))

    setAsignaciones(nuevasAsignaciones)
    setEditarDialogOpen(false)

    toast({
      title: "Asignación actualizada",
      description: "La asignación ha sido actualizada correctamente",
    })
  }

  // Manejar eliminación de asignación
  const handleEliminarAsignacion = () => {
    // Filtrar la asignación del estado
    const nuevasAsignaciones = asignaciones.filter((a) => a.id !== asignacionSeleccionada.id)

    setAsignaciones(nuevasAsignaciones)
    setEliminarDialogOpen(false)
    setEditarDialogOpen(false)

    toast({
      title: "Asignación eliminada",
      description: "La asignación ha sido eliminada correctamente",
    })
  }

  return (
    <div className="min-h-screen bg-[#f0f8ff] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendario de Asignaciones</h1>
            <p className="text-gray-500">Visualice las asignaciones de empleados por fecha</p>
          </div>
          <Link href="/empleados">
            <Button variant="outline">← Volver</Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Calendario</CardTitle>
            <div className="flex space-x-2">
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((nombreMes, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {nombreMes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={año} onValueChange={setAño}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {años.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center font-medium mb-2">
              <div>Dom</div>
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div>Sáb</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {dias.map((dia, index) => (
                <div key={index} className={`min-h-[120px] p-2 border rounded-md ${dia ? "bg-white" : "bg-gray-50"}`}>
                  {dia && (
                    <>
                      <div className="font-medium mb-2">{dia}</div>
                      <div className="space-y-1 overflow-y-auto max-h-[80px]">
                        {getAsignacionesPorDia(dia).map((asignacion, idx) => (
                          <Badge
                            key={idx}
                            className={`block text-xs truncate ${getHotelColor(asignacion.hotel)} cursor-pointer hover:opacity-80`}
                            variant="outline"
                            onClick={() => handleAsignacionClick(asignacion)}
                          >
                            {asignacion.empleado}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500">Haga clic en una asignación para editarla o eliminarla</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leyenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <Badge className="bg-blue-100 text-blue-800" variant="outline">
                  Jaguel
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-green-100 text-green-800" variant="outline">
                  Monaco
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-amber-100 text-amber-800" variant="outline">
                  Mallak
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-red-100 text-red-800" variant="outline">
                  Argentina
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-purple-100 text-purple-800" variant="outline">
                  Falkner
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-pink-100 text-pink-800" variant="outline">
                  Stromboli
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-indigo-100 text-indigo-800" variant="outline">
                  San Miguel
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-yellow-100 text-yellow-800" variant="outline">
                  Colores
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-cyan-100 text-cyan-800" variant="outline">
                  Puntarenas
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-emerald-100 text-emerald-800" variant="outline">
                  Tupe
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-violet-100 text-violet-800" variant="outline">
                  Munich
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-orange-100 text-orange-800" variant="outline">
                  Tiburones
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-lime-100 text-lime-800" variant="outline">
                  Barlovento
                </Badge>
              </div>
              <div className="flex items-center">
                <Badge className="bg-rose-100 text-rose-800" variant="outline">
                  Carama
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diálogo para editar asignación */}
        <Dialog open={editarDialogOpen} onOpenChange={setEditarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Asignación</DialogTitle>
            </DialogHeader>
            {asignacionSeleccionada && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={asignacionEditada.fecha}
                    onChange={(e) => setAsignacionEditada({ ...asignacionEditada, fecha: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empleado">Empleado</Label>
                  <Select
                    value={asignacionEditada.empleado}
                    onValueChange={(value) => setAsignacionEditada({ ...asignacionEditada, empleado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {empleados.map((emp) => (
                        <SelectItem key={emp.id} value={emp.nombre}>
                          {emp.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hotel">Hotel</Label>
                  <Select
                    value={asignacionEditada.hotel}
                    onValueChange={(value) => setAsignacionEditada({ ...asignacionEditada, hotel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hoteles.map((h) => (
                        <SelectItem key={h.id} value={h.nombre}>
                          {h.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                className="bg-red-100 text-red-800 hover:bg-red-200"
                onClick={() => setEliminarDialogOpen(true)}
              >
                Eliminar
              </Button>
              <Button onClick={handleEditarAsignacion} className="bg-blue-600 hover:bg-blue-700">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para eliminar */}
        <AlertDialog open={eliminarDialogOpen} onOpenChange={setEliminarDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente la asignación del empleado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEliminarAsignacion} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <footer className="text-center text-sm text-gray-500 mt-8">
          © 2025 Hoteles de la Costa. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
}
