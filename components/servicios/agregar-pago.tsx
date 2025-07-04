"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getServices, getHotels, addServicePayment } from "@/lib/service-db"
import type { Service, Hotel } from "@/lib/service-types"
import { PAYMENT_METHODS } from "@/lib/service-types"
import { Building2, DollarSign, Calendar, FileText, CreditCard } from "lucide-react"

export function AgregarPago() {
  const [services, setServices] = useState<Service[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    serviceId: "",
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
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [servicesData, hotelsData] = await Promise.all([getServices(), getHotels()])
      setServices(servicesData)
      setHotels(hotelsData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hotelId = e.target.value
    setFormData((prev) => ({ ...prev, hotelId, serviceId: "" }))
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

  const generateDueDate = (month: number, year: number) => {
    return `${year}-${month.toString().padStart(2, "0")}-10`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedService = services.find((s) => s.id === formData.serviceId)
      const selectedHotel = hotels.find((h) => h.id === formData.hotelId)

      if (!selectedService || !selectedHotel) {
        alert("Por favor seleccione un servicio y hotel válidos")
        return
      }

      const dueDate = formData.dueDate || generateDueDate(formData.month, formData.year)

      await addServicePayment({
        service_id: formData.serviceId,
        service_name: selectedService.name,
        hotel_id: formData.hotelId,
        hotel_name: selectedHotel.name,
        month: Number(formData.month),
        year: Number(formData.year),
        amount: Number(formData.amount),
        due_date: dueDate,
        payment_date: formData.paymentDate || undefined,
        status: formData.status as "pendiente" | "abonado" | "vencido",
        invoice_number: formData.invoiceNumber || undefined,
        payment_method: formData.paymentMethod || undefined,
        notes: formData.notes,
      })

      alert("Pago agregado exitosamente")

      // Resetear formulario
      setFormData({
        serviceId: "",
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

      // Redirigir a la lista de pagos
      window.location.href = "/servicios?tab=pagos"
    } catch (error) {
      console.error("Error al agregar pago:", error)
      alert("Error al agregar el pago. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter((service) => !formData.hotelId || service.hotel_id === formData.hotelId)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <DollarSign className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Agregar Pago de Servicio</h2>
          <p className="text-sm text-gray-600">Complete la información del pago del servicio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hotel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Hotel *
            </label>
            <select
              name="hotelId"
              value={formData.hotelId}
              onChange={handleHotelChange}
              required
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

          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Servicio *
            </label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleInputChange}
              required
              disabled={!formData.hotelId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Seleccione un servicio</option>
              {filteredServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mes *</label>
            <select
              name="month"
              value={formData.month}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Año *</label>
            <select
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Monto *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Fecha de Vencimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Si no se especifica, se usará el día 10 del mes seleccionado</p>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="abonado">Abonado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          {/* Campos adicionales cuando el estado es "abonado" */}
          {formData.status === "abonado" && (
            <>
              {/* Fecha de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Fecha de Pago *
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  required={formData.status === "abonado"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Forma de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Forma de Pago *
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required={formData.status === "abonado"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione forma de pago</option>
                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Número de Comprobante */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Número de Comprobante
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 001-001-0000123"
                />
              </div>
            </>
          )}

          {/* Notas */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Información adicional sobre el pago..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => (window.location.href = "/servicios?tab=pagos")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : "Agregar Pago"}
          </button>
        </div>
      </form>
    </div>
  )
}
