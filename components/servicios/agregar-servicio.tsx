"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getServices, addService, updateService, getHotels } from "@/lib/service-db"
import type { Hotel } from "@/lib/service-types"
import { SERVICE_CATEGORIES, SERVICE_NAME_EXAMPLES } from "@/lib/service-types"
import { Save, ArrowLeft, Info, Lightbulb } from "lucide-react"

export function AgregarServicio() {
  const searchParams = useSearchParams()
  const serviceId = searchParams.get("id")
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedCategory, setSelectedCategory] = useState("electricidad")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "electricidad",
    account_number: "",
    hotel_id: "",
    average_amount: "",
    notes: "",
    active: true,
  })

  useEffect(() => {
    loadHotels()
    if (serviceId) {
      loadService(serviceId)
      setIsEditing(true)
    }
  }, [serviceId])

  const loadHotels = async () => {
    try {
      const hotelsData = await getHotels()
      setHotels(hotelsData)
    } catch (error) {
      console.error("Error al cargar hoteles:", error)
    }
  }

  const loadService = async (id: string) => {
    try {
      const services = await getServices()
      const service = services.find((s) => s.id === id)
      if (service) {
        setFormData({
          name: service.name,
          description: service.description || "",
          category: service.category,
          account_number: service.account_number || "",
          hotel_id: service.hotel_id,
          average_amount: service.average_amount?.toString() || "",
          notes: service.notes || "",
          active: service.active,
        })
        setSelectedCategory(service.category)
      }
    } catch (error) {
      console.error("Error al cargar servicio:", error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))

      if (name === "category") {
        setSelectedCategory(value)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.hotel_id) {
      alert("Por favor selecciona un hotel")
      return
    }

    if (!formData.name.trim()) {
      alert("Por favor ingresa el nombre del servicio")
      return
    }

    setLoading(true)

    try {
      const serviceData = {
        ...formData,
        average_amount: formData.average_amount ? Number(formData.average_amount) : 0,
      }

      if (isEditing && serviceId) {
        await updateService(serviceId, serviceData)
      } else {
        await addService({
          ...serviceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Redireccionar a la lista de servicios
      window.location.href = "/servicios?tab=servicios"
    } catch (error) {
      console.error("Error al guardar servicio:", error)
      alert("Error al guardar el servicio. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const exampleNames = SERVICE_NAME_EXAMPLES[selectedCategory as keyof typeof SERVICE_NAME_EXAMPLES] || []

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <button
            onClick={() => (window.location.href = "/servicios?tab=servicios")}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">{isEditing ? "Editar" : "Agregar"} Servicio</h2>
        </div>
        {!isEditing && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Generación automática de pagos</p>
                <p>
                  Al crear este servicio, se generarán automáticamente los pagos para los próximos 12 meses con el monto
                  promedio especificado.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="hotel_id" className="block text-sm font-medium text-gray-700 mb-1">
              Hotel *
            </label>
            <select
              id="hotel_id"
              name="hotel_id"
              required
              value={formData.hotel_id}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar hotel</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(SERVICE_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Servicio (incluye proveedor) *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Electricidad - Edenor, Gas - Metrogas, Internet - Fibertel"
            />

            {exampleNames.length > 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">
                      Ejemplos para {SERVICE_CATEGORIES[selectedCategory as keyof typeof SERVICE_CATEGORIES]}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {exampleNames.map((example, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, name: example }))}
                          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Cuenta/Cliente
            </label>
            <input
              type="text"
              id="account_number"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Número de cliente o cuenta"
            />
          </div>

          <div>
            <label htmlFor="average_amount" className="block text-sm font-medium text-gray-700 mb-1">
              Monto Promedio Mensual
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                id="average_amount"
                name="average_amount"
                min="0"
                step="0.01"
                value={formData.average_amount}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Este monto se usará para generar automáticamente los pagos mensuales
            </p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción Adicional (Opcional)
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Información adicional sobre el servicio"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Información adicional, contactos, horarios, etc."
            ></textarea>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Servicio activo
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => (window.location.href = "/servicios?tab=servicios")}
            className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "Guardando..." : isEditing ? "Actualizar Servicio" : "Crear Servicio y Pagos"}
          </button>
        </div>
      </form>
    </div>
  )
}
