"use client"

import { useState, useEffect } from "react"
import { getReservations, deleteReservation } from "@/lib/service-db"
import type { Reservation } from "@/lib/service-types"
import { AlertCircle, Edit, Trash2, Search, Plus, Calendar, Clock } from "lucide-react"

export function ReservacionesList() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const data = await getReservations()
        setReservations(data)
      } catch (error) {
        console.error("Error loading reservations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [])

  const handleDeleteReservation = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta reservación?")) {
      try {
        await deleteReservation(id)
        setReservations(reservations.filter((reservation) => reservation.id !== id))
      } catch (error) {
        console.error("Error deleting reservation:", error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "confirmada":
        return "bg-blue-100 text-blue-800"
      case "en_proceso":
        return "bg-purple-100 text-purple-800"
      case "completada":
        return "bg-green-100 text-green-800"
      case "cancelada":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendiente":
        return "Pendiente"
      case "confirmada":
        return "Confirmada"
      case "en_proceso":
        return "En Proceso"
      case "completada":
        return "Completada"
      case "cancelada":
        return "Cancelada"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Reservaciones</h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar reservaciones..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <a
              href="/servicios?tab=agregar-reservacion"
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Reservación</span>
            </a>
          </div>
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay reservaciones disponibles</h3>
          <p className="text-gray-500 mb-4">No se encontraron reservaciones que coincidan con tu búsqueda.</p>
          <a
            href="/servicios?tab=agregar-reservacion"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Reservación</span>
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{reservation.clientName}</div>
                    <div className="text-sm text-gray-500">Hab. {reservation.roomNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reservation.serviceName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(reservation.dateTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {formatTime(reservation.dateTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.status)}`}
                    >
                      {getStatusText(reservation.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => console.log("Edit reservation", reservation.id)}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteReservation(reservation.id)}
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
      )}

      {/* Vista móvil - Tarjetas */}
      <div className="sm:hidden">
        <div className="space-y-4 p-4">
          {filteredReservations.map((reservation) => (
            <div key={reservation.id} className="bg-white border rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{reservation.clientName}</h3>
                  <div className="text-sm text-gray-500">Hab. {reservation.roomNumber}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-indigo-600 hover:text-indigo-900"
                    onClick={() => console.log("Edit reservation", reservation.id)}
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteReservation(reservation.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 text-sm">
                <div className="font-medium text-gray-900">{reservation.serviceName}</div>
                <div className="mt-2 flex items-center text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(reservation.dateTime)}
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(reservation.dateTime)}
                </div>
              </div>

              <div className="mt-3">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.status)}`}
                >
                  {getStatusText(reservation.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
