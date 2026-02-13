"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, X } from "lucide-react"
import {
  actualizarPrestamo,
  obtenerHoteles,
  obtenerResponsables,
  type Prestamo,
  type PrestamoInput,
} from "@/lib/prestamos-supabase"
import { supabase } from "@/lib/supabase"

interface EditarPrestamoProps {
  prestamoId: string | null
  abierto: boolean
  onCerrar: () => void
  onActualizado: () => void
}

export function EditarPrestamo({ prestamoId, abierto, onCerrar, onActualizado }: EditarPrestamoProps) {
  const { toast } = useToast()
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [hoteles, setHoteles] = useState<string[]>([])
  const [responsables, setResponsables] = useState<string[]>([])
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null)
  const [formulario, setFormulario] = useState<PrestamoInput>({
    fecha: "",
    responsable: "",
    hotel_origen: "",
    hotel_destino: "",
    producto: "",
    cantidad: "",
    valor: 0,
  })

  useEffect(() => {
    if (abierto && prestamoId) {
      cargarDatos()
    }
  }, [abierto, prestamoId])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const { data: prestamoRaw } = await supabase.from("prestamos").select("*").eq("id", prestamoId!).single()
      const [hotelesData, responsablesData] = await Promise.all([obtenerHoteles(), obtenerResponsables()])
      const prestamoData = prestamoRaw as Prestamo | null

      if (prestamoData) {
        setPrestamo(prestamoData)
        setFormulario({
          fecha: prestamoData.fecha,
          responsable: prestamoData.responsable,
          hotel_origen: prestamoData.hotel_origen,
          hotel_destino: prestamoData.hotel_destino,
          producto: prestamoData.producto,
          cantidad: prestamoData.cantidad,
          valor: prestamoData.valor,
        })
      }

      setHoteles(hotelesData)
      setResponsables(responsablesData)
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del préstamo",
        variant: "destructive",
      })
    } finally {
      setCargando(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formulario.fecha || !formulario.responsable || !formulario.hotel_origen || !formulario.hotel_destino) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    if (formulario.hotel_origen === formulario.hotel_destino) {
      toast({
        title: "Error",
        description: "El hotel origen y destino deben ser diferentes",
        variant: "destructive",
      })
      return
    }

    if (formulario.valor <= 0) {
      toast({
        title: "Error",
        description: "El valor debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    setGuardando(true)
    try {
      const prestamoActualizado = await actualizarPrestamo(prestamoId!, formulario)

      if (prestamoActualizado) {
        toast({
          title: "Éxito",
          description: "Préstamo actualizado correctamente",
        })
        onActualizado()
        onCerrar()
      } else {
        throw new Error("No se pudo actualizar el préstamo")
      }
    } catch (error) {
      console.error("Error actualizando préstamo:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el préstamo",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  const handleCerrar = () => {
    if (!guardando) {
      onCerrar()
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleCerrar}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-blue-600" />
            Editar Préstamo
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del préstamo. Todos los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        {cargando ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Cargando datos del préstamo...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsable">Responsable *</Label>
                <Select
                  value={formulario.responsable}
                  onValueChange={(value) => setFormulario({ ...formulario, responsable: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsables.map((responsable) => (
                      <SelectItem key={responsable} value={responsable}>
                        {responsable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotel_origen">Hotel Origen *</Label>
                <Select
                  value={formulario.hotel_origen}
                  onValueChange={(value) => setFormulario({ ...formulario, hotel_origen: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hotel origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoteles.map((hotel) => (
                      <SelectItem key={hotel} value={hotel}>
                        {hotel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotel_destino">Hotel Destino *</Label>
                <Select
                  value={formulario.hotel_destino}
                  onValueChange={(value) => setFormulario({ ...formulario, hotel_destino: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hotel destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoteles.map((hotel) => (
                      <SelectItem key={hotel} value={hotel}>
                        {hotel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="producto">Producto/Concepto *</Label>
              <Input
                id="producto"
                value={formulario.producto}
                onChange={(e) => setFormulario({ ...formulario, producto: e.target.value })}
                placeholder="Ej: Toallas, Efectivo, Productos de limpieza"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  value={formulario.cantidad}
                  onChange={(e) => setFormulario({ ...formulario, cantidad: e.target.value })}
                  placeholder="Ej: 20 unidades, 15 juegos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor ($) *</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.valor}
                  onChange={(e) => setFormulario({ ...formulario, valor: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Vista previa de cambios */}
            {prestamo && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Vista previa de cambios:</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span className={prestamo.fecha !== formulario.fecha ? "font-semibold text-blue-600" : ""}>
                      {formulario.fecha}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Responsable:</span>
                    <span
                      className={prestamo.responsable !== formulario.responsable ? "font-semibold text-blue-600" : ""}
                    >
                      {formulario.responsable}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ruta:</span>
                    <span
                      className={
                        prestamo.hotel_origen !== formulario.hotel_origen ||
                        prestamo.hotel_destino !== formulario.hotel_destino
                          ? "font-semibold text-blue-600"
                          : ""
                      }
                    >
                      {formulario.hotel_origen} → {formulario.hotel_destino}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Producto:</span>
                    <span className={prestamo.producto !== formulario.producto ? "font-semibold text-blue-600" : ""}>
                      {formulario.producto}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cantidad:</span>
                    <span className={prestamo.cantidad !== formulario.cantidad ? "font-semibold text-blue-600" : ""}>
                      {formulario.cantidad}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className={prestamo.valor !== formulario.valor ? "font-semibold text-blue-600" : ""}>
                      ${formulario.valor.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCerrar} disabled={guardando}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
