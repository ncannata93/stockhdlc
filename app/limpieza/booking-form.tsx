"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { addBooking } from "./actions"
import { Plus } from "lucide-react"

// Generate apartment numbers
const generateApartments = () => {
  const apartments: string[] = []
  // 101-119 (sin 113)
  for (let i = 101; i <= 119; i++) {
    if (i !== 113) apartments.push(i.toString())
  }
  // 201-217 (sin 213)
  for (let i = 201; i <= 217; i++) {
    if (i !== 213) apartments.push(i.toString())
  }
  return apartments
}

const APARTMENTS = generateApartments()

export function BookingForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    apartment: "",
    pax: "",
    checkIn: "",
    checkOut: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.apartment || !formData.pax || !formData.checkIn || !formData.checkOut) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await addBooking({
        apartment: formData.apartment,
        pax: Number.parseInt(formData.pax),
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        notes: formData.notes,
      })

      toast({
        title: "Estadía agregada",
        description: "La estadía y su planilla de limpieza han sido creadas",
      })

      setFormData({
        apartment: "",
        pax: "",
        checkIn: "",
        checkOut: "",
        notes: "",
      })

      onSuccess()
    } catch (error) {
      console.error("Error adding booking:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la estadía",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nueva Estadía
        </CardTitle>
        <CardDescription>
          Registra una nueva estadía para generar automáticamente la planilla de limpieza
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apartment">Apartamento *</Label>
              <Select
                value={formData.apartment}
                onValueChange={(value) => setFormData({ ...formData, apartment: value })}
              >
                <SelectTrigger id="apartment">
                  <SelectValue placeholder="Selecciona apartamento" />
                </SelectTrigger>
                <SelectContent>
                  {APARTMENTS.map((apt) => (
                    <SelectItem key={apt} value={apt}>
                      {apt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pax">PAX (Personas) *</Label>
              <Input
                id="pax"
                type="number"
                min="1"
                max="10"
                value={formData.pax}
                onChange={(e) => setFormData({ ...formData, pax: e.target.value })}
                placeholder="Ej: 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in *</Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out *</Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Agregando..." : "Agregar Estadía"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
