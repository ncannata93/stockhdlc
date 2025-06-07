"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Plus, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react"

interface Empleado {
  id: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  direccion: string
  tarifa_diaria: number
  activo: boolean
  fecha_ingreso: string
}

export default function EmpleadosList() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [filteredEmpleados, setFilteredEmpleados] = useState<Empleado[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const mockEmpleados: Empleado[] = [
        {
          id: "1",
          nombre: "Juan",
          apellido: "Pérez",
          telefono: "+54 9 11 1234-5678",
          email: "juan.perez@email.com",
          direccion: "Av. Corrientes 1234, CABA",
          tarifa_diaria: 15000,
          activo: true,
          fecha_ingreso: "2024-01-15",
        },
        {
          id: "2",
          nombre: "María",
          apellido: "González",
          telefono: "+54 9 11 8765-4321",
          email: "maria.gonzalez@email.com",
          direccion: "Calle Falsa 123, CABA",
          tarifa_diaria: 18000,
          activo: true,
          fecha_ingreso: "2024-02-20",
        },
        {
          id: "3",
          nombre: "Carlos",
          apellido: "López",
          telefono: "+54 9 11 5555-6666",
          email: "carlos.lopez@email.com",
          direccion: "San Martín 456, CABA",
          tarifa_diaria: 16500,
          activo: false,
          fecha_ingreso: "2023-12-10",
        },
      ]
      setEmpleados(mockEmpleados)
      setFilteredEmpleados(mockEmpleados)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    const filtered = empleados.filter(
      (empleado) =>
        empleado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empleado.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empleado.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredEmpleados(filtered)
  }, [searchTerm, empleados])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lista de Empleados</h2>
          <p className="text-gray-600">Gestiona la información de todos los empleados</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar empleados por nombre, apellido o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">
              {filteredEmpleados.length} empleado{filteredEmpleados.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Lista de empleados */}
      {filteredEmpleados.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron empleados</p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza agregando tu primer empleado"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEmpleados.map((empleado) => (
            <Card key={empleado.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {empleado.nombre} {empleado.apellido}
                      </h3>
                      <Badge variant={empleado.activo ? "default" : "secondary"}>
                        {empleado.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {empleado.telefono}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {empleado.email}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {empleado.direccion}
                      </div>
                      <div className="font-medium text-green-600">{formatCurrency(empleado.tarifa_diaria)}/día</div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Fecha de ingreso: {formatDate(empleado.fecha_ingreso)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{empleados.filter((e) => e.activo).length}</p>
              <p className="text-sm text-gray-600">Empleados Activos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{empleados.filter((e) => !e.activo).length}</p>
              <p className="text-sm text-gray-600">Empleados Inactivos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(empleados.reduce((sum, e) => sum + e.tarifa_diaria, 0) / empleados.length || 0)}
              </p>
              <p className="text-sm text-gray-600">Tarifa Promedio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
