"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getServices, getHotels, deleteService, updateService } from "@/lib/service-db"
import type { Service, Hotel } from "@/lib/service-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Building2,
  DollarSign,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"

export function ServicesList() {
  const [services, setServices] = useState<Service[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterHotel, setFilterHotel] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterActive, setFilterActive] = useState("")

  // Estado para modal de edición
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    category: "",
    provider: "",
    account_number: "",
    hotel_id: "",
    notes: "",
    active: true,
    average_amount: 0,
  })

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

      setServices(servicesData || [])
      setHotels(hotelsData || [])

      console.log("✅ Datos cargados exitosamente")
    } catch (error) {
      console.error("❌ Error al cargar datos:", error)
      setError("Error al cargar los datos. Por favor, intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar este servicio? También se eliminarán todos los pagos asociados.",
      )
    ) {
      try {
        await deleteService(id)
        await loadData()
      } catch (error) {
        console.error("Error al eliminar servicio:", error)
        alert("Error al eliminar el servicio")
      }
    }
  }

  const handleEditClick = (service: Service) => {
    setEditingService(service)
    setEditFormData({
      name: service.name,
      description: service.description || "",
      category: service.category || "",
      provider: service.provider || "",
      account_number: service.account_number || "",
      hotel_id: service.hotel_id,
      notes: service.notes || "",
      active: service.active !== false,
      average_amount: service.average_amount || 0,
    })
    setShowEditModal(true)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? Number(value) : value,
    }))
  }

  const handleUpdateService = async () => {
    if (!editingService) return

    try {
      await updateService(editingService.id, editFormData)
      setShowEditModal(false)
      setEditingService(null)
      await loadData()
    } catch (error) {
      console.error("Error al actualizar servicio:", error)
      alert("Error al actualizar el servicio. Intente nuevamente.")
    }
  }

  const getHotelName = (hotelId: string) => {
    const hotel = hotels.find((h) => h.id === hotelId)
    return hotel ? hotel.name : "Hotel no encontrado"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace("ARS", "$")
  }

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Activo
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactivo
      </Badge>
    )
  }

  // Filtrar servicios
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.provider && service.provider.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesHotel = filterHotel === "" || service.hotel_id === filterHotel
    const matchesCategory = filterCategory === "" || service.category === filterCategory
    const matchesActive =
      filterActive === "" ||
      (filterActive === "active" && service.active !== false) ||
      (filterActive === "inactive" && service.active === false)

    return matchesSearch && matchesHotel && matchesCategory && matchesActive
  })

  // Obtener categorías únicas
  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean)))

  // Función para limpiar filtros
  const clearAllFilters = () => {
    setSearchTerm("")
    setFilterHotel("")
    setFilterCategory("")
    setFilterActive("")
  }

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
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 font-medium">Error al cargar datos</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button onClick={loadData} className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header con filtros */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Servicios</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {services.length} servicios | Mostrando: {filteredServices.length} servicios
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={() => (window.location.href = "/servicios?tab=agregar-servicio")}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Agregar Servicio
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
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

          {/* Filtro por Estado */}
          <div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de servicios */}
      {services.length === 0 ? (
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay servicios registrados</p>
          <p className="text-sm text-gray-400 mt-2">Agrega tu primer servicio para comenzar</p>
          <button
            onClick={() => (window.location.href = "/servicios?tab=agregar-servicio")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Agregar Primer Servicio
          </button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No hay servicios que coincidan con los filtros seleccionados</p>
          <p className="text-sm text-gray-400 mt-2">Total de servicios: {services.length}</p>
          <button
            onClick={clearAllFilters}
            className="mt-3 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <>
          {/* Vista desktop - Tabla */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hotel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Promedio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        {service.description && <div className="text-sm text-gray-500">{service.description}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-900">{getHotelName(service.hotel_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{service.category || "-"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{service.provider || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {service.average_amount ? formatCurrency(service.average_amount) : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(service.active !== false)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEditClick(service)}
                          title="Editar servicio"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteService(service.id)}
                          title="Eliminar servicio"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil - Tarjetas */}
          <div className="lg:hidden">
            <div className="space-y-4 p-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="border rounded-lg shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        {service.description && <p className="text-sm text-gray-600 mt-1">{service.description}</p>}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEditClick(service)}>
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Hotel:</span>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-900">{getHotelName(service.hotel_id)}</span>
                      </div>
                    </div>

                    {service.category && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Categoría:</span>
                        <span className="text-sm text-gray-900">{service.category}</span>
                      </div>
                    )}

                    {service.provider && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Proveedor:</span>
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{service.provider}</span>
                        </div>
                      </div>
                    )}

                    {service.average_amount && service.average_amount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Promedio:</span>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(service.average_amount)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Estado:</span>
                      {getStatusBadge(service.active !== false)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal de edición */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Servicio *</Label>
                <Input
                  id="name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  placeholder="Ej: Limpieza, Mantenimiento"
                />
              </div>

              <div>
                <Label htmlFor="hotel_id">Hotel *</Label>
                <select
                  id="hotel_id"
                  name="hotel_id"
                  value={editFormData.hotel_id}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  name="category"
                  value={editFormData.category}
                  onChange={handleEditFormChange}
                  placeholder="Ej: Limpieza, Mantenimiento, Seguridad"
                />
              </div>

              <div>
                <Label htmlFor="provider">Proveedor</Label>
                <Input
                  id="provider"
                  name="provider"
                  value={editFormData.provider}
                  onChange={handleEditFormChange}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <Label htmlFor="account_number">Número de Cuenta</Label>
                <Input
                  id="account_number"
                  name="account_number"
                  value={editFormData.account_number}
                  onChange={handleEditFormChange}
                  placeholder="Número de cuenta o referencia"
                />
              </div>

              <div>
                <Label htmlFor="average_amount">Promedio Mensual</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <Input
                    id="average_amount"
                    name="average_amount"
                    type="number"
                    value={editFormData.average_amount}
                    onChange={handleEditFormChange}
                    min="0"
                    step="0.01"
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  rows={3}
                  placeholder="Descripción del servicio"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditFormChange}
                  rows={3}
                  placeholder="Notas adicionales"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={editFormData.active}
                    onChange={handleEditFormChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="active">Servicio activo</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateService} disabled={!editFormData.name || !editFormData.hotel_id}>
              Actualizar Servicio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
