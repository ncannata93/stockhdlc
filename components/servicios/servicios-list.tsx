"use client"

import { useState, useEffect } from "react"
import { getServices, getHotels, deleteService } from "@/lib/service-db"
import type { Service, Hotel } from "@/lib/service-types"
import { Plus, Search, AlertCircle, Edit, Trash2, Building2, DollarSign, Calendar, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ServiceWithHotel extends Service {
  hotel_name: string
}

export function ServicesList() {
  const [services, setServices] = useState<ServiceWithHotel[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterHotel, setFilterHotel] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      console.log("🔄 Cargando servicios y hoteles...")

      const [servicesData, hotelsData] = await Promise.all([getServices(), getHotels()])

      console.log("📊 Datos cargados:")
      console.log("- Servicios:", servicesData?.length || 0)
      console.log("- Hoteles:", hotelsData?.length || 0)

      setHotels(hotelsData || [])

      // Combinar servicios con nombres de hoteles
      const servicesWithHotels: ServiceWithHotel[] = (servicesData || []).map((service) => {
        const hotel = hotelsData?.find((h) => h.id === service.hotel_id)
        return {
          ...service,
          hotel_name: hotel?.name || "Hotel no encontrado",
        }
      })

      setServices(servicesWithHotels)
      console.log("✅ Servicios con hoteles:", servicesWithHotels.length)
    } catch (error) {
      console.error("❌ Error al cargar datos:", error)
      setError("Error al cargar los servicios. Por favor, intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar el servicio "${serviceName}"?\n\n` +
        "⚠️ ADVERTENCIA: Esto eliminará:\n" +
        "• El servicio completamente\n" +
        "• TODOS los pagos asociados a este servicio\n" +
        "• Esta acción NO se puede deshacer\n\n" +
        "¿Continuar con la eliminación?",
    )

    if (!confirmed) return

    setDeletingId(serviceId)
    try {
      console.log("🗑️ Eliminando servicio:", serviceId, serviceName)

      await deleteService(serviceId)

      console.log("✅ Servicio eliminado exitosamente")

      // Actualizar la lista local
      setServices((prev) => prev.filter((s) => s.id !== serviceId))

      // Mostrar mensaje de éxito
      alert(`✅ Servicio "${serviceName}" eliminado exitosamente`)
    } catch (error) {
      console.error("❌ Error al eliminar servicio:", error)
      alert(`❌ Error al eliminar el servicio: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("ARS", "$")
  }

  // Filtrar servicios
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.provider?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesHotel = filterHotel === "" || service.hotel_id === filterHotel
    const matchesCategory = filterCategory === "" || service.category === filterCategory

    return matchesSearch && matchesHotel && matchesCategory
  })

  // Obtener categorías únicas
  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean)))

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando servicios...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="ml-3 border-red-600 text-red-600 hover:bg-red-600 hover:text-white bg-transparent"
          >
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Servicios Registrados</h2>
          <p className="text-gray-600">
            Total: {services.length} servicios | Mostrando: {filteredServices.length} servicios
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = "/servicios?tab=agregar-servicio")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Servicio
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro por Hotel */}
            <div>
              <select
                value={filterHotel}
                onChange={(e) => setFilterHotel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los hoteles</option>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Categoría */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Limpiar filtros */}
            <div>
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setFilterHotel("")
                  setFilterCategory("")
                }}
                variant="outline"
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Servicios</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Mensual Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(services.reduce((sum, s) => sum + (s.average_amount || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Hoteles con Servicios</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(services.map((s) => s.hotel_id)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de servicios */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay servicios registrados</h3>
            <p className="text-gray-600 mb-4">Comienza agregando servicios para tus hoteles</p>
            <Button
              onClick={() => (window.location.href = "/servicios?tab=agregar-servicio")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Servicio
            </Button>
          </CardContent>
        </Card>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay servicios que coincidan</h3>
            <p className="text-gray-600 mb-4">No se encontraron servicios con los filtros seleccionados</p>
            <p className="text-sm text-gray-500">Total de servicios registrados: {services.length}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{service.name}</CardTitle>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      {service.hotel_name}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Activo
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Descripción */}
                  {service.description && (
                    <div>
                      <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                    </div>
                  )}

                  {/* Categoría */}
                  {service.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Categoría:</span>
                      <Badge variant="secondary">{service.category}</Badge>
                    </div>
                  )}

                  {/* Proveedor */}
                  {service.provider && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Proveedor:</span>
                      <span className="text-sm font-medium text-gray-900">{service.provider}</span>
                    </div>
                  )}

                  {/* Monto promedio */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monto promedio:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(service.average_amount || 0)}</span>
                  </div>

                  {/* Fecha de creación */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Creado:</span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {service.created_at ? new Date(service.created_at).toLocaleDateString("es-AR") : "N/A"}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Pagos
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white bg-transparent"
                      onClick={() => handleDeleteService(service.id, service.name)}
                      disabled={deletingId === service.id}
                    >
                      {deletingId === service.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Información adicional */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total de servicios:</span>
              <p className="font-medium">{services.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Hoteles registrados:</span>
              <p className="font-medium">{hotels.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Monto mensual promedio:</span>
              <p className="font-medium">
                {services.length > 0
                  ? formatCurrency(services.reduce((sum, s) => sum + (s.average_amount || 0), 0) / services.length)
                  : "$0"}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Última actualización:</span>
              <p className="font-medium">{new Date().toLocaleString("es-AR")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ServicesList
