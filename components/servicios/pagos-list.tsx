"use client"

import { useState, useEffect } from "react"
import { getServicePayments, deleteServicePayment, markPaymentAsPaid, getHotels } from "@/lib/service-db"
import type { ServicePayment, Hotel } from "@/lib/service-types"
import {
  Check,
  Trash2,
  Search,
  Calendar,
  DollarSign,
  AlertCircle,
  Edit,
  Building2,
  ChevronUp,
  ChevronDown,
} from "lucide-react"

type SortField = "hotel_name" | "service_name" | "month" | "amount" | "due_date" | "status"
type SortDirection = "asc" | "desc"

export function PagosList() {
  const [payments, setPayments] = useState<ServicePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterMonth, setFilterMonth] = useState<string>("all")
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString())
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [filterHotel, setFilterHotel] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("due_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const [allPayments, hotelsData] = await Promise.all([getServicePayments(), getHotels()])
      setPayments(allPayments)
      setHotels(hotelsData)
    } catch (error) {
      console.error("Error al cargar pagos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    const invoiceNumber = prompt("Número de factura (opcional):")
    try {
      await markPaymentAsPaid(paymentId, new Date().toISOString(), invoiceNumber || undefined)
      await loadPayments() // Recargar la lista
    } catch (error) {
      console.error("Error al marcar como abonado:", error)
      alert("Error al marcar como abonado")
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este pago?")) {
      try {
        await deleteServicePayment(id)
        await loadPayments() // Recargar la lista
      } catch (error) {
        console.error("Error al eliminar pago:", error)
      }
    }
  }

  const handleEditPayment = (paymentId: string) => {
    window.location.href = `/servicios?tab=editar-pago&id=${paymentId}`
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

  const formatDate = (dateString: string) => {
    // Crear la fecha sin conversión de zona horaria
    const [year, month, day] = dateString.split("T")[0].split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "abonado":
        return "bg-green-100 text-green-800"
      case "vencido":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "abonado":
        return "Abonado"
      case "vencido":
        return "Vencido"
      default:
        return "Pendiente"
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 text-gray-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-gray-600" />
    )
  }

  const sortedAndFilteredPayments = payments
    .filter((payment) => {
      const serviceName = payment.service_name || ""
      const hotelName = payment.hotel_name || ""

      const matchesSearch =
        serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMonthName(payment.month).toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "all" || payment.status === filterStatus
      const matchesMonth = filterMonth === "all" || payment.month.toString() === filterMonth
      const matchesYear = filterYear === "all" || payment.year.toString() === filterYear
      const matchesHotel = filterHotel === "all" || payment.hotel_id === filterHotel

      return matchesSearch && matchesStatus && matchesMonth && matchesYear && matchesHotel
    })
    .sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "hotel_name":
          aValue = a.hotel_name || ""
          bValue = b.hotel_name || ""
          break
        case "service_name":
          aValue = a.service_name || ""
          bValue = b.service_name || ""
          break
        case "month":
          aValue = a.year * 12 + a.month
          bValue = b.year * 12 + b.month
          break
        case "amount":
          aValue = a.amount
          bValue = b.amount
          break
        case "due_date":
          aValue = new Date(a.due_date).getTime()
          bValue = new Date(b.due_date).getTime()
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Pagos de Servicios</h2>

          <div className="flex gap-2">
            <button
              onClick={() => (window.location.href = "/servicios?tab=agregar-pago")}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Agregar Pago
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar pagos..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterHotel}
            onChange={(e) => setFilterHotel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los hoteles</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                🏨 {hotel.name}
              </option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los años</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="abonado">Abonado</option>
            <option value="vencido">Vencido</option>
          </select>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los meses</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {sortedAndFilteredPayments.length === 0 ? (
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay pagos registrados</h3>
          <p className="text-gray-500 mb-4">No se encontraron pagos que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <>
          {/* Vista desktop - Tabla */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("hotel_name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Hotel</span>
                      {getSortIcon("hotel_name")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("service_name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Servicio</span>
                      {getSortIcon("service_name")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("month")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Período</span>
                      {getSortIcon("month")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Monto</span>
                      {getSortIcon("amount")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("due_date")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Vencimiento</span>
                      {getSortIcon("due_date")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Estado</span>
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {payment.hotel_name || "Hotel no encontrado"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.service_name}</div>
                      {payment.invoice_number && (
                        <div className="text-sm text-gray-500">Factura: {payment.invoice_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getMonthName(payment.month)} {payment.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />${payment.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(payment.due_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.status)}`}
                      >
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEditPayment(payment.id)}
                          title="Editar pago"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {payment.status === "pendiente" && (
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleMarkAsPaid(payment.id)}
                            title="Marcar como abonado"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeletePayment(payment.id)}
                          title="Eliminar pago"
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
              {sortedAndFilteredPayments.map((payment) => (
                <div key={payment.id} className="bg-white border rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <Building2 className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="text-sm font-medium text-blue-800">
                          {payment.hotel_name || "Hotel no encontrado"}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">{payment.service_name}</h3>
                      <div className="text-sm text-gray-500">
                        {getMonthName(payment.month)} {payment.year}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleEditPayment(payment.id)}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {payment.status === "pendiente" && (
                        <button
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleMarkAsPaid(payment.id)}
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeletePayment(payment.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Monto:</span>
                      <span className="ml-1 text-gray-900">${payment.amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Vencimiento:</span>
                      <span className="ml-1 text-gray-900">{formatDate(payment.due_date)}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.status)}`}
                    >
                      {getStatusText(payment.status)}
                    </span>
                  </div>

                  {payment.invoice_number && (
                    <div className="mt-2 text-sm text-gray-500">Factura: {payment.invoice_number}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
