"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { addReservation, getServices } from "@/lib/service-db"
import type { Service, Reservation } from "@/lib/service-types"
import { ArrowLeft, Save } from "lucide-react"

interface AgregarReservacionProps {
  onBack: () => void
}

export function AgregarReservacion({ onBack }: AgregarReservacionProps) {
  const [services, setServices] = useState<Service[]>([])
  const [formData, setFormData] = useState({
    clientName: "",
    roomNumber: "",
    serviceId: "",
    serviceName: "",
    date: "",
    time: "",
    notes: "",
    status: "pendiente",
  })
  const [loading, setLoading] = useState(false)
  const [loadingServices, setLoadingServices] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await getServices()
        setServices(data.filter((service) => service.available))
      } catch (error) {
        console.error("Error loading services:", error)
      } finally {
        setLoadingServices(false)
      }
    }

    loadServices()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === "serviceId") {
      const selectedService = services.find((service) => service.id === value)
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        serviceName: selectedService ? selectedService.name : "",
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validación básica
      if (!formData.clientName || !formData.roomNumber || !formData.serviceId || !formData.date || !formData.time) {
        throw new Error("Por favor completa todos los campos requeridos")
      }

      // Crear fecha y hora combinadas
      const dateTime = new Date(`${formData.date}T${formData.time}:00`)

      if (isNaN(dateTime.getTime())) {
        throw new Error("Fecha u hora inválida")
      }

      // Validar que la fecha no sea en el pasado
      const now = new Date()
      if (dateTime < now) {
        throw new Error("La fecha y hora de la reservación no puede ser en el pasado")
      }

      const newReservation: Omit<Reservation, "id"> = {
        clientName: formData.clientName,
        roomNumber: formData.roomNumber,
        serviceId: formData.serviceId,
        serviceName: formData.serviceName,
        dateTime: dateTime.toISOString(),
        notes: formData.notes,
        status: formData.status,
        createdAt: new Date().toISOString(),
      }

      await addReservation(newReservation)
      setSuccess(true)
      setFormData({
        clientName: "",
        roomNumber: "",
        serviceId: "",
        serviceName: "",
        date: "",
        time: "",
        notes: "",
        status: "pendiente",
      })

      // Redirigir después de 2 segundos
      setTimeout(() => {
        onBack()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ha ocurrido un error al guardar la reservación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-gray-100" aria-label="Volver">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">Agregar Nueva Reservación</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
            <p>¡Reservación agregada correctamente!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="col-span-1">
            <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Habitación *
            </label>
            <input
              type="text"
              id="roomNumber"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1">
              Servicio *
            </label>
            {loadingServices ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-500">Cargando servicios...</span>
              </div>
            ) : services.length === 0 ? (
              <div className="text-sm text-red-500">
                No hay servicios disponibles. Por favor, agregue servicios primero.
              </div>
            ) : (
              <select
                id="serviceId"
                name="serviceId"
                value={formData.serviceId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccione un servicio</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ${service.price.toFixed(2)} - {service.duration} min
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="col-span-1">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="col-span-1">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Hora *
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="col-span-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || loadingServices || services.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Reservación</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
