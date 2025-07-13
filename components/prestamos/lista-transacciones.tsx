"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
  Building2,
  User,
  AlertCircle,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react"
import { HOTELES, RESPONSABLES } from "@/lib/prestamos-types"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Prestamo {
  id: string
  responsable: string
  hotel_origen: string
  hotel_destino: string
  producto: string
  cantidad: string
  valor: number
  fecha: string
  notas?: string
  created_at?: string
  updated_at?: string
}

interface ListaTransaccionesProps {
  refreshTrigger?: number
  onTransaccionActualizada?: () => void
}

export function ListaTransacciones({ refreshTrigger, onTransaccionActualizada }: ListaTransaccionesProps) {
  const { toast } = useToast()
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    hotelOrigen: "",
    hotelDestino: "",
    responsable: "",
  })
  const [busqueda, setBusqueda] = useState("")
  const [editandoPrestamo, setEditandoPrestamo] = useState<Prestamo | null>(null)
  const [formularioEdicion, setFormularioEdicion] = useState<Prestamo | null>(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  const formatearMonto = (monto: number): string => {
    // Asegurar que monto sea un número válido
    const montoNumerico = typeof monto === "string" ? Number.parseFloat(monto) : monto
    if (isNaN(montoNumerico)) {
      return "$0"
    }

    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montoNumerico)
  }

  const cargarPrestamos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Cargar desde localStorage
      const prestamosData = JSON.parse(localStorage.getItem("prestamos_data") || "[]")
      setPrestamos(prestamosData)
    } catch (error) {
      console.error("Error al cargar préstamos:", error)
      setError("Error al cargar las transacciones")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarPrestamos()
  }, [refreshTrigger])

  const eliminarPrestamo = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este préstamo?")) {
      return
    }

    try {
      const prestamosActualizados = prestamos.filter((p) => p.id !== id)
      localStorage.setItem("prestamos_data", JSON.stringify(prestamosActualizados))
      setPrestamos(prestamosActualizados)

      toast({
        title: "Éxito",
        description: "Préstamo eliminado correctamente",
      })

      onTransaccionActualizada?.()
    } catch (error) {
      console.error("Error al eliminar préstamo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el préstamo",
        variant: "destructive",
      })
    }
  }

  const iniciarEdicion = (prestamo: Prestamo) => {
    setEditandoPrestamo(prestamo)
    setFormularioEdicion({ ...prestamo })
  }

  const cancelarEdicion = () => {
    setEditandoPrestamo(null)
    setFormularioEdicion(null)
  }

  const guardarEdicion = async () => {
    if (!formularioEdicion) return

    // Validaciones
    if (
      !formularioEdicion.responsable ||
      !formularioEdicion.hotel_origen ||
      !formularioEdicion.hotel_destino ||
      !formularioEdicion.producto ||
      !formularioEdicion.valor
    ) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (formularioEdicion.hotel_origen === formularioEdicion.hotel_destino) {
      toast({
        title: "Error",
        description: "El hotel origen y destino deben ser diferentes",
        variant: "destructive",
      })
      return
    }

    if (formularioEdicion.valor <= 0) {
      toast({
        title: "Error",
        description: "El valor debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    setGuardandoEdicion(true)
    try {
      const prestamoActualizado = {
        ...formularioEdicion,
        valor:
          typeof formularioEdicion.valor === "string"
            ? Number.parseFloat(formularioEdicion.valor)
            : formularioEdicion.valor,
        updated_at: new Date().toISOString(),
      }

      const prestamosActualizados = prestamos.map((p) => (p.id === prestamoActualizado.id ? prestamoActualizado : p))

      localStorage.setItem("prestamos_data", JSON.stringify(prestamosActualizados))
      setPrestamos(prestamosActualizados)

      toast({
        title: "Éxito",
        description: "Préstamo actualizado correctamente",
      })

      cancelarEdicion()
      onTransaccionActualizada?.()
    } catch (error) {
      console.error("Error al actualizar préstamo:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el préstamo",
        variant: "destructive",
      })
    } finally {
      setGuardandoEdicion(false)
    }
  }

  const prestamosFiltrados = prestamos.filter((prestamo) => {
    // Filtro por búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      const coincide =
        prestamo.producto.toLowerCase().includes(busquedaLower) ||
        prestamo.hotel_origen.toLowerCase().includes(busquedaLower) ||
        prestamo.hotel_destino.toLowerCase().includes(busquedaLower) ||
        prestamo.responsable.toLowerCase().includes(busquedaLower)

      if (!coincide) return false
    }

    // Filtros específicos
    if (filtros.hotelOrigen && prestamo.hotel_origen !== filtros.hotelOrigen) return false
    if (filtros.hotelDestino && prestamo.hotel_destino !== filtros.hotelDestino) return false
    if (filtros.responsable && prestamo.responsable !== filtros.responsable) return false

    return true
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lista de Transacciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Cargando transacciones...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lista de Transacciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" onClick={cargarPrestamos} className="ml-2 bg-transparent">
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Lista de Transacciones
              </CardTitle>
              <CardDescription>{prestamosFiltrados.length} transacciones encontradas</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={cargarPrestamos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros y Búsqueda */}
          <div className="space-y-4 mb-6">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por producto, hotel o responsable..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={filtros.hotelOrigen || "Todos los hoteles"}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, hotelOrigen: value === "Todos los hoteles" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hotel origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos los hoteles">Todos los hoteles</SelectItem>
                  {HOTELES.map((hotel) => (
                    <SelectItem key={hotel} value={hotel}>
                      {hotel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtros.hotelDestino || "Todos los hoteles"}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, hotelDestino: value === "Todos los hoteles" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hotel destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos los hoteles">Todos los hoteles</SelectItem>
                  {HOTELES.map((hotel) => (
                    <SelectItem key={hotel} value={hotel}>
                      {hotel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtros.responsable || "Todos los responsables"}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, responsable: value === "Todos los responsables" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos los responsables">Todos los responsables</SelectItem>
                  {RESPONSABLES.map((responsable) => (
                    <SelectItem key={responsable} value={responsable}>
                      {responsable}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabla de Transacciones */}
          {prestamosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron transacciones</p>
              {prestamos.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  Registra tu primer préstamo usando las pestañas "Ingreso Rápido" o "Ingreso Manual"
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prestamosFiltrados.map((prestamo) => (
                    <TableRow key={prestamo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(prestamo.fecha).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-red-600" />
                          {prestamo.hotel_origen}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-green-600" />
                          {prestamo.hotel_destino}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={prestamo.producto}>
                          {prestamo.producto}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{prestamo.cantidad}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-lg">{formatearMonto(prestamo.valor)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {prestamo.responsable}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => iniciarEdicion(prestamo)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => eliminarPrestamo(prestamo.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edición */}
      <Dialog open={!!editandoPrestamo} onOpenChange={(open) => !open && cancelarEdicion()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Editar Préstamo
            </DialogTitle>
            <DialogDescription>
              Modifica los datos del préstamo. Todos los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          {formularioEdicion && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formularioEdicion.fecha}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, fecha: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsable">Responsable *</Label>
                  <Select
                    value={formularioEdicion.responsable}
                    onValueChange={(value) => setFormularioEdicion({ ...formularioEdicion, responsable: value })}
                  >
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel_origen">Hotel Origen *</Label>
                  <Select
                    value={formularioEdicion.hotel_origen}
                    onValueChange={(value) => setFormularioEdicion({ ...formularioEdicion, hotel_origen: value })}
                  >
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
                  <Label htmlFor="hotel_destino">Hotel Destino *</Label>
                  <Select
                    value={formularioEdicion.hotel_destino}
                    onValueChange={(value) => setFormularioEdicion({ ...formularioEdicion, hotel_destino: value })}
                  >
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

              <div className="space-y-2">
                <Label htmlFor="producto">Producto/Concepto *</Label>
                <Input
                  id="producto"
                  value={formularioEdicion.producto}
                  onChange={(e) => setFormularioEdicion({ ...formularioEdicion, producto: e.target.value })}
                  placeholder="Ej: Toallas, Efectivo, Productos de limpieza"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    value={formularioEdicion.cantidad}
                    onChange={(e) => setFormularioEdicion({ ...formularioEdicion, cantidad: e.target.value })}
                    placeholder="Ej: 20 unidades, 15 juegos"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor ($) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formularioEdicion.valor}
                    onChange={(e) =>
                      setFormularioEdicion({ ...formularioEdicion, valor: Number.parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formularioEdicion.notas || ""}
                  onChange={(e) => setFormularioEdicion({ ...formularioEdicion, notas: e.target.value })}
                  placeholder="Información adicional..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={cancelarEdicion} disabled={guardandoEdicion}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={guardarEdicion} disabled={guardandoEdicion}>
                  {guardandoEdicion ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
