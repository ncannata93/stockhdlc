"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Building2,
  DollarSign,
  User,
  Calendar,
  Package,
} from "lucide-react"
import { HOTELES, RESPONSABLES } from "@/lib/prestamos-types"
import { useToast } from "@/hooks/use-toast"

interface FormularioPrestamo {
  responsable: string
  hotel_origen: string
  hotel_destino: string
  producto: string
  cantidad: string
  valor: number
  fecha: string
  notas: string
}

interface IngresoManualProps {
  onPrestamoGuardado?: () => void
}

export function IngresoManual({ onPrestamoGuardado }: IngresoManualProps) {
  const { toast } = useToast()
  const [formulario, setFormulario] = useState<FormularioPrestamo>({
    responsable: "",
    hotel_origen: "",
    hotel_destino: "",
    producto: "",
    cantidad: "",
    valor: 0,
    fecha: new Date().toISOString().split("T")[0],
    notas: "",
  })
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const actualizarCampo = (campo: keyof FormularioPrestamo, valor: any) => {
    setFormulario({ ...formulario, [campo]: valor })
    // Limpiar errores cuando el usuario empiece a corregir
    if (errores.length > 0) {
      setErrores([])
    }
  }

  const validarFormulario = (): string[] => {
    const erroresValidacion: string[] = []

    if (!formulario.responsable) {
      erroresValidacion.push("El responsable es obligatorio")
    }

    if (!formulario.hotel_origen) {
      erroresValidacion.push("El hotel que retira es obligatorio")
    }

    if (!formulario.hotel_destino) {
      erroresValidacion.push("El hotel que recibe es obligatorio")
    }

    if (formulario.hotel_origen === formulario.hotel_destino) {
      erroresValidacion.push("Los hoteles deben ser diferentes")
    }

    if (!formulario.producto.trim()) {
      erroresValidacion.push("El producto/concepto es obligatorio")
    }

    if (!formulario.valor || formulario.valor <= 0) {
      erroresValidacion.push("El valor debe ser mayor a 0")
    }

    if (!formulario.fecha) {
      erroresValidacion.push("La fecha es obligatoria")
    }

    return erroresValidacion
  }

  const limpiarFormulario = () => {
    setFormulario({
      responsable: "",
      hotel_origen: "",
      hotel_destino: "",
      producto: "",
      cantidad: "",
      valor: 0,
      fecha: new Date().toISOString().split("T")[0],
      notas: "",
    })
    setErrores([])
  }

  const guardarPrestamo = async () => {
    const erroresValidacion = validarFormulario()
    setErrores(erroresValidacion)

    if (erroresValidacion.length > 0) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores antes de continuar",
        variant: "destructive",
      })
      return
    }

    setGuardando(true)

    try {
      // Obtener préstamos existentes
      const prestamosExistentes = JSON.parse(localStorage.getItem("prestamos_data") || "[]")

      // Crear nuevo préstamo
      const nuevoPrestamo = {
        id: `prestamo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        responsable: formulario.responsable,
        hotel_origen: formulario.hotel_origen,
        hotel_destino: formulario.hotel_destino,
        producto: formulario.producto,
        cantidad: formulario.cantidad,
        valor: Number(formulario.valor),
        fecha: formulario.fecha,
        notas: formulario.notas,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Guardar en localStorage
      const todosLosPrestamos = [...prestamosExistentes, nuevoPrestamo]
      localStorage.setItem("prestamos_data", JSON.stringify(todosLosPrestamos))

      toast({
        title: "Éxito",
        description: "Préstamo guardado correctamente",
      })

      // Limpiar formulario
      limpiarFormulario()

      // Notificar al componente padre
      onPrestamoGuardado?.()
    } catch (error) {
      console.error("Error al guardar préstamo:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el préstamo",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  const formatearMonto = (monto: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Ingreso Manual
        </CardTitle>
        <CardDescription>Registra un préstamo individual con todos los detalles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información del Responsable y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="responsable" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Responsable *
            </Label>
            <Select value={formulario.responsable} onValueChange={(value) => actualizarCampo("responsable", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar responsable" />
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

          <div className="space-y-2">
            <Label htmlFor="fecha" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha *
            </Label>
            <Input
              id="fecha"
              type="date"
              value={formulario.fecha}
              onChange={(e) => actualizarCampo("fecha", e.target.value)}
              required
            />
          </div>
        </div>

        {/* Hoteles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hotel_origen" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-red-600" />
              Hotel que retira *
            </Label>
            <Select value={formulario.hotel_origen} onValueChange={(value) => actualizarCampo("hotel_origen", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hotel origen" />
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
            <Label htmlFor="hotel_destino" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-600" />
              Hotel que recibe *
            </Label>
            <Select value={formulario.hotel_destino} onValueChange={(value) => actualizarCampo("hotel_destino", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hotel destino" />
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
        </div>

        {/* Producto y Detalles */}
        <div className="space-y-2">
          <Label htmlFor="producto" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Producto/Concepto *
          </Label>
          <Input
            id="producto"
            value={formulario.producto}
            onChange={(e) => actualizarCampo("producto", e.target.value)}
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
              onChange={(e) => actualizarCampo("cantidad", e.target.value)}
              placeholder="Ej: 20 unidades, 15 juegos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor ($) *
            </Label>
            <Input
              id="valor"
              type="number"
              min="0"
              step="0.01"
              value={formulario.valor}
              onChange={(e) => actualizarCampo("valor", Number.parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              required
            />
            {formulario.valor > 0 && (
              <p className="text-sm text-gray-600">Equivale a: {formatearMonto(formulario.valor)}</p>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label htmlFor="notas">Notas</Label>
          <Textarea
            id="notas"
            value={formulario.notas}
            onChange={(e) => actualizarCampo("notas", e.target.value)}
            placeholder="Información adicional, observaciones, etc."
            rows={3}
          />
        </div>

        {/* Errores de Validación */}
        {errores.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Se encontraron los siguientes errores:</p>
                <ul className="list-disc list-inside space-y-1">
                  {errores.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Resumen del Préstamo */}
        {formulario.hotel_origen && formulario.hotel_destino && formulario.valor > 0 && (
          <Card className="bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-green-900">Resumen del Préstamo</h4>
              </div>
              <div className="space-y-1 text-sm text-green-800">
                <p>
                  <strong>{formulario.hotel_origen}</strong> retira <strong>{formatearMonto(formulario.valor)}</strong>{" "}
                  de <strong>{formulario.hotel_destino}</strong>
                </p>
                {formulario.producto && (
                  <p>
                    Concepto: <strong>{formulario.producto}</strong>
                  </p>
                )}
                {formulario.cantidad && (
                  <p>
                    Cantidad: <strong>{formulario.cantidad}</strong>
                  </p>
                )}
                <p>
                  Fecha: <strong>{new Date(formulario.fecha).toLocaleDateString()}</strong>
                </p>
                {formulario.responsable && (
                  <p>
                    Responsable: <strong>{formulario.responsable}</strong>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-4 pt-4">
          <Button onClick={guardarPrestamo} disabled={guardando} className="flex-1">
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Préstamo
              </>
            )}
          </Button>

          <Button variant="outline" onClick={limpiarFormulario} disabled={guardando}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
