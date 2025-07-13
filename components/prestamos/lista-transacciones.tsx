"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { obtenerPrestamosFiltrados, actualizarPrestamo, formatearMonto } from "@/lib/prestamos-db"
import { HOTELES, RESPONSABLES, ESTADOS_PRESTAMO } from "@/lib/prestamos-types"
import type { Prestamo, FiltrosPrestamos } from "@/lib/prestamos-types"

interface ListaTransaccionesProps {
  refreshTrigger?: number
  onRefresh?: () => void
}

export function ListaTransacciones({ refreshTrigger, onRefresh }: ListaTransaccionesProps) {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosPrestamos>({
    hotelOrigen: "",
    hotelDestino: "",
    estado: "",
    responsable: "",
  })
  const [busqueda, setBusqueda] = useState("")

  const cargarPrestamos = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const prestamosData = await obtenerPrestamosFiltrados(filtros)
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
  }, [filtros, refreshTrigger])

  const handleCambiarEstado = async (id: string, nuevoEstado: "pendiente" | "pagado" | "cancelado") => {
    try {
      await actualizarPrestamo(id, { estado: nuevoEstado })
      await cargarPrestamos()
      onRefresh?.()
    } catch (error) {
      console.error("Error al cambiar estado:", error)
    }
  }

  const obtenerBadgeEstado = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
      case "pagado":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pagado
          </Badge>
        )
      case "cancelado":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const prestamosFiltrados = prestamos.filter((prestamo) => {
    if (!busqueda) return true
    const busquedaLower = busqueda.toLowerCase()
    return (
      prestamo.concepto.toLowerCase().includes(busquedaLower) ||
      prestamo.hotelOrigen.toLowerCase().includes(busquedaLower) ||
      prestamo.hotelDestino.toLowerCase().includes(busquedaLower) ||
      prestamo.responsable.toLowerCase().includes(busquedaLower)
    )
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
              placeholder="Buscar por concepto, hotel o responsable..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filtros.hotelOrigen || "Todos los hoteles"}
              onValueChange={(value) => setFiltros({ ...filtros, hotelOrigen: value || undefined })}
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
              onValueChange={(value) => setFiltros({ ...filtros, hotelDestino: value || undefined })}
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
              value={filtros.estado || "Todos los estados"}
              onValueChange={(value) => setFiltros({ ...filtros, estado: (value as any) || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos los estados">Todos los estados</SelectItem>
                {ESTADOS_PRESTAMO.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filtros.responsable || "Todos los responsables"}
              onValueChange={(value) => setFiltros({ ...filtros, responsable: value || undefined })}
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Estado</TableHead>
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
                        <Building2 className="h-4 w-4 text-blue-600" />
                        {prestamo.hotelOrigen}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-green-600" />
                        {prestamo.hotelDestino}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-lg">{formatearMonto(prestamo.monto)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={prestamo.concepto}>
                        {prestamo.concepto}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {prestamo.responsable}
                      </div>
                    </TableCell>
                    <TableCell>{obtenerBadgeEstado(prestamo.estado)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {prestamo.estado === "pendiente" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCambiarEstado(prestamo.id, "pagado")}
                              className="bg-green-50 hover:bg-green-100 text-green-700"
                            >
                              Marcar Pagado
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCambiarEstado(prestamo.id, "cancelado")}
                              className="bg-red-50 hover:bg-red-100 text-red-700"
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        {prestamo.estado === "pagado" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCambiarEstado(prestamo.id, "pendiente")}
                            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                          >
                            Marcar Pendiente
                          </Button>
                        )}
                        {prestamo.estado === "cancelado" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCambiarEstado(prestamo.id, "pendiente")}
                            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                          >
                            Reactivar
                          </Button>
                        )}
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
  )
}
