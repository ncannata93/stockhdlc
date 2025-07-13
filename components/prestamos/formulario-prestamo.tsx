"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, AlertCircle, Building2, User, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { crearPrestamo, obtenerHoteles } from "@/lib/prestamos-db"
import type { NuevoPrestamo } from "@/lib/prestamos-types"

interface FormularioPrestamoProps {
  onPrestamoCreado?: () => void
}

export function FormularioPrestamo({ onPrestamoCreado }: FormularioPrestamoProps) {
  const { toast } = useToast()
  const [hoteles, setHoteles] = useState<string[]>([])
  const [cargandoHoteles, setCargandoHoteles] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [prestamo, setPrestamo] = useState<NuevoPrestamo>({
    hotelOrigen: "",
    hotelDestino: "",
    concepto: "",
    monto: 0,
    responsable: "",
    estado: "pendiente",
    notas: "",
  })

  const [errors, setErrors] = useState<Partial<NuevoPrestamo>>({})
  const [showResumen, setShowResumen] = useState(false)

  const responsables = ["Juan Manuel", "Diego", "Nacho", "Otros"]

  const conceptos = [
    "Efectivo",
    "Toallas",
    "Sábanas",
    "Almohadas",
    "Productos de limpieza",
    "Mantenimiento",
    "Servicios",
    "Otros",
  ]

  useEffect(() => {
    cargarHoteles()
  }, [])

  const cargarHoteles = async () => {
    setCargandoHoteles(true)
    try {
      const hotelesData = await obtenerHoteles()
      setHoteles(hotelesData)
    } catch (error) {
      console.error("Error al cargar hoteles:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los hoteles",
        variant: "destructive",
      })
    } finally {
      setCargandoHoteles(false)
    }
  }

  const validateForm = () => {
    const newErrors: Partial<NuevoPrestamo> = {}

    if (!prestamo.responsable) newErrors.responsable = "Selecciona un responsable"
    if (!prestamo.hotelOrigen) newErrors.hotelOrigen = "Selecciona el hotel origen"
    if (!prestamo.hotelDestino) newErrors.hotelDestino = "Selecciona el hotel destino"
    if (!prestamo.concepto) newErrors.concepto = "Especifica el concepto"
    if (prestamo.monto <= 0) newErrors.monto = "El monto debe ser mayor a 0"

    if (prestamo.hotelOrigen === prestamo.hotelDestino) {
      newErrors.hotelOrigen = "No puede ser el mismo hotel"
      newErrors.hotelDestino = "No puede ser el mismo hotel"
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
      const nuevoPrestamo = await crearPrestamo(prestamo)

      if (nuevoPrestamo) {
        toast({
          title: "¡Préstamo registrado!",
          description: `Préstamo de $${prestamo.monto.toLocaleString()} registrado exitosamente`,
        })

        // Resetear formulario
        setPrestamo({
          hotelOrigen: "",
          hotelDestino: "",
          concepto: "",
          monto: 0,
          responsable: "",
          estado: "pendiente",
          notas: "",
        })
        setShowResumen(false)
        setErrors({})

        // Notificar al componente padre
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

  if (cargandoHoteles) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-orange-600" />
            <p>Cargando formulario...</p>
          </div>
        </CardContent>
      </Card>
    )
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
              <span className="font-medium">Hotel Origen:</span>
              <Badge className="bg-green-100 text-green-800">{prestamo.hotelOrigen}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Hotel Destino:</span>
              <Badge className="bg-red-100 text-red-800">{prestamo.hotelDestino}</Badge>
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
              <span className="font-medium">Estado:</span>
              <Badge variant="secondary">{prestamo.estado}</Badge>
            </div>
            {prestamo.notas && (
              <div>
                <span className="font-medium">Observaciones:</span>
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
          <Plus className="h-5 w-5 text-orange-600" />
          Nuevo Préstamo
        </CardTitle>
        <CardDescription>Registra un nuevo préstamo entre hoteles</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Responsable */}
          <div className="space-y-2">
            <Label htmlFor="responsable">Responsable *</Label>
            <Select
              value={prestamo.responsable}
              onValueChange={(value) => setPrestamo({ ...prestamo, responsable: value })}
            >
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

          {/* Hotel Origen */}
          <div className="space-y-2">
            <Label htmlFor="hotelOrigen">Hotel Origen (Quien Presta) *</Label>
            <Select
              value={prestamo.hotelOrigen}
              onValueChange={(value) => setPrestamo({ ...prestamo, hotelOrigen: value })}
            >
              <SelectTrigger className={errors.hotelOrigen ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona el hotel que presta" />
              </SelectTrigger>
              <SelectContent>
                {hoteles.map((hotel) => (
                  <SelectItem key={hotel} value={hotel}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {hotel}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hotelOrigen && <p className="text-sm text-red-500">{errors.hotelOrigen}</p>}
          </div>

          {/* Hotel Destino */}
          <div className="space-y-2">
            <Label htmlFor="hotelDestino">Hotel Destino (Quien Recibe) *</Label>
            <Select
              value={prestamo.hotelDestino}
              onValueChange={(value) => setPrestamo({ ...prestamo, hotelDestino: value })}
            >
              <SelectTrigger className={errors.hotelDestino ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona el hotel que recibe" />
              </SelectTrigger>
              <SelectContent>
                {hoteles.map((hotel) => (
                  <SelectItem key={hotel} value={hotel}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {hotel}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hotelDestino && <p className="text-sm text-red-500">{errors.hotelDestino}</p>}
          </div>

          {/* Concepto */}
          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto *</Label>
            <Select value={prestamo.concepto} onValueChange={(value) => setPrestamo({ ...prestamo, concepto: value })}>
              <SelectTrigger className={errors.concepto ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona el concepto" />
              </SelectTrigger>
              <SelectContent>
                {conceptos.map((concepto) => (
                  <SelectItem key={concepto} value={concepto}>
                    {concepto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.concepto && <p className="text-sm text-red-500">{errors.concepto}</p>}
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto (ARS) *</Label>
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

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={prestamo.estado} onValueChange={(value: any) => setPrestamo({ ...prestamo, estado: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="notas">Observaciones</Label>
            <Textarea
              id="notas"
              value={prestamo.notas}
              onChange={(e) => setPrestamo({ ...prestamo, notas: e.target.value })}
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
