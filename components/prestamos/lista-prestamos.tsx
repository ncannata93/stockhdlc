"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Filter, CheckCircle, Clock, Building2, User, Calendar, DollarSign } from 'lucide-react'

interface PrestamoItem {
  id: string
  responsable: string
  prestamista: string
  prestatario: string
  concepto: string
  monto: number
  fecha: string
  estado: "activo" | "devuelto"
  observaciones?: string
}

export function ListaPrestamos() {
  const [filtros, setFiltros] = useState({
    busqueda: "",
    estado: "todos",
    entidad: "todas"
  })

  // Datos de ejemplo
  const prestamos: PrestamoItem[] = [
    {
      id: "1",
      responsable: "Juan Manuel",
      prestamista: "Hotel Jaguel",
      prestatario: "Hotel Monaco",
      concepto: "Toallas",
      monto: 5000,
      fecha: "2024-01-15",
      estado: "activo",
      observaciones: "20 unidades de toallas blancas"
    },
    {
      id: "2", 
      responsable: "Diego",
      prestamista: "Juan Manuel",
      prestatario: "Hotel Mallak",
      concepto: "Efectivo",
      monto: 3500,
      fecha: "2024-01-10",
      estado: "activo"
    },
    {
      id: "3",
      responsable: "Nacho",
      prestamista: "Hotel Argentina",
      prestatario: "Hotel Falkner",
      concepto: "Sábanas",
      monto: 2000,
      fecha: "2024-01-08",
      estado: "devuelto",
      observaciones: "15 juegos de sábanas"
    },
    {
      id: "4",
      responsable: "Juan Manuel",
      prestamista: "Hotel Stromboli",
      prestatario: "Diego",
      concepto: "Efectivo",
      monto: 8000,
      fecha: "2024-01-05",
      estado: "activo"
    },
    {
      id: "5",
      responsable: "Diego",
      prestamista: "Hotel San Miguel",
      prestatario: "Hotel Colores",
      concepto: "Productos de limpieza",
      monto: 1200,
      fecha: "2024-01-03",
      estado: "devuelto"
    },
    {
      id: "6",
      responsable: "Nacho",
      prestamista: "Hotel Puntarenas",
      prestatario: "Hotel Tupe",
      concepto: "Almohadas",
      monto: 1800,
      fecha: "2024-01-01",
      estado: "activo",
      observaciones: "12 almohadas de pluma"
    }
  ]

  const prestamosFiltrados = prestamos.filter(prestamo => {
    const matchBusqueda = prestamo.prestamista.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                         prestamo.prestatario.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                         prestamo.concepto.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                         prestamo.responsable.toLowerCase().includes(filtros.busqueda.toLowerCase())
    
    const matchEstado = filtros.estado === "todos" || prestamo.estado === filtros.estado
    
    const matchEntidad = filtros.entidad === "todas" || 
                        prestamo.prestamista === filtros.entidad || 
                        prestamo.prestatario === filtros.entidad

    return matchBusqueda && matchEstado && matchEntidad
  })

  const estadisticas = {
    total: prestamosFiltrados.length,
    activos: prestamosFiltrados.filter(p => p.estado === "activo").length,
    devueltos: prestamosFiltrados.filter(p => p.estado === "devuelto").length,
    montoTotal: prestamosFiltrados.reduce((sum, p) => sum + p.monto, 0)
  }

  const entidadesUnicas = Array.from(new Set([
    ...prestamos.map(p => p.prestamista),
    ...prestamos.map(p => p.prestatario)
  ])).sort()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Lista de Préstamos
        </CardTitle>
        <CardDescription>Historial completo de préstamos registrados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por entidad, concepto..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select value={filtros.estado} onValueChange={(value) => setFiltros({...filtros, estado: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="devuelto">Devueltos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Entidad</label>
            <Select value={filtros.entidad} onValueChange={(value) => setFiltros({...filtros, entidad: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las entidades</SelectItem>
                {entidadesUnicas.map(entidad => (
                  <SelectItem key={entidad} value={entidad}>{entidad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Estadísticas de filtros */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
            <div className="text-sm text-blue-600">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{estadisticas.activos}</div>
            <div className="text-sm text-green-600">Activos</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{estadisticas.devueltos}</div>
            <div className="text-sm text-gray-600">Devueltos</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">${estadisticas.montoTotal.toLocaleString()}</div>
            <div className="text-sm text-orange-600">Monto Total</div>
          </div>
        </div>

        {/* Lista de préstamos */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {prestamosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron préstamos con los filtros aplicados</p>
            </div>
          ) : (
            prestamosFiltrados.map((prestamo) => (
              <div key={prestamo.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {prestamo.responsable}
                      </Badge>
                      <Badge 
                        variant={prestamo.estado === "activo" ? "default" : "secondary"}
                        className={prestamo.estado === "activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {prestamo.estado === "activo" ? (
                          <><Clock className="h-3 w-3 mr-1" />Activo</>
                        ) : (
                          <><CheckCircle className="h-3 w-3 mr-1" />Devuelto</>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {prestamo.prestamista.startsWith("Hotel") ? <Building2 className="h-4 w-4 text-green-600" /> : <User className="h-4 w-4 text-green-600" />}
                        <span className="font-medium text-green-700">{prestamo.prestamista}</span>
                        <span className="text-gray-500">→</span>
                        {prestamo.prestatario.startsWith("Hotel") ? <Building2 className="h-4 w-4 text-red-600" /> : <User className="h-4 w-4 text-red-600" />}
                        <span className="font-medium text-red-700">{prestamo.prestatario}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{new Date(prestamo.fecha).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-orange-500" />
                          <span className="font-bold text-orange-600">${prestamo.monto.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-sm">
                      <span className="font-medium">Concepto:</span> {prestamo.concepto}
                      {prestamo.observaciones && (
                        <div className="text-gray-600 mt-1">
                          <span className="font-medium">Obs:</span> {prestamo.observaciones}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {prestamo.estado === "activo" && (
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar Devuelto
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
