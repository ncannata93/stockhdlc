"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, AlertCircle, Building2, User } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface Prestamo {
  responsable: string
  prestamista: string
  prestatario: string
  concepto: string
  monto: number
  fecha: string
  observaciones: string
}

export function AgregarPrestamo() {
  const { toast } = useToast()
  const [prestamo, setPrestamo] = useState<Prestamo>({
    responsable: "",
    prestamista: "",
    prestatario: "",
    concepto: "",
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ""
  })

  const [errors, setErrors] = useState<Partial<Prestamo>>({})
  const [showResumen, setShowResumen] = useState(false)

  const responsables = [
    "Juan Manuel",
    "Diego", 
    "Nacho",
    "Otros"
  ]

  const entidades = [
    // Hoteles
    "Hotel Jaguel", "Hotel Monaco", "Hotel Mallak", "Hotel Argentina", 
    "Hotel Falkner", "Hotel Stromboli", "Hotel San Miguel", "Hotel Colores",
    "Hotel Puntarenas", "Hotel Tupe", "Hotel Munich", "Hotel Tiburones",
    "Hotel Barlovento", "Hotel Carama",
    // Personas
    "Juan Manuel", "Diego", "Nacho"
  ]

  const conceptos = [
    "Efectivo",
    "Toallas",
    "Sábanas", 
    "Almohadas",
    "Productos de limpieza",
    "Mantenimiento",
    "Servicios",
    "Otros"
  ]

  const validateForm = () => {
    const newErrors: Partial<Prestamo> = {}

    if (!prestamo.responsable) newErrors.responsable = "Selecciona un responsable"
    if (!prestamo.prestamista) newErrors.prestamista = "Selecciona quien presta"
    if (!prestamo.prestatario) newErrors.prestatario = "Selecciona quien recibe"
    if (!prestamo.concepto) newErrors.concepto = "Especifica el concepto"
    if (prestamo.monto <= 0) newErrors.monto = "El monto debe ser mayor a 0"
    if (!prestamo.fecha) newErrors.fecha = "Selecciona una fecha"

    if (prestamo.prestamista === prestamo.prestatario) {
      newErrors.prestamista = "No puede ser la misma entidad"
      newErrors.prestatario = "No puede ser la misma entidad"
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
        variant: "destructive"
      })
      return
    }

    setShowResumen(true)
  }

  const confirmarPrestamo = () => {
    // Aquí se guardaría en la base de datos
    toast({
      title: "Préstamo registrado",
      description: `Préstamo de $${prestamo.monto.toLocaleString()} registrado exitosamente`,
    })

    // Resetear formulario
    setPrestamo({
      responsable: "",
      prestamista: "",
      prestatario: "",
      concepto: "",
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      observaciones: ""
    })
    setShowResumen(false)
    setErrors({})
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
              <span className="font-medium">Prestamista:</span>
              <Badge className="bg-green-100 text-green-800">{prestamo.prestamista}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Prestatario:</span>
              <Badge className="bg-red-100 text-red-800">{prestamo.prestatario}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Concepto:</span>
              <span>{prestamo.concepto}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Monto:</span>
              <span className="text-xl font-bold text-orange-600">${prestamo.monto.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Fecha:</span>
              <span>{new Date(prestamo.fecha).toLocaleDateString()}</span>
            </div>
            {prestamo.observaciones && (
              <div>
                <span className="font-medium">Observaciones:</span>
                <p className="text-sm text-gray-600 mt-1">{prestamo.observaciones}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={confirmarPrestamo} className="flex-1 bg-orange-600 hover:bg-orange-700">
              <Save className="h-4 w-4 mr-2" />
              Confirmar Préstamo
            </Button>
            <Button variant="outline" onClick={() => setShowResumen(false)}>
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
          <Plus className="h-5 w-5 text-orange-600" />
          Nuevo Préstamo
        </CardTitle>
        <CardDescription>Registra un nuevo préstamo entre entidades</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsable">Responsable *</Label>
            <Select value={prestamo.responsable} onValueChange={(value) => setPrestamo({...prestamo, responsable: value})}>
              <SelectTrigger className={errors.responsable ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona el responsable" />
              </SelectTrigger>
              <SelectContent>
                {responsables.map((resp) => (
                  <SelectItem key={resp} value={resp}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {resp}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.responsable && <p className="text-sm text-red-500">{errors.responsable}</p>}
          </div>

          {/* Prestamista */}
          <div className="space-y-2">
            <Label htmlFor="prestamista">Quien Presta *</Label>
            <Select value={prestamo.prestamista} onValueChange={(value) => setPrestamo({...prestamo, prestamista: value})}>
              <SelectTrigger className={errors.prestamista ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona quien presta" />
              </SelectTrigger>
              <SelectContent>
                {entidades.map((entidad) => (
                  <SelectItem key={entidad} value={entidad}>
                    <div className="flex items-center gap-2">
                      {entidad.startsWith("Hotel") ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      {entidad}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.prestamista && <p className="text-sm text-red-500">{errors.prestamista}</p>}
          </div>

          {/* Prestatario */}
          <div className="space-y-2">
            <Label htmlFor="prestatario">Quien Recibe *</Label>
            <Select value={prestamo.prestatario} onValueChange={(value) => setPrestamo({...prestamo, prestatario: value})}>
              <SelectTrigger className={errors.prestatario ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona quien recibe" />
              </SelectTrigger>
              <SelectContent>
                {entidades.map((entidad) => (
                  <SelectItem key={entidad} value={entidad}>
                    <div className="flex items-center gap-2">
                      {entidad.startsWith("Hotel") ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      {entidad}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.prestatario && <p className="text-sm text-red-500">{errors.prestatario}</p>}
          </div>

          {/* Concepto */}
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto *</Label>
            <Select value={prestamo.concepto} onValueChange={(value) => setPrestamo({...prestamo, concepto: value})}>
              <SelectTrigger className={errors.concepto ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona el concepto" />
              </SelectTrigger>
              <SelectContent>
                {conceptos.map((concepto) => (
                  <SelectItem key={concepto} value={concepto}>{concepto}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.concepto && <p className="text-sm text-red-500">{errors.concepto}</p>}
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto *</Label>
            <Input
              id="monto"
              type="number"
              min="0"
              step="0.01"
              value={prestamo.monto || ""}
              onChange={(e) => setPrestamo({...prestamo, monto: parseFloat(e.target.value) || 0})}
              placeholder="0.00"
              className={errors.monto ? "border-red-500" : ""}
            />
            {errors.monto && <p className="text-sm text-red-500">{errors.monto}</p>}
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              type="date"
              value={prestamo.fecha}
              onChange={(e) => setPrestamo({...prestamo, fecha: e.target.value})}
              className={errors.fecha ? "border-red-500" : ""}
            />
            {errors.fecha && <p className="text-sm text-red-500">{errors.fecha}</p>}
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={prestamo.observaciones}
              onChange={(e) => setPrestamo({...prestamo, observaciones: e.target.value})}
              placeholder="Información adicional (opcional)"
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
