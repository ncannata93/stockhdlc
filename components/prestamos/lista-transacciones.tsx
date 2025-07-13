"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { List, Search, Filter, Trash2, Eye, AlertCircle, Cloud, WifiOff, Database, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  obtenerPrestamosFiltrados,
  obtenerHoteles,
  obtenerResponsables,
  eliminarPrestamo,
  verificarConexion,
  verificarTablaPrestamons,
  formatearMonto,
  type Prestamo,
  type FiltrosPrestamos,
} from "@/lib/prestamos-supabase"

interface ListaTransaccionesProps {
  onPrestamoEditado?: () => void
}

export function ListaTransacciones({ onPrestamoEditado }: ListaTransaccionesProps) {
  const { toast } = useToast()
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [prestamosFiltrados, setPrestamosFiltrados] = useState<Prestamo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [tablaExiste, setTablaExiste] = useState(false)
  const [hoteles, setHoteles] = useState<string[]>([])
  const [responsables, setResponsables] = useState<string[]>([])
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null)
  const [filtros, setFiltros] = useState<FiltrosPrestamos>({})

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [conexion, tabla] = await Promise.all([verificarConexion(), verificarTablaPrestamons()])
        setConectado(conexion.conectado)
        setTablaExiste(tabla.existe)

        if (conexion.conectado && tabla.existe) {
          const [prestamosData, hotelesData, responsablesData] = await Promise.all([
            obtenerPrestamosFiltrados({}),
            obtenerHoteles(),
            obtenerResponsables(),
          ])
          setPrestamos(prestamosData)
          setPrestamosFiltrados(prestamosData)
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

  // Aplicar filtros
  const aplicarFiltros = async () => {
    if (!conectado || !tablaExiste) {
      setPrestamosFiltrados([])
      return
    }

    setIsLoading(true)
    try {
      const prestamosData = await obtenerPrestamosFiltrados(filtros)
      setPrestamosFiltrados(prestamosData)
    } catch (error) {
      console.error("Error al aplicar filtros:", error)
      toast({
        title: "Error al filtrar",
        description: "No se pudieron aplicar los filtros",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros()
  }, [filtros, conectado, tablaExiste])

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este préstamo?")) {
      return
    }

    try {
      const eliminado = await eliminarPrestamo(id)
      if (eliminado) {
        toast({
          title: "✅ Préstamo eliminado",
          description: "El préstamo ha sido eliminado exitosamente",
        })
        aplicarFiltros()
        onPrestamoEditado?.()
      }
    } catch (error) {
      console.error("Error al eliminar préstamo:", error)
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el préstamo",
        variant: "destructive",
      })
    }
  }

  const limpiarFiltros = () => {
    setFiltros({})
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

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "secondary"
      case "pagado":
        return "default"
      case "cancelado":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5 text-blue-600" />
          Lista de Transacciones
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={aplicarFiltros}
              disabled={isLoading || !conectado || !tablaExiste}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            {estadoConexion()}
          </div>
        </CardTitle>
        <CardDescription>
          Visualiza y gestiona todos los préstamos registrados ({prestamosFiltrados.length} transacciones)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!conectado && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Sin conexión a Supabase. No se pueden cargar las transacciones.</AlertDescription>
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

        {/* Filtros */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros</span>
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label>Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar..."
                  value={filtros.busqueda || ""}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Hotel */}
            <div className="space-y-2">
              <Label>Hotel</Label>
              <Select
                value={filtros.hotel || "all"}
                onValueChange={(value) => setFiltros({ ...filtros, hotel: value === "all" ? undefined : value })}
              >
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

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={filtros.estado || "all"}
                onValueChange={(value) => setFiltros({ ...filtros, estado: value === "all" ? undefined : value })}
              >
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

            {/* Responsable */}
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select
                value={filtros.responsable || "all"}
                onValueChange={(value) => setFiltros({ ...filtros, responsable: value === "all" ? undefined : value })}
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
        </div>

        {/* Tabla de transacciones */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Origen → Destino</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Cargando transacciones...
                    </div>
                  </TableCell>
                </TableRow>
              ) : prestamosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {conectado && tablaExiste
                      ? "No hay transacciones que coincidan con los filtros"
                      : "No hay datos disponibles"}
                  </TableCell>
                </TableRow>
              ) : (
                prestamosFiltrados.map((prestamo) => (
                  <TableRow key={prestamo.id}>
                    <TableCell className="font-mono text-sm">{new Date(prestamo.fecha).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{prestamo.responsable}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-medium">{prestamo.hotel_origen}</span>
                        <span>→</span>
                        <span className="text-green-600 font-medium">{prestamo.hotel_destino}</span>
                      </div>
                    </TableCell>
                    <TableCell>{prestamo.producto}</TableCell>
                    <TableCell>{prestamo.cantidad || "-"}</TableCell>
                    <TableCell className="font-bold">{formatearMonto(prestamo.valor)}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(prestamo.estado)}>{prestamo.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setPrestamoSeleccionado(prestamo)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalles del Préstamo</DialogTitle>
                              <DialogDescription>Información completa de la transacción</DialogDescription>
                            </DialogHeader>
                            {prestamoSeleccionado && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Fecha</Label>
                                    <p className="text-sm">
                                      {new Date(prestamoSeleccionado.fecha).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Responsable</Label>
                                    <p className="text-sm">{prestamoSeleccionado.responsable}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Hotel Origen</Label>
                                    <p className="text-sm text-blue-600">{prestamoSeleccionado.hotel_origen}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Hotel Destino</Label>
                                    <p className="text-sm text-green-600">{prestamoSeleccionado.hotel_destino}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Producto</Label>
                                    <p className="text-sm">{prestamoSeleccionado.producto}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Cantidad</Label>
                                    <p className="text-sm">{prestamoSeleccionado.cantidad || "No especificada"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Valor</Label>
                                    <p className="text-sm font-bold">{formatearMonto(prestamoSeleccionado.valor)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Estado</Label>
                                    <Badge variant={getBadgeVariant(prestamoSeleccionado.estado)}>
                                      {prestamoSeleccionado.estado}
                                    </Badge>
                                  </div>
                                </div>
                                {prestamoSeleccionado.notas && (
                                  <div>
                                    <Label className="text-sm font-medium">Notas</Label>
                                    <p className="text-sm bg-gray-50 p-2 rounded">{prestamoSeleccionado.notas}</p>
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  <p>Creado: {new Date(prestamoSeleccionado.created_at).toLocaleString()}</p>
                                  <p>Actualizado: {new Date(prestamoSeleccionado.updated_at).toLocaleString()}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(prestamo.id)}
                          disabled={!conectado || !tablaExiste}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {conectado && tablaExiste && prestamosFiltrados.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {prestamosFiltrados.length} de {prestamos.length} transacciones
          </div>
        )}
      </CardContent>
    </Card>
  )
}
