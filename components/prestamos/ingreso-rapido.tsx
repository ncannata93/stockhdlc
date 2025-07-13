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
import { Zap, CheckCircle, AlertCircle } from "lucide-react"
import { procesarIngresoRapido } from "@/lib/prestamos-db"
import { HOTELES, RESPONSABLES } from "@/lib/prestamos-types"
import type { PrestamoRapidoType } from "@/lib/prestamos-types"

interface IngresoRapidoProps {
  onPrestamoCreado?: () => void
}

export function IngresoRapido({ onPrestamoCreado }: IngresoRapidoProps) {
  const [formData, setFormData] = useState<PrestamoRapidoType>({
    tipo: "prestamo",
    hotel1: "",
    hotel2: "",
    monto: 0,
    concepto: "",
    responsable: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.hotel1 || !formData.hotel2 || !formData.monto || !formData.responsable) {
      setMensaje({ tipo: "error", texto: "Por favor completa todos los campos obligatorios" })
      return
    }

    if (formData.hotel1 === formData.hotel2) {
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
      const resultado = await procesarIngresoRapido(formData)

      if (resultado) {
        setMensaje({ tipo: "success", texto: "Préstamo registrado exitosamente" })
        setFormData({
          tipo: "prestamo",
          hotel1: "",
          hotel2: "",
          monto: 0,
          concepto: "",
          responsable: "",
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
          <Zap className="h-5 w-5 text-orange-600" />
          Ingreso Rápido
        </CardTitle>
        <CardDescription>Registra préstamos y devoluciones de forma rápida entre hoteles</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Operación */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Operación</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "prestamo" | "devolucion") => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prestamo">Préstamo</SelectItem>
                <SelectItem value="devolucion">Devolución</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hoteles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotel1">{formData.tipo === "prestamo" ? "Hotel que Presta" : "Hotel que Devuelve"}</Label>
              <Select value={formData.hotel1} onValueChange={(value) => setFormData({ ...formData, hotel1: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona hotel" />
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
              <Label htmlFor="hotel2">
                {formData.tipo === "prestamo" ? "Hotel que Recibe" : "Hotel que Recibe la Devolución"}
              </Label>
              <Select value={formData.hotel2} onValueChange={(value) => setFormData({ ...formData, hotel2: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona hotel" />
                </SelectTrigger>
                <SelectContent>
                  {HOTELES.filter((hotel) => hotel !== formData.hotel1).map((hotel) => (
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
            <Label htmlFor="monto">Monto</Label>
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

          {/* Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsable">Responsable</Label>
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

          {/* Concepto (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto (Opcional)</Label>
            <Textarea
              id="concepto"
              placeholder="Descripción del préstamo o devolución..."
              value={formData.concepto}
              onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
              rows={2}
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
            {isLoading ? "Procesando..." : `Registrar ${formData.tipo === "prestamo" ? "Préstamo" : "Devolución"}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
