"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Save, AlertCircle, Building2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { crearPrestamo } from "@/lib/prestamos-db"
import { HOTELES } from "@/lib/prestamos-types"
import type { PrestamoInput } from "@/lib/prestamos-types"

interface IngresoManualProps {
  onPrestamoCreado?: () => void
}

export function IngresoManual({ onPrestamoCreado }: IngresoManualProps) {
  const { toast } = useToast()
  const [guardando, setGuardando] = useState(false)

  const [prestamo, setPrestamo] = useState<PrestamoInput & { producto?: string; cantidad?: number }>({
    responsable: "",
    hotel_origen: "",
    hotel_destino: "",
    producto: "",
    cantidad: 1,
    monto: 0,
    concepto: "",
    notas: "",
  })

  const [errors, setErrors] = useState<Partial<PrestamoInput>>({})
  const [showResumen, setShowResumen] = useState(false)

  const validateForm = () => {
    const newErrors: Partial<PrestamoInput> = {}

    if (!prestamo.responsable?.trim()) newErrors.responsable = "Ingresa el responsable"
    if (!prestamo.hotel_origen) newErrors.hotel_origen = "Selecciona el hotel que retira"
    if (!prestamo.hotel_destino) newErrors.hotel_destino = "Selecciona el hotel que recibe"
    if (!prestamo.producto?.trim()) newErrors.concepto = "Especifica el producto"
    if (!prestamo.cantidad || prestamo.cantidad <= 0) newErrors.concepto = "La cantidad debe ser mayor a 0"
    if (prestamo.monto <= 0) newErrors.monto = "El valor debe ser mayor a 0"

    if (prestamo.hotel_origen === prestamo.hotel_destino) {
      newErrors.hotel_origen = "No puede ser el mismo hotel"
      newErrors.hotel_destino = "No puede ser el mismo hotel"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Error en el formulario",
        description: "Por favor corrige los errores antes de continuar",
        variant: "destructive",
      })
      return
    }

    setShowResumen(true)
  }

  const confirmarPrestamo = async () => {
    setGuardando(true)
    try {
      const prestamoFinal: PrestamoInput = {
        ...prestamo,
        concepto: `${prestamo.producto} (${prestamo.cantidad} unidades)`,
        notas: `Préstamo de ${prestamo.cantidad} ${prestamo.producto} por valor de $${prestamo.monto.toLocaleString()}. Responsable: ${prestamo.responsable}${prestamo.notas ? `. ${prestamo.notas}` : ""}`,
      }

      const nuevoPrestamo = await crearPrestamo(prestamoFinal)

      if (nuevoPrestamo) {
        toast({
          title: "¡Préstamo registrado!",
          description: `Préstamo de ${prestamo.producto} registrado exitosamente`,
        })

        // Resetear formulario
        setPrestamo({
          responsable: "",
          hotel_origen: "",
          hotel_destino: "",
          producto: "",
          cantidad: 1,
          monto: 0,
          concepto: "",
          notas: "",
        })
        setShowResumen(false)
        setErrors({})

        if (onPrestamoCreado) {
          onPrestamoCreado()
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo registrar el préstamo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al crear préstamo:", error)
      toast({
        title: "Error",
        description: "Error al registrar el préstamo",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  if (showResumen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Confirmar Préstamo
          </CardTitle>
          <CardDescription>Revisa los datos antes de guardar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Responsable:</span>
              <Badge variant="outline">{prestamo.responsable}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Hotel que Retira:</span>
              <Badge className="bg-red-100 text-red-800">{prestamo.hotel_origen}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Hotel que Recibe:</span>
              <Badge className="bg-green-100 text-green-800">{prestamo.hotel_destino}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Producto:</span>
              <span>{prestamo.producto}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Cantidad:</span>
              <span>{prestamo.cantidad}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Valor:</span>
              <span className="text-xl font-bold text-orange-600">${prestamo.monto.toLocaleString()}</span>
            </div>
            {prestamo.notas && (
              <div>
                <span className="font-medium">Notas:</span>
                <p className="text-sm text-gray-600 mt-1">{prestamo.notas}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={confirmarPrestamo}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Confirmar Préstamo
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowResumen(false)} disabled={guardando}>
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-600" />
          Ingreso Manual
        </CardTitle>
        <CardDescription>Registra préstamos con información detallada y personalizada</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsable">Responsable *</Label>
            <Input
              id="responsable"
              value={prestamo.responsable}
              onChange={(e) => setPrestamo({ ...prestamo, responsable: e.target.value })}
              placeholder="Ingresa el nombre del responsable"
              className={errors.responsable ? "border-red-500" : ""}
            />
            {errors.responsable && <p className="text-sm text-red-500">{errors.responsable}</p>}
          </div>

          {/* 2. Hotel que Retira */}
          <div className="space-y-2">
            <Label htmlFor="hotelOrigen">Hotel que Retira *</Label>
            <Select
              value={prestamo.hotel_origen}
              onValueChange={(value) => setPrestamo({ ...prestamo, hotel_origen: value })}
            >
              <SelectTrigger className={errors.hotel_origen ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona el hotel que retira" />
              </SelectTrigger>
              <SelectContent>
                {HOTELES.map((hotel) => (
                  <SelectItem key={hotel} value={hotel}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {hotel}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hotel_origen && <p className="text-sm text-red-500">{errors.hotel_origen}</p>}
          </div>

          {/* 3. Hotel que Recibe */}
          <div className="space-y-2">
            <Label htmlFor="hotelDestino">Hotel que Recibe *</Label>
            <Select
              value={prestamo.hotel_destino}
              onValueChange={(value) => setPrestamo({ ...prestamo, hotel_destino: value })}
            >
              <SelectTrigger className={errors.hotel_destino ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona el hotel que recibe" />
              </SelectTrigger>
              <SelectContent>
                {HOTELES.filter((hotel) => hotel !== prestamo.hotel_origen).map((hotel) => (
                  <SelectItem key={hotel} value={hotel}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {hotel}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hotel_destino && <p className="text-sm text-red-500">{errors.hotel_destino}</p>}
          </div>

          {/* 4. Producto */}
          <div className="space-y-2">
            <Label htmlFor="producto">Producto *</Label>
            <Input
              id="producto"
              value={prestamo.producto || ""}
              onChange={(e) => setPrestamo({ ...prestamo, producto: e.target.value })}
              placeholder="Ej: Toallas, Sábanas, Efectivo, etc."
              className={errors.concepto ? "border-red-500" : ""}
            />
            {errors.concepto && <p className="text-sm text-red-500">{errors.concepto}</p>}
          </div>

          {/* 5. Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad *</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              step="1"
              value={prestamo.cantidad || ""}
              onChange={(e) => setPrestamo({ ...prestamo, cantidad: Number.parseInt(e.target.value) || 1 })}
              placeholder="1"
              className={errors.concepto ? "border-red-500" : ""}
            />
          </div>

          {/* 6. Valor */}
          <div className="space-y-2">
            <Label htmlFor="monto">Valor (ARS) *</Label>
            <Input
              id="monto"
              type="number"
              min="0"
              step="1"
              value={prestamo.monto || ""}
              onChange={(e) => setPrestamo({ ...prestamo, monto: Number.parseInt(e.target.value) || 0 })}
              placeholder="0"
              className={errors.monto ? "border-red-500" : ""}
            />
            {errors.monto && <p className="text-sm text-red-500">{errors.monto}</p>}
          </div>

          {/* Notas Adicionales (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas Adicionales</Label>
            <Textarea
              id="notas"
              value={prestamo.notas}
              onChange={(e) => setPrestamo({ ...prestamo, notas: e.target.value })}
              placeholder="Información adicional sobre el préstamo..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Préstamo
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
