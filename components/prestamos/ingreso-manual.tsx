"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, CheckCircle, AlertCircle } from "lucide-react"
import { crearPrestamo } from "@/lib/prestamos-db"
import { HOTELES, RESPONSABLES } from "@/lib/prestamos-types"
import type { PrestamoInput } from "@/lib/prestamos-types"

interface IngresoManualProps {
  onPrestamoCreado?: () => void
}

export function IngresoManual({ onPrestamoCreado }: IngresoManualProps) {
  const [formData, setFormData] = useState<PrestamoInput>({
    fecha: new Date().toISOString().split("T")[0],
    hotelOrigen: "",
    hotelDestino: "",
    monto: 0,
    concepto: "",
    responsable: "",
    notas: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.hotelOrigen ||
      !formData.hotelDestino ||
      !formData.monto ||
      !formData.concepto ||
      !formData.responsable
    ) {
      setMensaje({ tipo: "error", texto: "Por favor completa todos los campos obligatorios" })
      return
    }

    if (formData.hotelOrigen === formData.hotelDestino) {
      setMensaje({ tipo: "error", texto: "Los hoteles deben ser diferentes" })
      return
    }

    if (formData.monto <= 0) {
      setMensaje({ tipo: "error", texto: "El monto debe ser mayor a 0" })
      return
    }

    setIsLoading(true)
    setMensaje(null)

    try {
      const resultado = await crearPrestamo(formData)

      if (resultado) {
        setMensaje({ tipo: "success", texto: "Préstamo registrado exitosamente" })
        setFormData({
          fecha: new Date().toISOString().split("T")[0],
          hotelOrigen: "",
          hotelDestino: "",
          monto: 0,
          concepto: "",
          responsable: "",
          notas: "",
        })
        onPrestamoCreado?.()
      } else {
        setMensaje({ tipo: "error", texto: "Error al registrar el préstamo" })
      }
    } catch (error) {
      console.error("Error:", error)
      setMensaje({ tipo: "error", texto: "Error inesperado al registrar el préstamo" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Ingreso Manual
        </CardTitle>
        <CardDescription>Registra préstamos con información detallada y personalizada</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            />
          </div>

          {/* Hoteles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelOrigen">Hotel Origen (Presta)</Label>
              <Select
                value={formData.hotelOrigen}
                onValueChange={(value) => setFormData({ ...formData, hotelOrigen: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona hotel origen" />
                </SelectTrigger>
                <SelectContent>
                  {HOTELES.map((hotel) => (
                    <SelectItem key={hotel} value={hotel}>
                      {hotel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelDestino">Hotel Destino (Recibe)</Label>
              <Select
                value={formData.hotelDestino}
                onValueChange={(value) => setFormData({ ...formData, hotelDestino: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona hotel destino" />
                </SelectTrigger>
                <SelectContent>
                  {HOTELES.filter((hotel) => hotel !== formData.hotelOrigen).map((hotel) => (
                    <SelectItem key={hotel} value={hotel}>
                      {hotel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto *</Label>
            <Input
              id="monto"
              type="number"
              placeholder="0"
              value={formData.monto || ""}
              onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
              min="1"
              step="1"
            />
          </div>

          {/* Concepto */}
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto *</Label>
            <Input
              id="concepto"
              placeholder="Descripción del préstamo"
              value={formData.concepto}
              onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
            />
          </div>

          {/* Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsable">Responsable *</Label>
            <Select
              value={formData.responsable}
              onValueChange={(value) => setFormData({ ...formData, responsable: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona responsable" />
              </SelectTrigger>
              <SelectContent>
                {RESPONSABLES.map((responsable) => (
                  <SelectItem key={responsable} value={responsable}>
                    {responsable}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas Adicionales</Label>
            <Textarea
              id="notas"
              placeholder="Información adicional sobre el préstamo..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
            />
          </div>

          {/* Mensaje de Estado */}
          {mensaje && (
            <Alert variant={mensaje.tipo === "error" ? "destructive" : "default"}>
              {mensaje.tipo === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{mensaje.texto}</AlertDescription>
            </Alert>
          )}

          {/* Botón de Envío */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Registrando..." : "Registrar Préstamo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
