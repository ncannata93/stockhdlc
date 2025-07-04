"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getServices, updateServicePayment, getServicePayments, getHotels } from "@/lib/service-db"
import type { Service, Hotel } from "@/lib/service-types"
import { Save, ArrowLeft, Building2 } from "lucide-react"
import { PAYMENT_METHODS } from "@/lib/service-types"

export function EditarPago() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("id")

  const [services, setServices] = useState<Service[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [selectedHotel, setSelectedHotel] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    serviceId: "",
    serviceName: "",
    hotelId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    dueDate: "",
    paymentDate: "",
    status: "pendiente",
    invoiceNumber: "",
    paymentMethod: "",
    notes: "",
  })

  useEffect(() => {
    if (paymentId) {
      loadPaymentData()
    }
  }, [paymentId])

  useEffect(() => {
    // Filtrar servicios por hotel seleccionado
    if (selectedHotel) {
      const filtered = services.filter((service) => service.hotel_id === selectedHotel)
      setFilteredServices(filtered)
    } else {
      setFilteredServices(services)
    }
  }, [selectedHotel, services])

  const loadPaymentData = async () => {
    if (!paymentId) return

    setLoadingData(true)
    try {
      const [servicesData, hotelsData, paymentsData] = await Promise.all([
        getServices(),
        getHotels(),
        getServicePayments(),
      ])

      setServices(servicesData)
      setHotels(hotelsData)
      setFilteredServices(servicesData)

      // Encontrar el pago específico
      const payment = paymentsData.find((p) => p.id === paymentId)
      if (payment) {
        setSelectedHotel(payment.hotel_id)
        setFormData({
          serviceId: payment.service_id,
          serviceName: payment.service_name,
          hotelId: payment.hotel_id,
          month: payment.month,
          year: payment.year,
          amount: payment.amount.toString(),
          dueDate: payment.due_date,
          paymentDate: payment.payment_date || "",
          status: payment.status,
          invoiceNumber: payment.invoice_number || "",
          paymentMethod: payment.payment_method || "",
          notes: payment.notes || "",
        })
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hotelId = e.target.value
    setSelectedHotel(hotelId)

    // Limpiar servicio seleccionado si no pertenece al nuevo hotel
    if (formData.serviceId) {
      const serviceExists = services.find((s) => s.id === formData.serviceId && s.hotel_id === hotelId)
      if (!serviceExists) {
        setFormData((prev) => ({
          ...prev,
          serviceId: "",
          serviceName: "",
          hotelId: "",
        }))
      }
    }
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
        }))
      }
    } else if (name === "status") {
      // Si cambia el estado, limpiar campos relacionados con el pago si no es "abonado"
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        paymentDate: value === "abonado" ? prev.paymentDate : "",
        invoiceNumber: value === "abonado" ? prev.invoiceNumber : "",
        paymentMethod: value === "abonado" ? prev.paymentMethod : "",
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentId) return

    setLoading(true)

    try {
      await updateServicePayment(paymentId, {
        service_id: formData.serviceId,
        service_name: formData.serviceName,
        hotel_id: formData.hotelId,
        month: Number(formData.month),
        year: Number(formData.year),
        amount: Number(formData.amount),
        due_date: formData.dueDate,
        payment_date: formData.paymentDate || undefined,
        status: formData.status,
        invoice_number: formData.invoiceNumber || undefined,
        payment_method: formData.paymentMethod || undefined,
        notes: formData.notes,
      })

      // Redireccionar a la lista de pagos
      window.location.href = "/servicios?tab=pagos"
    } catch (error) {
      console.error("Error al actualizar pago:", error)
      alert("Error al actualizar el pago. Intente nuevamente.")
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

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!paymentId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Pago no encontrado</h2>
          <p className="text-gray-600 mb-4">No se pudo cargar la información del pago.</p>
          <button
            onClick={() => (window.location.href = "/servicios?tab=pagos")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Volver a Pagos
          </button>
        </div>
      </div>
    )
  }

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
          <h2 className="text-xl font-semibold text-gray-800">Editar Pago de Servicio</h2>
        </div>

        {selectedHotelName && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Hotel: {selectedHotelName}</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="hotelFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Hotel *
            </label>
            <select
              id="hotelFilter"
              value={selectedHotel}
              onChange={handleHotelChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un hotel</option>
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
                </option>
              ))}
            </select>
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

          {formData.status === "abonado" && (
            <>
              <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Pago *
                </label>
                <input
                  type="date"
                  id="paymentDate"
                  name="paymentDate"
                  required={formData.status === "abonado"}
                  value={formData.paymentDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Comprobante
                </label>
                <input
                  type="text"
                  id="invoiceNumber"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Número de comprobante"
                />
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Pago *
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  required={formData.status === "abonado"}
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione forma de pago</option>
                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

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
            {loading ? "Guardando..." : "Actualizar Pago"}
          </button>
        </div>
      </form>
    </div>
  )
}
