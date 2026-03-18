"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getServicePayments,
  getHotels,
  deleteServicePayment,
  markPaymentAsPaid,
  updateServicePayment,
  getServices,
  addServicePayment,
} from "@/lib/service-db"
import type { Service } from "@/lib/service-types"
import type { ServicePayment, Hotel } from "@/lib/service-types"
import { PAYMENT_METHODS } from "@/lib/service-types"
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
  Receipt,
  AlertCircle,
  RefreshCw,
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

interface PagosListProps {
  initialFilterStatus?: string | null
}

const ITEMS_PER_PAGE = 50

export function PagosList({ initialFilterStatus }: PagosListProps) {
  const [payments, setPayments] = useState<ServicePayment[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterHotel, setFilterHotel] = useState("")
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus || "")

  // Inicializar filtros con mes y ano actual (sin filtro si viene de acceso rapido)
  const currentDate = new Date()
  const [filterMonth, setFilterMonth] = useState(initialFilterStatus ? "" : (currentDate.getMonth() + 1).toString())
  const [filterYear, setFilterYear] = useState(initialFilterStatus ? "" : currentDate.getFullYear().toString())
  
  // Paginacion
  const [currentPage, setCurrentPage] = useState(1)

  // Estado para ordenamiento
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Estado para modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<ServicePayment | null>(null)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  // Estado para modal de agregar pago
  const [showAddModal, setShowAddModal] = useState(false)
  const [addFormData, setAddFormData] = useState({
    serviceId: "",
    hotelId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    dueDate: "",
  })

  // Estado para modal de edicion
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
    paymentMethod: "",
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
        } catch {
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
    setError("")
    try {
      const [paymentsData, hotelsData, servicesData] = await Promise.all([
        getServicePayments(), 
        getHotels(),
        getServices()
      ])

      // Actualizar pagos vencidos automaticamente
      const { updatedPayments } = await updateOverduePayments(paymentsData || [])

      setPayments(updatedPayments)
      setHotels(hotelsData || [])
      setServices(servicesData || [])
    } catch {
      setError("Error al cargar los datos. Por favor, intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async () => {
    if (!addFormData.serviceId || !addFormData.hotelId || !addFormData.amount || !addFormData.dueDate) {
      alert("Por favor complete todos los campos requeridos")
      return
    }

    try {
      const selectedService = services.find(s => s.id === addFormData.serviceId)
      await addServicePayment({
        service_id: addFormData.serviceId,
        service_name: selectedService?.name || "",
        hotel_id: addFormData.hotelId,
        month: addFormData.month,
        year: addFormData.year,
        amount: Number(addFormData.amount),
        due_date: addFormData.dueDate,
        status: "pendiente",
      })
      
      setShowAddModal(false)
      setAddFormData({
        serviceId: "",
        hotelId: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: "",
        dueDate: "",
      })
      await loadData()
    } catch {
      alert("Error al crear el pago. Intente nuevamente.")
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
      } catch {
        alert("Error al eliminar el pago")
      }
    }
  }

  const handlePaymentClick = (payment: ServicePayment) => {
    setSelectedPayment(payment)
    setPaymentDate(new Date().toISOString().split("T")[0])
    setInvoiceNumber("")
    setPaymentMethod("")
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
      paymentMethod: payment.payment_method || "",
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
        payment_method: editFormData.paymentMethod || undefined,
        notes: editFormData.notes,
      })

      setShowEditModal(false)
      setEditingPayment(null)
      await loadData()
    } catch {
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

      // También actualizar el método de pago si se proporcionó
      if (paymentMethod) {
        await updateServicePayment(selectedPayment.id, {
          payment_method: paymentMethod,
        })
      }

      setShowPaymentModal(false)
      setSelectedPayment(null)
      await loadData()
    } catch {
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

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return ""
    return PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS] || method
  }

  // Calcular pagos filtrados
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.hotel_name && payment.hotel_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      payment.amount.toString().includes(searchTerm)

    const matchesHotel = filterHotel === "" || payment.hotel_id === filterHotel
    const matchesStatus = filterStatus === "" || payment.status === filterStatus
    const matchesMonth = filterMonth === "" || payment.month === Number(filterMonth)
    const matchesYear = filterYear === "" || payment.year === Number(filterYear)

    return matchesSearch && matchesHotel && matchesStatus && matchesMonth && matchesYear
  })

  // Calcular totales de los pagos filtrados
  const totals = {
    count: filteredPayments.length,
    total: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
    pendiente: filteredPayments.filter(p => p.status === "pendiente").reduce((sum, p) => sum + p.amount, 0),
    abonado: filteredPayments.filter(p => p.status === "abonado" || p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
    vencido: filteredPayments.filter(p => p.status === "vencido").reduce((sum, p) => sum + p.amount, 0),
  }

  // Ordenar los pagos segun el campo y direccion seleccionados
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
    } else if (sortField === "payment_date") {
      // Ordenar por fecha de pago - los sin fecha van al final
      if (!a.payment_date && !b.payment_date) return 0
      if (!a.payment_date) return sortDirection === "asc" ? 1 : -1
      if (!b.payment_date) return sortDirection === "asc" ? -1 : 1
      aValue = new Date(a.payment_date).getTime()
      bValue = new Date(b.payment_date).getTime()
    } else if (sortField === "payment_method") {
      // Ordenar por forma de pago - los sin método van al final
      if (!a.payment_method && !b.payment_method) return 0
      if (!a.payment_method) return sortDirection === "asc" ? 1 : -1
      if (!b.payment_method) return sortDirection === "asc" ? -1 : 1
      aValue = getPaymentMethodLabel(a.payment_method)
      bValue = getPaymentMethodLabel(b.payment_method)
    }

    // Comparar valores
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // Calcular paginacion
  const totalPages = Math.ceil(sortedPayments.length / ITEMS_PER_PAGE)
  const paginatedPayments = sortedPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset a pagina 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterHotel, filterStatus, filterMonth, filterYear])

  // Renderizar indicador de ordenamiento
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline-block ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline-block ml-1" />
    )
  }

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm("")
    setFilterHotel("")
    setFilterStatus("")
    setFilterMonth("")
    setFilterYear("")
  }

  // Función para restablecer filtros por defecto (mes y año actual)
  const resetToCurrentMonth = () => {
    const currentMonth = (currentDate.getMonth() + 1).toString()
    const currentYear = currentDate.getFullYear().toString()

    setSearchTerm("")
    setFilterHotel("")
    setFilterStatus("")
    setFilterMonth(currentMonth)
    setFilterYear(currentYear)
  }

  // Función para recargar datos
  const handleRefresh = () => {
    loadData()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando pagos...</span>
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
    <div className="bg-white rounded-lg shadow flex flex-col h-full max-h-[calc(100vh-180px)]">
      {/* Header compacto con filtros */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">Pagos de Servicios</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {filteredPayments.length} de {payments.length}
            </span>
            {filterMonth && filterYear && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {MONTHS[Number(filterMonth) as keyof typeof MONTHS]} {filterYear}
              </span>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {filteredPayments.filter(p => p.status === "pendiente" || p.status === "vencido").length > 0 && (
              <button
                onClick={() => setFilterStatus("pendiente")}
                className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs hover:bg-yellow-200 transition-colors font-medium"
                title="Ver solo pendientes"
              >
                <AlertCircle className="h-3 w-3" />
                {filteredPayments.filter(p => p.status === "pendiente" || p.status === "vencido").length} Pend.
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200 transition-colors"
              title="Recargar datos"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            <button
              onClick={resetToCurrentMonth}
              className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200 transition-colors"
              title="Volver al mes actual"
            >
              <Calendar className="h-3 w-3" />
            </button>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200 transition-colors"
            >
              Todos
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="h-3 w-3" />
              Nuevo
            </button>
          </div>
        </div>

        {/* Filtros compactos en una linea */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {/* Busqueda */}
          <div className="col-span-2 sm:col-span-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-7 pr-2 py-1 text-xs border border-gray-300 rounded w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Hotel */}
          <select
            value={filterHotel}
            onChange={(e) => setFilterHotel(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
            ))}
          </select>

          {/* Estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="abonado">Abonado</option>
            <option value="vencido">Vencido</option>
          </select>

          {/* Mes */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50"
          >
            <option value="">Mes</option>
            {Object.entries(MONTHS).map(([num, name]) => (
              <option key={num} value={num}>{name.substring(0, 3)}</option>
            ))}
          </select>

          {/* Ano */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50"
          >
            <option value="">Ano</option>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de pagos */}
      {payments.length === 0 ? (
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay pagos registrados</p>
          <p className="text-sm text-gray-400 mt-2">Agrega tu primer pago para comenzar</p>
          <button
            onClick={() => (window.location.href = "/servicios?tab=agregar-pago")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Agregar Primer Pago
          </button>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No hay pagos que coincidan con los filtros seleccionados</p>
          <p className="text-sm text-gray-400 mt-2">
            Total de pagos cargados: {payments.length} | Filtros:{" "}
            {filterMonth && filterYear
              ? `${MONTHS[Number(filterMonth) as keyof typeof MONTHS]} ${filterYear}`
              : "Varios"}
          </p>
          <div className="flex gap-2 justify-center mt-3">
            <button
              onClick={resetToCurrentMonth}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Volver al Mes Actual
            </button>
            <button onClick={clearAllFilters} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
              Ver Todos los Pagos
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Vista desktop - Tabla */}
          <div className="hidden lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("hotel_name")}>
                    Hotel {renderSortIndicator("hotel_name")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("service_name")}>
                    Servicio {renderSortIndicator("service_name")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("period")}>
                    Periodo {renderSortIndicator("period")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("amount")}>
                    Monto {renderSortIndicator("amount")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("due_date")}>
                    Vence {renderSortIndicator("due_date")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("status")}>
                    Estado {renderSortIndicator("status")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("payment_date")}>
                    F. Pago {renderSortIndicator("payment_date")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort("payment_method")}>
                    Forma {renderSortIndicator("payment_method")}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-blue-50">
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-900">{payment.hotel_name || "N/A"}</span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="text-xs text-gray-700">{payment.service_name}</span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{MONTHS[payment.month as keyof typeof MONTHS]?.substring(0, 3)} {payment.year}</span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="text-xs font-semibold text-green-700">{formatCurrency(payment.amount)}</span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{formatDate(payment.due_date)}</span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{payment.payment_date ? formatDate(payment.payment_date) : "-"}</span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{payment.payment_method ? getPaymentMethodLabel(payment.payment_method) : "-"}</span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        {(payment.status === "pendiente" || payment.status === "vencido") && (
                          <button
                            className="inline-flex items-center gap-0.5 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium text-xs"
                            onClick={() => handlePaymentClick(payment)}
                            title="Marcar como pagado"
                          >
                            <CreditCard className="h-3 w-3" />
                            Pagar
                          </button>
                        )}
                        <button
                          className="inline-flex items-center gap-0.5 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium text-xs"
                          onClick={() => handleEditClick(payment)}
                          title="Editar pago"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </button>
                        <button
                          className="inline-flex items-center px-1.5 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs"
                          onClick={() => handleDeletePayment(payment.id)}
                          title="Eliminar pago"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista movil - Tarjetas */}
          <div className="lg:hidden">
            <div className="space-y-4 p-4">
              {paginatedPayments.map((payment) => (
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
                    <div className="flex gap-2">
                      {(payment.status === "pendiente" || payment.status === "vencido") && (
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium text-xs"
                          onClick={() => handlePaymentClick(payment)}
                          title="Marcar como pagado"
                        >
                          <CreditCard className="h-4 w-4" />
                          Pagar
                        </button>
                      )}
                      <button 
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium text-xs" 
                        onClick={() => handleEditClick(payment)}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-xs"
                        onClick={() => handleDeletePayment(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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

                    {payment.status === "abonado" && (
                      <>
                        {payment.payment_date && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Fecha de Pago:</span>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-sm text-gray-900">{formatDate(payment.payment_date)}</span>
                            </div>
                          </div>
                        )}

                        {payment.payment_method && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Forma de Pago:</span>
                            <div className="flex items-center">
                              <CreditCard className="h-4 w-4 text-blue-600 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                {getPaymentMethodLabel(payment.payment_method)}
                              </span>
                            </div>
                          </div>
                        )}

                        {payment.invoice_number && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Comprobante:</span>
                            <div className="flex items-center">
                              <Receipt className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-900">{payment.invoice_number}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer compacto con totales y paginacion */}
          <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 flex-shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Totales en linea */}
              <div className="flex gap-3 text-xs">
                <span className="font-medium text-gray-700">Total: <span className="text-gray-900">{formatCurrency(totals.total)}</span></span>
                <span className="text-yellow-700">Pend: {formatCurrency(totals.pendiente)}</span>
                <span className="text-green-700">Abon: {formatCurrency(totals.abonado)}</span>
                <span className="text-red-700">Venc: {formatCurrency(totals.vencido)}</span>
              </div>

              {/* Paginacion compacta */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-0.5 border rounded disabled:opacity-50 hover:bg-gray-100"
                  >
                    1
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-0.5 border rounded disabled:opacity-50 hover:bg-gray-100"
                  >
                    Ant
                  </button>
                  <span className="px-2 font-medium">{currentPage}/{totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-0.5 border rounded disabled:opacity-50 hover:bg-gray-100"
                  >
                    Sig
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-0.5 border rounded disabled:opacity-50 hover:bg-gray-100"
                  >
                    {totalPages}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
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
                  Fecha de Pago *
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
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Pago *
                </label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
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

              <div>
                <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Comprobante
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
                disabled={!paymentMethod}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago *</label>
                      <input
                        type="date"
                        name="paymentDate"
                        value={editFormData.paymentDate}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago *</label>
                      <select
                        name="paymentMethod"
                        value={editFormData.paymentMethod}
                        onChange={handleEditFormChange}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Comprobante</label>
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

      {/* Modal de agregar pago */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Nuevo Pago</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel *</label>
                <select
                  value={addFormData.hotelId}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, hotelId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicio *</label>
                <select
                  value={addFormData.serviceId}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un servicio</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mes *</label>
                  <select
                    value={addFormData.month}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, month: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(MONTHS).map(([num, name]) => (
                      <option key={num} value={num}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
                  <select
                    value={addFormData.year}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    value={addFormData.amount}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, amount: e.target.value }))}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento *</label>
                <input
                  type="date"
                  value={addFormData.dueDate}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPayment}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Crear Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
