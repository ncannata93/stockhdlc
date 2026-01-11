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
  const [hotelesExistentes, setHotelesExistentes] = useState<string[]>([])

  // Estados para campos personalizados
  const [hotelOrigenCustom, setHotelOrigenCustom] = useState("")
  const [hotelDestinoCustom, setHotelDestinoCustom] = useState("")
  const [mostrarOrigenCustom, setMostrarOrigenCustom] = useState(false)
  const [mostrarDestinoCustom, setMostrarDestinoCustom] = useState(false)

  // Función para obtener fecha actual en formato YYYY-MM-DD
  const getCurrentDateISO = () => {
    const now = new Date()
    return now.toISOString().split("T")[0]
  }

  const [formData, setFormData] = useState<PrestamoInput>({
    fecha: getCurrentDateISO(), // Usar formato ISO desde el inicio
    responsable: "",
    hotel_origen: "",
    hotel_destino: "",
    producto: "",
    cantidad: "",
    valor: "",
    notas: "",
    estado: "pendiente",
  })

  // Lista predefinida de hoteles
  const hotelesBase = [
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
    "Juan Manuel",
    "Nacho",
    "Diego",
  ]

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [conexion, tabla] = await Promise.all([verificarConexion(), verificarTablaPrestamons()])
        setConectado(conexion.conectado)
        setTablaExiste(tabla.existe)

        if (conexion.conectado && tabla.existe) {
          const hotelesData = await obtenerHoteles()
          // Combinar hoteles base con hoteles existentes en BD
          const todosHoteles = [...new Set([...hotelesBase, ...hotelesData])].sort()
          setHotelesExistentes(todosHoteles)
        } else {
          setHotelesExistentes(hotelesBase)
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setConectado(false)
        setTablaExiste(false)
        setHotelesExistentes(hotelesBase)
      }
    }
    cargarDatos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Determinar hoteles finales (custom o seleccionado)
    const hotelOrigen = mostrarOrigenCustom ? hotelOrigenCustom : formData.hotel_origen
    const hotelDestino = mostrarDestinoCustom ? hotelDestinoCustom : formData.hotel_destino

    // Validaciones
    if (!formData.responsable || !hotelOrigen || !hotelDestino || !formData.producto || !formData.valor) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (hotelOrigen === hotelDestino) {
      toast({
        title: "Error en hoteles",
        description: "El hotel origen y destino no pueden ser el mismo",
        variant: "destructive",
      })
      return
    }

    // Validar valor
    const valorNumerico =
      typeof formData.valor === "string" ? Number.parseFloat(formData.valor.replace(/[^0-9.-]/g, "")) : formData.valor

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast({
        title: "Error en valor",
        description: "El valor debe ser un número mayor a 0",
        variant: "destructive",
      })
      return
    }

    // Validar fecha
    if (!formData.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(formData.fecha)) {
      toast({
        title: "Error en fecha",
        description: "La fecha debe estar en formato válido",
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
      const prestamoData: PrestamoInput = {
        ...formData,
        hotel_origen: hotelOrigen,
        hotel_destino: hotelDestino,
        valor: valorNumerico,
      }

      console.log("📅 Datos del préstamo a crear:", prestamoData)

      const prestamo = await crearPrestamo(prestamoData)

      if (prestamo) {
        toast({
          title: "✅ Préstamo creado",
          description: `Préstamo de ${hotelOrigen} a ${hotelDestino} por $${valorNumerico.toLocaleString()}`,
        })

        // Limpiar formulario manteniendo responsable y fecha actual
        setFormData({
          fecha: getCurrentDateISO(),
          responsable: formData.responsable,
          hotel_origen: "",
          hotel_destino: "",
          producto: "",
          cantidad: "",
          valor: "",
          notas: "",
          estado: "pendiente",
        })

        // Resetear campos custom
        setHotelOrigenCustom("")
        setHotelDestinoCustom("")
        setMostrarOrigenCustom(false)
        setMostrarDestinoCustom(false)

        onPrestamoCreado?.()
      }
    } catch (error) {
      console.error("Error al crear préstamo:", error)
      setConectado(false)
      toast({
        title: "Error al crear préstamo",
        description: error instanceof Error ? error.message : "No se pudo guardar en Supabase. Verifica tu conexión.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
          {/* Fecha y Responsable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable *</Label>
              <Input
                type="text"
                placeholder="Nombre del responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Hoteles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hotel que retira */}
            <div className="space-y-2">
              <Label htmlFor="hotel_origen">Hotel que retira *</Label>
              {!mostrarOrigenCustom ? (
                <Select
                  value={formData.hotel_origen}
                  onValueChange={(value) => {
                    if (value === "otro") {
                      setMostrarOrigenCustom(true)
                      setFormData({ ...formData, hotel_origen: "" })
                    } else {
                      setFormData({ ...formData, hotel_origen: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hotel que presta" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotelesExistentes.map((hotel) => (
                      <SelectItem key={hotel} value={hotel}>
                        {hotel}
                      </SelectItem>
                    ))}
                    <SelectItem value="otro">
                      <span className="font-semibold text-blue-600">+ Otro hotel</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nombre del hotel"
                    value={hotelOrigenCustom}
                    onChange={(e) => setHotelOrigenCustom(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMostrarOrigenCustom(false)
                      setHotelOrigenCustom("")
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

            {/* Hotel que recibe */}
            <div className="space-y-2">
              <Label htmlFor="hotel_destino">Hotel que recibe *</Label>
              {!mostrarDestinoCustom ? (
                <Select
                  value={formData.hotel_destino}
                  onValueChange={(value) => {
                    if (value === "otro") {
                      setMostrarDestinoCustom(true)
                      setFormData({ ...formData, hotel_destino: "" })
                    } else {
                      setFormData({ ...formData, hotel_destino: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hotel que recibe" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotelesExistentes.map((hotel) => (
                      <SelectItem key={hotel} value={hotel}>
                        {hotel}
                      </SelectItem>
                    ))}
                    <SelectItem value="otro">
                      <span className="font-semibold text-blue-600">+ Otro hotel</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nombre del hotel"
                    value={hotelDestinoCustom}
                    onChange={(e) => setHotelDestinoCustom(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMostrarDestinoCustom(false)
                      setHotelDestinoCustom("")
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Producto, Cantidad y Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="producto">Producto *</Label>
              <Input
                type="text"
                placeholder="ej: Efectivo, Toallas, Equipamiento"
                value={formData.producto}
                onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                type="text"
                placeholder="ej: 10 unidades, 5 kg"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                type="text"
                placeholder="ej: 50000, 15.000"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
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
                    <span>- Préstamo activo</span>
                  </div>
                </SelectItem>
                <SelectItem value="pagado">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Pagado</Badge>
                    <span>- Préstamo saldado</span>
                  </div>
                </SelectItem>
                <SelectItem value="cancelado">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Cancelado</Badge>
                    <span>- Préstamo anulado</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionales</Label>
            <Textarea
              placeholder="Detalles adicionales, condiciones especiales, observaciones..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
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
