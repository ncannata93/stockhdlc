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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, AlertCircle, CheckCircle, Cloud, WifiOff, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  crearPrestamo,
  obtenerHoteles,
  obtenerResponsables,
  verificarConexion,
  verificarTablaPrestamons,
  type PrestamoInput,
} from "@/lib/prestamos-supabase"

interface IngresoManualProps {
  onPrestamoCreado?: () => void
}

export function IngresoManual({ onPrestamoCreado }: IngresoManualProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [tablaExiste, setTablaExiste] = useState(false)
  const [hoteles, setHoteles] = useState<string[]>([])
  const [responsables, setResponsables] = useState<string[]>([])
  const [formData, setFormData] = useState<PrestamoInput>({
    responsable: "",
    hotel_origen: "",
    hotel_destino: "",
    producto: "",
    cantidad: "",
    valor: 0,
    notas: "",
    estado: "pendiente",
  })

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [conexion, tabla] = await Promise.all([verificarConexion(), verificarTablaPrestamons()])
        setConectado(conexion.conectado)
        setTablaExiste(tabla.existe)

        if (conexion.conectado && tabla.existe) {
          const [hotelesData, responsablesData] = await Promise.all([obtenerHoteles(), obtenerResponsables()])
          setHoteles(hotelesData)
          setResponsables(responsablesData)
        } else {
          // Usar datos predefinidos si no hay conexión o tabla
          setHoteles([
            "Jaguel",
            "Monaco",
            "Mallak",
            "Argentina",
            "Falkner",
            "Stromboli",
            "San Miguel",
            "Colores",
            "Puntarenas",
            "Tupe",
            "Munich",
            "Tiburones",
            "Barlovento",
            "Carama",
          ])
          setResponsables(["Nicolas Cannata", "Juan Manuel", "Nacho", "Diego", "Administrador", "Gerente"])
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setConectado(false)
        setTablaExiste(false)
      }
    }
    cargarDatos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.responsable ||
      !formData.hotel_origen ||
      !formData.hotel_destino ||
      !formData.producto ||
      !formData.valor
    ) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (formData.hotel_origen === formData.hotel_destino) {
      toast({
        title: "Error en hoteles",
        description: "El hotel origen y destino no pueden ser el mismo",
        variant: "destructive",
      })
      return
    }

    if (formData.valor <= 0) {
      toast({
        title: "Error en valor",
        description: "El valor debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (!tablaExiste) {
      toast({
        title: "Error de base de datos",
        description: "La tabla prestamos no existe. Ejecuta el script de creación primero.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const prestamo = await crearPrestamo(formData)

      if (prestamo) {
        toast({
          title: "✅ Préstamo creado",
          description: `Préstamo de ${formData.hotel_origen} a ${formData.hotel_destino} por $${formData.valor.toLocaleString()}`,
        })

        // Limpiar formulario
        setFormData({
          responsable: formData.responsable, // Mantener responsable
          hotel_origen: "",
          hotel_destino: "",
          producto: "",
          cantidad: "",
          valor: 0,
          notas: "",
          estado: "pendiente",
        })

        onPrestamoCreado?.()
      }
    } catch (error) {
      console.error("Error al crear préstamo:", error)
      setConectado(false)
      toast({
        title: "Error al crear préstamo",
        description: "No se pudo guardar en Supabase. Verifica tu conexión.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const productos = [
    "Efectivo",
    "Toallas",
    "Sábanas",
    "Equipamiento",
    "Materiales",
    "Productos limpieza",
    "Alimentos",
    "Bebidas",
    "Mantenimiento",
    "Servicios",
    "Otros",
  ]

  const estadoConexion = () => {
    if (!conectado) {
      return (
        <div className="flex items-center gap-1">
          <WifiOff className="h-4 w-4 text-red-600" />
          <span className="text-xs text-red-600">Sin conexión</span>
        </div>
      )
    }

    if (!tablaExiste) {
      return (
        <div className="flex items-center gap-1">
          <Database className="h-4 w-4 text-orange-600" />
          <span className="text-xs text-orange-600">Tabla no existe</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1">
        <Cloud className="h-4 w-4 text-green-600" />
        <span className="text-xs text-green-600">Supabase OK</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          Ingreso Manual
          <div className="ml-auto">{estadoConexion()}</div>
        </CardTitle>
        <CardDescription>Registra préstamos individualmente con todos los detalles</CardDescription>
      </CardHeader>
      <CardContent>
        {!conectado && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sin conexión a Supabase. Los préstamos no se pueden guardar en este momento.
            </AlertDescription>
          </Alert>
        )}

        {conectado && !tablaExiste && (
          <Alert variant="destructive" className="mb-4">
            <Database className="h-4 w-4" />
            <AlertDescription>
              La tabla 'prestamos' no existe en Supabase. Ejecuta el script 'create-prestamos-table-complete.sql'
              primero.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsable */}
            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable *</Label>
              <Select
                value={formData.responsable}
                onValueChange={(value) => setFormData({ ...formData, responsable: value })}
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

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                type="date"
                value={formData.fecha || new Date().toISOString().split("T")[0]}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hotel Origen */}
            <div className="space-y-2">
              <Label htmlFor="hotel_origen">Hotel que retira *</Label>
              <Select
                value={formData.hotel_origen}
                onValueChange={(value) => setFormData({ ...formData, hotel_origen: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hotel que presta" />
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

            {/* Hotel Destino */}
            <div className="space-y-2">
              <Label htmlFor="hotel_destino">Hotel que recibe *</Label>
              <Select
                value={formData.hotel_destino}
                onValueChange={(value) => setFormData({ ...formData, hotel_destino: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hotel que recibe" />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Producto */}
            <div className="space-y-2">
              <Label htmlFor="producto">Producto/Concepto *</Label>
              <Select
                value={formData.producto}
                onValueChange={(value) => setFormData({ ...formData, producto: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de préstamo" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((producto) => (
                    <SelectItem key={producto} value={producto}>
                      {producto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cantidad */}
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                placeholder="ej: 10 unidades"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor ($) *</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={formData.valor || ""}
                onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) =>
                setFormData({ ...formData, estado: value as "pendiente" | "pagado" | "cancelado" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="pagado">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Pagado</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="cancelado">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Cancelado</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionales</Label>
            <Textarea
              placeholder="Detalles adicionales del préstamo..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !conectado || !tablaExiste}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando en Supabase...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Préstamo
              </>
            )}
          </Button>

          {conectado && tablaExiste && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Conectado a Supabase - Los datos se guardan automáticamente</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
