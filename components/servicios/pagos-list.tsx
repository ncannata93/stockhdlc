"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getServicePayments,
  getHotels,
  deleteServicePayment,
  markPaymentAsPaid,
  updateServicePayment,
} from "@/lib/service-db"
import type { ServicePayment, Hotel } from "@/lib/service-types"
import {
  Trash2,
  Edit,
  Plus,
  Search,
  Building2,
  DollarSign,
  Calendar,
  ChevronUp,
  ChevronDown,
  CreditCard,
} from "lucide-react"

const MONTHS = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
}

const STATUS_COLORS = {
  pendiente: "bg-yellow-100 text-yellow-800",
  abonado: "bg-green-100 text-green-800",
  vencido: "bg-red-100 text-red-800",
}

const STATUS_LABELS = {
  pendiente: "Pendiente",
  abonado: "Abonado",
  vencido: "Vencido",
}

export function PagosList() {
  const [payments, setPayments] = useState<ServicePayment[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterHotel, setFilterHotel] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterMonth, setFilterMonth] = useState("")
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())

  // Estado para ordenamiento
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Estado para modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<ServicePayment | null>(null)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [invoiceNumber, setInvoiceNumber] = useState("")

  // Estado para modal de edición
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<ServicePayment | null>(null)
  const [editFormData, setEditFormData] = useState({
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
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  // Función para verificar si un pago está vencido
  const isPaymentOverdue = (payment: ServicePayment): boolean => {
    if (payment.status === "abonado") return false

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [year, month, day] = payment.due_date.split("T")[0].split("-")
      const dueDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      dueDate.setHours(0, 0, 0, 0)

      return dueDate < today
    } catch {
      return false
    }
  }

  // Función para actualizar estados de pagos vencidos
  const updateOverduePayments = async (paymentsData: ServicePayment[]) => {
    const updatedPayments = []
    let hasUpdates = false

    for (const payment of paymentsData) {
      if (payment.status === "pendiente" && isPaymentOverdue(payment)) {
        // Actualizar el pago a vencido en la base de datos
        try {
          await updateServicePayment(payment.id, { status: "vencido" })
          updatedPayments.push({ ...payment, status: "vencido" as const })
          hasUpdates = true
          console.log(`Pago ${payment.id} marcado como vencido automáticamente`)
        } catch (error) {
          console.error(`Error actualizando pago ${payment.id}:`, error)
          updatedPayments.push(payment)
        }
      } else {
        updatedPayments.push(payment)
      }
    }

    return { updatedPayments, hasUpdates }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [paymentsData, hotelsData] = await Promise.all([getServicePayments(), getHotels()])

      // Actualizar pagos vencidos automáticamente
      const { updatedPayments, hasUpdates } = await updateOverduePayments(paymentsData)

      setPayments(updatedPayments)
      setHotels(hotelsData)

      if (hasUpdates) {
        console.log("Se actualizaron pagos vencidos automáticamente")
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este pago?")) {
      try {
        await deleteServicePayment(id)
        await loadData()
      } catch (error) {
        console.error("Error al eliminar pago:", error)
        alert("Error al eliminar el pago")
      }
    }
  }

  const handlePaymentClick = (payment: ServicePayment) => {
    setSelectedPayment(payment)
    setPaymentDate(new Date().toISOString().split("T")[0])
    setInvoiceNumber("")
    setShowPaymentModal(true)
  }

  const handleEditClick = (payment: ServicePayment) => {
    setEditingPayment(payment)
    setEditFormData({
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
      notes: payment.notes || "",
    })
    setShowEditModal(true)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdatePayment = async () => {
    if (!editingPayment) return

    try {
      await updateServicePayment(editingPayment.id, {
        service_id: editFormData.serviceId,
        service_name: editFormData.serviceName,
        hotel_id: editFormData.hotelId,
        month: Number(editFormData.month),
        year: Number(editFormData.year),
        amount: Number(editFormData.amount),
        due_date: editFormData.dueDate,
        payment_date: editFormData.paymentDate || undefined,
        status: editFormData.status,
        invoice_number: editFormData.invoiceNumber || undefined,
        notes: editFormData.notes,
      })

      setShowEditModal(false)
      setEditingPayment(null)
      await loadData()
    } catch (error) {
      console.error("Error al actualizar pago:", error)
      alert("Error al actualizar el pago. Intente nuevamente.")
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

  const handleMarkAsPaid = async () => {
    if (!selectedPayment) return

    try {
      await markPaymentAsPaid(selectedPayment.id, paymentDate, invoiceNumber)
      setShowPaymentModal(false)
      setSelectedPayment(null)
      await loadData()
    } catch (error) {
      console.error("Error al marcar como pagado:", error)
      alert("Error al marcar el pago como abonado")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      // Crear fecha sin conversión de zona horaria
      const [year, month, day] = dateString.split("T")[0].split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      })
    } catch {
      return "Fecha inválida"
    }
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

  const getStatusBadge = (status: string) => {
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800"
    const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    )
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.hotel_name && payment.hotel_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      payment.amount.toString().includes(searchTerm)

    const matchesHotel = filterHotel === "" || payment.hotel_id === filterHotel
    const matchesStatus = filterStatus === "" || payment.status === filterStatus
    const matchesMonth = filterMonth === "" || payment.month.toString() === filterMonth
    const matchesYear = filterYear === "" || payment.year.toString() === filterYear

    return matchesSearch && matchesHotel && matchesStatus && matchesMonth && matchesYear
  })

  // Ordenar los pagos según el campo y dirección seleccionados
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (!sortField) return 0

    let aValue: any = a[sortField as keyof ServicePayment]
    let bValue: any = b[sortField as keyof ServicePayment]

    // Manejar casos especiales
    if (sortField === "hotel_name") {
      aValue = a.hotel_name || ""
      bValue = b.hotel_name || ""
    } else if (sortField === "period") {
      // Ordenar por año y mes
      const aYearMonth = `${a.year}-${a.month.toString().padStart(2, "0")}`
      const bYearMonth = `${b.year}-${b.month.toString().padStart(2, "0")}`
      aValue = aYearMonth
      bValue = bYearMonth
    } else if (sortField === "amount") {
      // Asegurar que son números
      aValue = Number(aValue)
      bValue = Number(bValue)
    } else if (sortField === "due_date") {
      // Convertir fechas a timestamps para comparación
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    // Comparar valores
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // Renderizar indicador de ordenamiento
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline-block ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline-block ml-1" />
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header con filtros */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Pagos de Servicios</h2>

          <button
            onClick={() => (window.location.href = "/servicios?tab=agregar-pago")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Pago
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <div className="relative">
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

          {/* Filtro por Estado */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="abonado">Abonado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          {/* Filtro por Mes */}
          <div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los meses</option>
              {Object.entries(MONTHS).map(([num, name]) => (
                <option key={num} value={num}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Año */}
          <div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los años</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de pagos */}
      {filteredPayments.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No hay pagos que coincidan con los filtros seleccionados</p>
        </div>
      ) : (
        <>
          {/* Vista desktop - Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("hotel_name")}
                  >
                    Hotel {renderSortIndicator("hotel_name")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("service_name")}
                  >
                    Servicio {renderSortIndicator("service_name")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("period")}
                  >
                    Período {renderSortIndicator("period")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("amount")}
                  >
                    Monto {renderSortIndicator("amount")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("due_date")}
                  >
                    Vencimiento {renderSortIndicator("due_date")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    Estado {renderSortIndicator("status")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPayments.map((payment) => (
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {MONTHS[payment.month as keyof typeof MONTHS]} {payment.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{formatDate(payment.due_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {(payment.status === "pendiente" || payment.status === "vencido") && (
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handlePaymentClick(payment)}
                            title="Marcar como pagado"
                          >
                            <CreditCard className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEditClick(payment)}
                          title="Editar pago"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
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
          <div className="md:hidden">
            <div className="space-y-4 p-4">
              {sortedPayments.map((payment) => (
                <div key={payment.id} className="bg-white border rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center mb-1">
                        <Building2 className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-600">
                          {payment.hotel_name || "Hotel no encontrado"}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">{payment.service_name}</h3>
                      <p className="text-sm text-gray-600">
                        {MONTHS[payment.month as keyof typeof MONTHS]} {payment.year}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {(payment.status === "pendiente" || payment.status === "vencido") && (
                        <button
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handlePaymentClick(payment)}
                          title="Marcar como pagado"
                        >
                          <CreditCard className="h-5 w-5" />
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEditClick(payment)}>
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeletePayment(payment.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Monto:</span>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Vencimiento:</span>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{formatDate(payment.due_date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Estado:</span>
                      {getStatusBadge(payment.status)}
                    </div>

                    {payment.payment_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Fecha de Pago:</span>
                        <span className="text-sm text-gray-900">{formatDate(payment.payment_date)}</span>
                      </div>
                    )}

                    {payment.invoice_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Factura:</span>
                        <span className="text-sm text-gray-900">{payment.invoice_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal de pago */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Marcar como Pagado</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Servicio:</strong> {selectedPayment.service_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Hotel:</strong> {selectedPayment.hotel_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Período:</strong> {MONTHS[selectedPayment.month as keyof typeof MONTHS]}{" "}
                  {selectedPayment.year}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Monto:</strong> {formatCurrency(selectedPayment.amount)}
                </p>
              </div>

              <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  id="paymentDate"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Factura (opcional)
                </label>
                <input
                  type="text"
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ej: 001-001-0000123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkAsPaid}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Marcar como Pagado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Pago</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                  <input
                    type="text"
                    value={editFormData.serviceName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hotel</label>
                  <input
                    type="text"
                    value={hotels.find((h) => h.id === editFormData.hotelId)?.name || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mes *</label>
                  <select
                    name="month"
                    value={editFormData.month}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
                  <select
                    name="year"
                    value={editFormData.year}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={editFormData.amount}
                      onChange={handleEditFormChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={editFormData.dueDate}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="abonado">Abonado</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>

                {editFormData.status === "abonado" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
                      <input
                        type="date"
                        name="paymentDate"
                        value={editFormData.paymentDate}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Factura</label>
                      <input
                        type="text"
                        name="invoiceNumber"
                        value={editFormData.invoiceNumber}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    name="notes"
                    value={editFormData.notes}
                    onChange={handleEditFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePayment}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Actualizar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
