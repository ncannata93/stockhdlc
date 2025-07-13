"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Save, AlertCircle } from "lucide-react"
import { HOTELES, type PrestamoFormData } from "@/lib/prestamos-types"

export function IngresoManual() {
  const [formData, setFormData] = useState<PrestamoFormData>({
    responsable: "",
    hotel_origen: "",
    hotel_destino: "",
    producto: "",
    cantidad: 0,
    valor: 0,
    notas: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.responsable.trim()) {
      newErrors.responsable = "Responsable es requerido"
    }

    if (!formData.hotel_origen) {
      newErrors.hotel_origen = "Hotel que retira es requerido"
    }

    if (!formData.hotel_destino) {
      newErrors.hotel_destino = "Hotel que recibe es requerido"
    }

    if (formData.hotel_origen === formData.hotel_destino) {
      newErrors.hotel_destino = "Hotel que retira y recibe no pueden ser iguales"
    }

    if (!formData.producto.trim()) {
      newErrors.producto = "Producto es requerido"
    }

    if (!formData.cantidad || formData.cantidad <= 0) {
      newErrors.cantidad = "Cantidad debe ser mayor a 0"
    }

    if (!formData.valor || formData.valor <= 0) {
      newErrors.valor = "Valor debe ser mayor a 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setShowConfirmation(true)
    }
  }

  const confirmSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Aquí iría la lógica para guardar en la base de datos
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulación

      // Reset form
      setFormData({
        responsable: "",
        hotel_origen: "",
        hotel_destino: "",
        producto: "",
        cantidad: 0,
        valor: 0,
        notas: "",
      })
      setShowConfirmation(false)
      alert("Préstamo registrado exitosamente")
    } catch (error) {
      console.error("Error guardando préstamo:", error)
      alert("Error al guardar préstamo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableDestinos = HOTELES.filter((hotel) => hotel !== formData.hotel_origen)

  if (showConfirmation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Confirmar Préstamo
          </CardTitle>
          <CardDescription>Revisa los datos antes de guardar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <strong>Responsable:</strong> {formData.responsable}
            </div>
            <div>
              <strong>Hotel que retira:</strong> {formData.hotel_origen}
            </div>
            <div>
              <strong>Hotel que recibe:</strong> {formData.hotel_destino}
            </div>
            <div>
              <strong>Producto:</strong> {formData.producto}
            </div>
            <div>
              <strong>Cantidad:</strong> {formData.cantidad}
            </div>
            <div>
              <strong>Valor:</strong> ${formData.valor.toLocaleString()} ARS
            </div>
          </div>
          {formData.notas && (
            <div>
              <strong>Notas:</strong>
              <p className="text-sm text-gray-600 mt-1">{formData.notas}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={confirmSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Confirmar y Guardar"}
            </Button>
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isSubmitting}>
              Volver a Editar
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
          <FileText className="h-5 w-5" />
          Ingreso Manual
        </CardTitle>
        <CardDescription>Registra préstamos con información detallada y personalizada</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Responsable */}
          <div>
            <Label htmlFor="responsable">Responsable *</Label>
            <Input
              id="responsable"
              type="text"
              value={formData.responsable}
              onChange={(e) => setFormData((prev) => ({ ...prev, responsable: e.target.value }))}
              placeholder="Nombre del responsable"
              className={errors.responsable ? "border-red-500" : ""}
            />
            {errors.responsable && <p className="text-sm text-red-500 mt-1">{errors.responsable}</p>}
          </div>

          {/* Hotel que retira */}
          <div>
            <Label htmlFor="hotel_origen">Hotel que Retira *</Label>
            <Select
              value={formData.hotel_origen}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  hotel_origen: value,
                  hotel_destino: value === prev.hotel_destino ? "" : prev.hotel_destino,
                }))
              }}
            >
              <SelectTrigger className={errors.hotel_origen ? "border-red-500" : ""}>
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
            {errors.hotel_origen && <p className="text-sm text-red-500 mt-1">{errors.hotel_origen}</p>}
          </div>

          {/* Hotel que recibe */}
          <div>
            <Label htmlFor="hotel_destino">Hotel que Recibe *</Label>
            <Select
              value={formData.hotel_destino}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, hotel_destino: value }))}
            >
              <SelectTrigger className={errors.hotel_destino ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona hotel destino" />
              </SelectTrigger>
              <SelectContent>
                {availableDestinos.map((hotel) => (
                  <SelectItem key={hotel} value={hotel}>
                    {hotel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hotel_destino && <p className="text-sm text-red-500 mt-1">{errors.hotel_destino}</p>}
          </div>

          {/* Producto */}
          <div>
            <Label htmlFor="producto">Producto *</Label>
            <Input
              id="producto"
              type="text"
              value={formData.producto}
              onChange={(e) => setFormData((prev) => ({ ...prev, producto: e.target.value }))}
              placeholder="Descripción del producto"
              className={errors.producto ? "border-red-500" : ""}
            />
            {errors.producto && <p className="text-sm text-red-500 mt-1">{errors.producto}</p>}
          </div>

          {/* Cantidad */}
          <div>
            <Label htmlFor="cantidad">Cantidad *</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              value={formData.cantidad || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, cantidad: Number.parseInt(e.target.value) || 0 }))}
              placeholder="Cantidad"
              className={errors.cantidad ? "border-red-500" : ""}
            />
            {errors.cantidad && <p className="text-sm text-red-500 mt-1">{errors.cantidad}</p>}
          </div>

          {/* Valor */}
          <div>
            <Label htmlFor="valor">Valor (ARS) *</Label>
            <Input
              id="valor"
              type="number"
              min="0"
              step="0.01"
              value={formData.valor || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, valor: Number.parseFloat(e.target.value) || 0 }))}
              placeholder="Valor en pesos argentinos"
              className={errors.valor ? "border-red-500" : ""}
            />
            {errors.valor && <p className="text-sm text-red-500 mt-1">{errors.valor}</p>}
          </div>

          {/* Notas Adicionales */}
          <div>
            <Label htmlFor="notas">Notas Adicionales</Label>
            <Textarea
              id="notas"
              value={formData.notas || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
              placeholder="Información adicional sobre el préstamo..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Registrar Préstamo
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Named export
