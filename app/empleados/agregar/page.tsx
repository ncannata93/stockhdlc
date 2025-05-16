"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

// Datos actualizados con los empleados y hoteles proporcionados
const empleados = [
  { id: 1, nombre: "Diego" },
  { id: 2, nombre: "Tucu" },
  { id: 3, nombre: "David" },
  { id: 4, nombre: "Freire" },
]

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

export default function AgregarPage() {
  const [fecha, setFecha] = useState("")
  const [empleado, setEmpleado] = useState("")
  const [hotel, setHotel] = useState("")
  const [nuevoEmpleado, setNuevoEmpleado] = useState({ nombre: "", telefono: "", email: "" })
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fecha || !empleado || !hotel) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      })
      return
    }

    // Aquí iría la lógica para guardar el registro
    toast({
      title: "Registro exitoso",
      description: "El registro ha sido guardado correctamente",
    })

    // Resetear formulario
    setFecha("")
    setEmpleado("")
    setHotel("")
  }

  const handleNuevoEmpleado = () => {
    if (!nuevoEmpleado.nombre || !nuevoEmpleado.telefono || !nuevoEmpleado.email) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos del nuevo empleado",
        variant: "destructive",
      })
      return
    }

    // Aquí iría la lógica para guardar el nuevo empleado
    toast({
      title: "Empleado agregado",
      description: "El nuevo empleado ha sido agregado correctamente",
    })

    setDialogOpen(false)
    setNuevoEmpleado({ nombre: "", telefono: "", email: "" })
  }

  return (
    <div className="min-h-screen bg-[#f0f8ff] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agregar Registro</h1>
            <p className="text-gray-500">Registre nuevos empleados y asignaciones</p>
          </div>
          <Link href="/empleados">
            <Button variant="outline">← Volver</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nuevo Registro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="empleado">Empleado</Label>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        + Nuevo Empleado
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="nombre">Nombre Completo</Label>
                          <Input
                            id="nombre"
                            value={nuevoEmpleado.nombre}
                            onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefono">Teléfono</Label>
                          <Input
                            id="telefono"
                            value={nuevoEmpleado.telefono}
                            onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, telefono: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={nuevoEmpleado.email}
                            onChange={(e) => setNuevoEmpleado({ ...nuevoEmpleado, email: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={handleNuevoEmpleado} className="bg-blue-600 hover:bg-blue-700">
                            Guardar Empleado
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={empleado} onValueChange={setEmpleado} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel</Label>
                <Select value={hotel} onValueChange={setHotel} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoteles.map((h) => (
                      <SelectItem key={h.id} value={h.id.toString()}>
                        {h.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Guardar Registro
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <footer className="text-center text-sm text-gray-500 mt-8">
          © 2025 Hoteles de la Costa. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
}
