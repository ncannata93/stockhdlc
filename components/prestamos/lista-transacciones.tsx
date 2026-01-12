"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  User,
  ArrowRight,
  Package,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  obtenerPrestamosFiltrados,
  obtenerHoteles,
  obtenerResponsables,
  eliminarPrestamo,
  formatearMonto,
  type Prestamo,
  type FiltrosPrestamos,
} from "@/lib/prestamos-supabase"

interface ListaTransaccionesProps {
  onActualizar?: () => void
}

export function ListaTransacciones({ onActualizar }: ListaTransaccionesProps) {
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [hoteles, setHoteles] = useState<string[]>([])
  const [responsables, setResponsables] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(!isMobile)

  const [filtros, setFiltros] = useState<FiltrosPrestamos>({
    busqueda: "",
    hotel: "all",
    estado: "all",
    responsable: "all",
  })

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros()
  }, [filtros])

  const cargarDatos = async () => {
    setIsLoading(true)
    try {
      const [prestamosData, hotelesData, responsablesData] = await Promise.all([
        obtenerPrestamosFiltrados({}),
        obtenerHoteles(),
        obtenerResponsables(),
      ])

      console.log("[v0] 📋 Total transacciones cargadas:", prestamosData.length)

      const juanManuelTransaction = prestamosData.find(
        (p) => p.responsable === "Juan Manuel" && p.hotel_origen === "Mallak" && p.hotel_destino === "Argentina",
      )

      if (juanManuelTransaction) {
        console.log("[v0] ✅ Transacción de Juan Manuel encontrada en lista:", {
          id: juanManuelTransaction.id,
          fecha: juanManuelTransaction.fecha,
          responsable: juanManuelTransaction.responsable,
          origen: juanManuelTransaction.hotel_origen,
          destino: juanManuelTransaction.hotel_destino,
          producto: juanManuelTransaction.producto,
          valor: juanManuelTransaction.valor,
          estado: juanManuelTransaction.estado,
        })
      } else {
        console.log("[v0] ❌ Transacción de Juan Manuel NO encontrada en lista inicial")
      }

      setPrestamos(prestamosData)
      setHoteles(hotelesData)
      setResponsables(responsablesData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error al cargar transacciones",
        description: "No se pudieron cargar las transacciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const aplicarFiltros = async () => {
    setIsLoading(true)
    try {
      const filtrosLimpios: FiltrosPrestamos = {}

      if (filtros.busqueda) filtrosLimpios.busqueda = filtros.busqueda
      if (filtros.hotel && filtros.hotel !== "all") filtrosLimpios.hotel = filtros.hotel
      if (filtros.estado && filtros.estado !== "all") filtrosLimpios.estado = filtros.estado
      if (filtros.responsable && filtros.responsable !== "all") filtrosLimpios.responsable = filtros.responsable

      console.log("[v0] 🔍 Filtros activos:", filtrosLimpios)

      const prestamosData = await obtenerPrestamosFiltrados(filtrosLimpios)

      console.log("[v0] 📊 Transacciones después de filtrar:", prestamosData.length)

      const juanManuelTransaction = prestamosData.find(
        (p) => p.responsable === "Juan Manuel" && p.hotel_origen === "Mallak" && p.hotel_destino === "Argentina",
      )

      if (juanManuelTransaction) {
        console.log("[v0] ✅ Transacción de Juan Manuel VISIBLE después de filtros")
      } else {
        console.log("[v0] ⚠️ Transacción de Juan Manuel OCULTA por filtros activos")
        console.log("[v0] 💡 Revisa los filtros: Hotel, Estado, Responsable, o Búsqueda")
      }

      setPrestamos(prestamosData)
    } catch (error) {
      console.error("Error al filtrar:", error)
      toast({
        title: "Error al filtrar",
        description: "No se pudieron aplicar los filtros",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEliminar = async (id: string) => {
    try {
      await eliminarPrestamo(id)
      toast({
        title: "✅ Transacción eliminada",
        description: "La transacción ha sido eliminada correctamente",
      })
      aplicarFiltros()
      onActualizar?.()
    } catch (error) {
      console.error("Error al eliminar:", error)
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la transacción",
        variant: "destructive",
      })
    }
  }

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: "destructive" as const,
      pagado: "default" as const,
      cancelado: "secondary" as const,
    }
    return variants[estado as keyof typeof variants] || "default"
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Vista móvil con tarjetas
  const renderMobileView = () => (
    <div className="space-y-4">
      {prestamos.map((prestamo) => (
        <Card key={prestamo.id} className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header con fecha y responsable */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {formatearFecha(prestamo.fecha)}
                </div>
                <Badge variant={getEstadoBadge(prestamo.estado)}>{prestamo.estado}</Badge>
              </div>

              {/* Responsable */}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{prestamo.responsable}</span>
              </div>

              {/* Ruta origen → destino */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {prestamo.hotel_origen}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    {prestamo.hotel_destino}
                  </span>
                </div>
              </div>

              {/* Producto y cantidad */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{prestamo.producto}</span>
                </div>
                <div className="text-sm text-gray-600">Cantidad: {prestamo.cantidad}</div>
              </div>

              {/* Valor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-xl font-bold text-green-600">{formatearMonto(prestamo.valor)}</span>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setPrestamoSeleccionado(prestamo)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Detalle de Transacción</DialogTitle>
                        <DialogDescription>Información completa de la transacción</DialogDescription>
                      </DialogHeader>
                      {prestamoSeleccionado && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Fecha:</span>
                              <p>{formatearFecha(prestamoSeleccionado.fecha)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Estado:</span>
                              <p>
                                <Badge variant={getEstadoBadge(prestamoSeleccionado.estado)}>
                                  {prestamoSeleccionado.estado}
                                </Badge>
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Responsable:</span>
                              <p>{prestamoSeleccionado.responsable}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Valor:</span>
                              <p className="font-bold text-green-600">{formatearMonto(prestamoSeleccionado.valor)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Origen:</span>
                              <p>{prestamoSeleccionado.hotel_origen}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Destino:</span>
                              <p>{prestamoSeleccionado.hotel_destino}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium text-gray-600">Producto:</span>
                              <p>{prestamoSeleccionado.producto}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium text-gray-600">Cantidad:</span>
                              <p>{prestamoSeleccionado.cantidad}</p>
                            </div>
                            {prestamoSeleccionado.notas && (
                              <div className="col-span-2">
                                <span className="font-medium text-gray-600">Notas:</span>
                                <p className="text-gray-800">{prestamoSeleccionado.notas}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminar(prestamo.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notas si existen */}
              {prestamo.notas && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Notas:</p>
                      <p className="text-sm text-yellow-700">{prestamo.notas}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Vista de escritorio con tabla
  const renderDesktopView = () => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prestamos.map((prestamo) => (
            <TableRow key={prestamo.id}>
              <TableCell>{formatearFecha(prestamo.fecha)}</TableCell>
              <TableCell className="font-medium">{prestamo.responsable}</TableCell>
              <TableCell>{prestamo.hotel_origen}</TableCell>
              <TableCell>{prestamo.hotel_destino}</TableCell>
              <TableCell>{prestamo.producto}</TableCell>
              <TableCell>{prestamo.cantidad}</TableCell>
              <TableCell className="font-bold text-green-600">{formatearMonto(prestamo.valor)}</TableCell>
              <TableCell>
                <Badge variant={getEstadoBadge(prestamo.estado)}>{prestamo.estado}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setPrestamoSeleccionado(prestamo)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Detalle de Transacción</DialogTitle>
                        <DialogDescription>Información completa de la transacción</DialogDescription>
                      </DialogHeader>
                      {prestamoSeleccionado && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Fecha:</span>
                              <p>{formatearFecha(prestamoSeleccionado.fecha)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Estado:</span>
                              <p>
                                <Badge variant={getEstadoBadge(prestamoSeleccionado.estado)}>
                                  {prestamoSeleccionado.estado}
                                </Badge>
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Responsable:</span>
                              <p>{prestamoSeleccionado.responsable}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Valor:</span>
                              <p className="font-bold text-green-600">{formatearMonto(prestamoSeleccionado.valor)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Origen:</span>
                              <p>{prestamoSeleccionado.hotel_origen}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Destino:</span>
                              <p>{prestamoSeleccionado.hotel_destino}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium text-gray-600">Producto:</span>
                              <p>{prestamoSeleccionado.producto}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium text-gray-600">Cantidad:</span>
                              <p>{prestamoSeleccionado.cantidad}</p>
                            </div>
                            {prestamoSeleccionado.notas && (
                              <div className="col-span-2">
                                <span className="font-medium text-gray-600">Notas:</span>
                                <p className="text-gray-800">{prestamoSeleccionado.notas}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminar(prestamo.id)}
                    className="text-red-600 hover:text-red-700"
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
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Lista de Transacciones
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cargarDatos} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            {isMobile && (
              <Button variant="outline" size="sm" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
                <Filter className="h-4 w-4" />
                {mostrarFiltros ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Gestiona y visualiza todas las transacciones de préstamos ({prestamos.length} transacciones)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        {mostrarFiltros && (
          <div className={`mb-6 p-4 bg-gray-50 rounded-lg ${isMobile ? "space-y-4" : "grid grid-cols-4 gap-4"}`}>
            <div>
              <label className="block text-sm font-medium mb-1">Buscar</label>
              <Input
                placeholder="Buscar por producto, responsable..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hotel</label>
              <Select value={filtros.hotel} onValueChange={(value) => setFiltros({ ...filtros, hotel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los hoteles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los hoteles</SelectItem>
                  {hoteles.map((hotel) => (
                    <SelectItem key={hotel} value={hotel}>
                      {hotel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <Select value={filtros.estado} onValueChange={(value) => setFiltros({ ...filtros, estado: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Responsable</label>
              <Select
                value={filtros.responsable}
                onValueChange={(value) => setFiltros({ ...filtros, responsable: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los responsables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los responsables</SelectItem>
                  {responsables.map((responsable) => (
                    <SelectItem key={responsable} value={responsable}>
                      {responsable}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Lista de transacciones */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Cargando transacciones...
            </div>
          </div>
        ) : prestamos.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No se encontraron transacciones con los filtros aplicados.</AlertDescription>
          </Alert>
        ) : (
          <>
            {isMobile ? renderMobileView() : renderDesktopView()}
            <div className="mt-4 text-sm text-gray-600 text-center">Mostrando {prestamos.length} transacciones</div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
