"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getServices, addServicePayment, getHotels } from "@/lib/service-db"
import type { Service, Hotel } from "@/lib/service-types"
import { Save, ArrowLeft, Building2 } from "lucide-react"

export function AgregarPago() {
  const searchParams = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [selectedHotel, setSelectedHotel] = useState("")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    serviceId: "",
    serviceName: "",
    hotelId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    dueDate: "",
    status: "pendiente",
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Filtrar servicios por hotel seleccionado
    if (selectedHotel) {
      const filtered = services.filter((service) => service.hotel_id === selectedHotel)
      setFilteredServices(filtered)
    } else {
      setFilteredServices(services)
    }

    // Limpiar servicio seleccionado si no está en el hotel filtrado
    if (selectedHotel && formData.serviceId) {
      const serviceExists = services.find((s) => s.id === formData.serviceId && s.hotel_id === selectedHotel)
      if (!serviceExists) {
        setFormData((prev) => ({
          ...prev,
          serviceId: "",
          serviceName: "",
          hotelId: "",
          amount: "",
        }))
      }
    }
  }, [selectedHotel, services, formData.serviceId])

  const loadData = async () => {
    try {
      const [servicesData, hotelsData] = await Promise.all([getServices(), getHotels()])

      setServices(servicesData)
      setHotels(hotelsData)
      setFilteredServices(servicesData)

      // Verificar si hay un hotelId en la URL
      const hotelIdParam = searchParams.get("hotelId")
      if (hotelIdParam) {
        setSelectedHotel(hotelIdParam)
      }

      // Si hay un serviceId en la URL, seleccionarlo
      const serviceIdParam = searchParams.get("serviceId")
      if (serviceIdParam && servicesData.length > 0) {
        const service = servicesData.find((s) => s.id === serviceIdParam)
        if (service) {
          setSelectedHotel(service.hotel_id)
          setFormData((prev) => ({
            ...prev,
            serviceId: service.id,
            serviceName: service.name,
            hotelId: service.hotel_id,
            amount: service.average_amount?.toString() || "",
          }))
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }

  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hotelId = e.target.value
    setSelectedHotel(hotelId)

    // Limpiar servicio seleccionado
    setFormData((prev) => ({
      ...prev,
      serviceId: "",
      serviceName: "",
      hotelId: "",
      amount: "",
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "serviceId" && value) {
      const selectedService = filteredServices.find((s) => s.id === value)
      if (selectedService) {
        setFormData((prev) => ({
          ...prev,
          serviceId: value,
          serviceName: selectedService.name,
          hotelId: selectedService.hotel_id,
          amount: selectedService.average_amount?.toString() || prev.amount,
        }))
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addServicePayment({
        service_id: formData.serviceId,
        service_name: formData.serviceName,
        hotel_id: formData.hotelId,
        month: Number(formData.month),
        year: Number(formData.year),
        amount: Number(formData.amount),
        due_date: formData.dueDate,
        status: formData.status,
        notes: formData.notes,
      })

      // Redireccionar a la lista de pagos
      window.location.href = "/servicios?tab=pagos"
    } catch (error) {
      console.error("Error al guardar pago:", error)
      alert("Error al guardar el pago. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    return months[month - 1]
  }

  const selectedHotelName = hotels.find((h) => h.id === selectedHotel)?.name

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <button
            onClick={() => (window.location.href = "/servicios?tab=pagos")}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">Registrar Pago de Servicio</h2>
        </div>

        {selectedHotelName && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Hotel seleccionado: {selectedHotelName}</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="hotelFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Hotel *
            </label>
            <select
              id="hotelFilter"
              value={selectedHotel}
              onChange={handleHotelChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un hotel primero</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  🏨 {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1">
              Servicio *
            </label>
            <select
              id="serviceId"
              name="serviceId"
              required
              value={formData.serviceId}
              onChange={handleChange}
              disabled={!selectedHotel}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">{selectedHotel ? "Seleccione un servicio" : "Primero seleccione un hotel"}</option>
              {filteredServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.provider}
                  {service.average_amount && ` (Promedio: $${service.average_amount})`}
                </option>
              ))}
            </select>
            {selectedHotel && filteredServices.length === 0 && (
              <p className="mt-1 text-sm text-red-600">
                No hay servicios registrados para este hotel.{" "}
                <a href="/servicios?tab=agregar-servicio" className="text-blue-600 hover:underline">
                  Agregar servicio
                </a>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                Mes *
              </label>
              <select
                id="month"
                name="month"
                required
                value={formData.month}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Año *
              </label>
              <select
                id="year"
                name="year"
                required
                value={formData.year}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Monto *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Vencimiento *
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              required
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado *
            </label>
            <select
              id="status"
              name="status"
              required
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="abonado">Abonado</option>
              <option value="vencido">Vencido</option>
            </select>
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
              placeholder="Información adicional sobre el pago"
            ></textarea>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => (window.location.href = "/servicios?tab=pagos")}
            className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !formData.serviceId}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "Guardando..." : "Registrar Pago"}
          </button>
        </div>
      </form>
    </div>
  )
}
