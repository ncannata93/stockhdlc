"use client"

import { useState, useEffect } from "react"
import { getServicePayments, getServices, getHotels } from "@/lib/service-db"
import type { ServicePayment, Service, Hotel } from "@/lib/service-types"
import { SERVICE_CATEGORIES, PAYMENT_STATUS } from "@/lib/service-types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts"
import { Calendar, DollarSign, TrendingUp, TrendingDown, Download, HotelIcon, Wrench, AlertTriangle, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"

export function Estadisticas() {
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

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number)
  }

  const [payments, setPayments] = useState<ServicePayment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"overview" | "hotels" | "services" | "trends">("overview")

  // Filtros
  const [filters, setFilters] = useState({
    year: 0, // 0 significa "todos los años"
    hotel: "",
    service: "",
    category: "",
    status: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [paymentsData, servicesData, hotelsData] = await Promise.all([
          getServicePayments(),
          getServices(),
          getHotels(),
        ])
        setPayments(paymentsData)
        setServices(servicesData)
        setHotels(hotelsData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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

  // Filtrar pagos según los filtros activos
  const filteredPayments = payments.filter((payment) => {
    if (filters.year && filters.year !== 0 && payment.year !== filters.year) return false
    if (filters.hotel && payment.hotel_id !== filters.hotel) return false
    if (filters.service && payment.service_id !== filters.service) return false
    if (filters.status && payment.status !== filters.status) return false
    if (filters.category) {
      const service = services.find((s) => s.id === payment.service_id)
      if (service?.category !== filters.category) return false
    }
    return true
  })

  // Datos para gráfico de gastos por mes
  const monthlyExpenses = Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
    const monthPayments = filteredPayments.filter((p) => p.month === month)
    return {
      name: getMonthName(month),
      month,
      total: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      pendiente: monthPayments.filter((p) => p.status === "pendiente").reduce((sum, p) => sum + p.amount, 0),
      abonado: monthPayments.filter((p) => p.status === "abonado").reduce((sum, p) => sum + p.amount, 0),
      vencido: monthPayments.filter((p) => p.status === "vencido").reduce((sum, p) => sum + p.amount, 0),
      count: monthPayments.length,
    }
  })

  // Datos por hotel
  const hotelStats = hotels
    .map((hotel) => {
      const hotelPayments = filteredPayments.filter((p) => p.hotel_id === hotel.id)
      const hotelServices = services.filter((s) => s.hotel_id === hotel.id)
      return {
        id: hotel.id,
        name: hotel.name,
        code: hotel.code,
        total: hotelPayments.reduce((sum, p) => sum + p.amount, 0),
        pendiente: hotelPayments.filter((p) => p.status === "pendiente").reduce((sum, p) => sum + p.amount, 0),
        abonado: hotelPayments.filter((p) => p.status === "abonado").reduce((sum, p) => sum + p.amount, 0),
        vencido: hotelPayments.filter((p) => p.status === "vencido").reduce((sum, p) => sum + p.amount, 0),
        servicesCount: hotelServices.length,
        paymentsCount: hotelPayments.length,
        avgMonthly: hotelPayments.length > 0 ? hotelPayments.reduce((sum, p) => sum + p.amount, 0) / 12 : 0,
      }
    })
    .filter((hotel) => hotel.total > 0 || hotel.servicesCount > 0)

  // Datos por categoría de servicio
  const categoryStats = Object.entries(SERVICE_CATEGORIES)
    .map(([key, name]) => {
      const categoryServices = services.filter((s) => s.category === key)
      const categoryPayments = filteredPayments.filter((p) => {
        const service = services.find((s) => s.id === p.service_id)
        return service?.category === key
      })
      return {
        category: key,
        name,
        total: categoryPayments.reduce((sum, p) => sum + p.amount, 0),
        servicesCount: categoryServices.length,
        paymentsCount: categoryPayments.length,
        avgAmount:
          categoryPayments.length > 0
            ? categoryPayments.reduce((sum, p) => sum + p.amount, 0) / categoryPayments.length
            : 0,
      }
    })
    .filter((cat) => cat.total > 0)

  // Datos de tendencias (últimos 6 meses)
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const monthPayments = payments.filter((p) => p.month === month && p.year === year)
    return {
      period: `${getMonthName(month)} ${year}`,
      month,
      year,
      total: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      count: monthPayments.length,
      pendiente: monthPayments.filter((p) => p.status === "pendiente").length,
      abonado: monthPayments.filter((p) => p.status === "abonado").length,
    }
  })

  // Comparativa con ano anterior
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  
  const currentYearTotal = payments
    .filter(p => p.year === currentYear)
    .reduce((sum, p) => sum + p.amount, 0)
  
  const lastYearTotal = payments
    .filter(p => p.year === lastYear)
    .reduce((sum, p) => sum + p.amount, 0)
  
  const yearVariation = lastYearTotal > 0 
    ? ((currentYearTotal - lastYearTotal) / lastYearTotal * 100)
    : 0

  // Comparativa mensual (mes actual vs mismo mes ano anterior)
  const currentMonth = new Date().getMonth() + 1
  const currentMonthTotal = payments
    .filter(p => p.month === currentMonth && p.year === currentYear)
    .reduce((sum, p) => sum + p.amount, 0)
  
  const lastYearSameMonthTotal = payments
    .filter(p => p.month === currentMonth && p.year === lastYear)
    .reduce((sum, p) => sum + p.amount, 0)

  const monthVariation = lastYearSameMonthTotal > 0
    ? ((currentMonthTotal - lastYearSameMonthTotal) / lastYearSameMonthTotal * 100)
    : 0

  // Alertas de gastos - servicios que aumentaron mas del 20%
  const serviceAlerts = services
    .map(service => {
      const currentYearPayments = payments.filter(p => p.service_id === service.id && p.year === currentYear)
      const lastYearPayments = payments.filter(p => p.service_id === service.id && p.year === lastYear)
      
      const currentTotal = currentYearPayments.reduce((sum, p) => sum + p.amount, 0)
      const lastTotal = lastYearPayments.reduce((sum, p) => sum + p.amount, 0)
      
      const variation = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal * 100) : 0
      
      return {
        service,
        currentTotal,
        lastTotal,
        variation,
        hotelName: hotels.find(h => h.id === service.hotel_id)?.name || "N/A"
      }
    })
    .filter(s => s.variation > 20 && s.lastTotal > 0)
    .sort((a, b) => b.variation - a.variation)

  // Colores para graficos
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"]

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()

    // Hoja 1: Resumen
    const resumenData = [
      ["Estadisticas de Servicios", ""],
      ["", ""],
      ["Metrica", "Valor"],
      ["Total Anual", filteredPayments.reduce((sum, p) => sum + p.amount, 0)],
      ["Promedio Mensual", filteredPayments.reduce((sum, p) => sum + p.amount, 0) / 12],
      ["Total Servicios", services.length],
      ["Total Hoteles", hotels.length],
      ["", ""],
      ["Comparativa Anual", ""],
      [`Total ${currentYear}`, currentYearTotal],
      [`Total ${lastYear}`, lastYearTotal],
      ["Variacion %", yearVariation.toFixed(2) + "%"],
    ]
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen")

    // Hoja 2: Por Mes
    const mesHeaders = ["Mes", "Total", "Abonado", "Pendiente", "Vencido", "Cantidad"]
    const mesData = [mesHeaders, ...monthlyExpenses.map(m => [
      m.name, m.total, m.abonado, m.pendiente, m.vencido, m.count
    ])]
    const wsMes = XLSX.utils.aoa_to_sheet(mesData)
    XLSX.utils.book_append_sheet(wb, wsMes, "Por Mes")

    // Hoja 3: Por Hotel
    const hotelHeaders = ["Hotel", "Codigo", "Total", "Abonado", "Pendiente", "Vencido", "Servicios", "Pagos"]
    const hotelData = [hotelHeaders, ...hotelStats.map(h => [
      h.name, h.code, h.total, h.abonado, h.pendiente, h.vencido, h.servicesCount, h.paymentsCount
    ])]
    const wsHotel = XLSX.utils.aoa_to_sheet(hotelData)
    XLSX.utils.book_append_sheet(wb, wsHotel, "Por Hotel")

    // Hoja 4: Por Categoria
    const catHeaders = ["Categoria", "Total", "Servicios", "Pagos", "Promedio por Pago"]
    const catData = [catHeaders, ...categoryStats.map(c => [
      c.name, c.total, c.servicesCount, c.paymentsCount, c.avgAmount
    ])]
    const wsCat = XLSX.utils.aoa_to_sheet(catData)
    XLSX.utils.book_append_sheet(wb, wsCat, "Por Categoria")

    // Hoja 5: Alertas
    if (serviceAlerts.length > 0) {
      const alertHeaders = ["Servicio", "Hotel", `Total ${currentYear}`, `Total ${lastYear}`, "Variacion %"]
      const alertData = [alertHeaders, ...serviceAlerts.map(a => [
        a.service.name, a.hotelName, a.currentTotal, a.lastTotal, a.variation.toFixed(2) + "%"
      ])]
      const wsAlerts = XLSX.utils.aoa_to_sheet(alertData)
      XLSX.utils.book_append_sheet(wb, wsAlerts, "Alertas")
    }

    // Descargar archivo
    XLSX.writeFile(wb, `estadisticas-servicios-${filters.year || "todos"}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Estadísticas de Servicios</h2>
            <p className="text-gray-600">Análisis detallado de gastos y servicios</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Todos los años</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel</label>
            <select
              value={filters.hotel}
              onChange={(e) => setFilters({ ...filters, hotel: e.target.value })}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {Object.entries(SERVICE_CATEGORIES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {Object.entries(PAYMENT_STATUS).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ year: 0, hotel: "", service: "", category: "", status: "" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Navegación de vistas */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "overview", label: "Resumen", icon: TrendingUp },
            { key: "hotels", label: "Por Hotel", icon: HotelIcon },
            { key: "services", label: "Por Servicio", icon: Wrench },
            { key: "trends", label: "Tendencias", icon: Calendar },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total {currentYear}</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(currentYearTotal)}</p>
              <div className="flex items-center mt-1">
                {yearVariation >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                )}
                <span className={`text-xs ${yearVariation >= 0 ? "text-red-500" : "text-green-500"}`}>
                  {yearVariation >= 0 ? "+" : ""}{yearVariation.toFixed(1)}% vs {lastYear}
                </span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">{getMonthName(currentMonth)} {currentYear}</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(currentMonthTotal)}</p>
              <div className="flex items-center mt-1">
                {monthVariation >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                )}
                <span className={`text-xs ${monthVariation >= 0 ? "text-red-500" : "text-green-500"}`}>
                  {monthVariation >= 0 ? "+" : ""}{monthVariation.toFixed(1)}% vs {lastYear}
                </span>
              </div>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Servicios</p>
              <p className="text-xl font-bold text-green-600">{services.length}</p>
              <p className="text-xs text-gray-500 mt-1">activos</p>
            </div>
            <Wrench className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Hoteles</p>
              <p className="text-xl font-bold text-orange-600">{hotels.length}</p>
              <p className="text-xs text-gray-500 mt-1">registrados</p>
            </div>
            <HotelIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Alertas de Gastos */}
      {serviceAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Alertas de Gastos</h3>
            <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">{serviceAlerts.length}</span>
          </div>
          <p className="text-sm text-red-700 mb-3">Servicios con aumento mayor al 20% vs ano anterior:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {serviceAlerts.slice(0, 6).map((alert, idx) => (
              <div key={idx} className="bg-white rounded p-3 border border-red-100">
                <p className="font-medium text-gray-900 text-sm">{alert.service.name}</p>
                <p className="text-xs text-gray-500">{alert.hotelName}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-700">{formatCurrency(alert.currentTotal)}</span>
                  <span className="text-xs font-bold text-red-600">+{alert.variation.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vista Resumen */}
      {activeView === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos Mensuales</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Monto"]} />
                  <Legend />
                  <Bar dataKey="abonado" fill="#10B981" name="Abonado" />
                  <Bar dataKey="pendiente" fill="#F59E0B" name="Pendiente" />
                  <Bar dataKey="vencido" fill="#EF4444" name="Vencido" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Categoría</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="40%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="name"
                    label={false}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                    labelFormatter={(name) => `${name}`}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: "20px", fontSize: "12px" }}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>
                        {value}: {formatCurrency(entry.payload.total)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Vista por Hotel */}
      {activeView === "hotels" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos por Hotel</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hotelStats} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Total"]} />
                  <Legend />
                  <Bar dataKey="total" fill="#3B82F6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Detalle por Hotel</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hotel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Promedio Mensual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicios</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hotelStats.map((hotel) => (
                    <tr key={hotel.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{hotel.name}</div>
                        <div className="text-sm text-gray-500">{hotel.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(hotel.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(hotel.avgMonthly)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hotel.servicesCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hotel.paymentsCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs">
                            <span className="text-green-600">Abonado: {formatCurrency(hotel.abonado)}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-yellow-600">Pendiente: {formatCurrency(hotel.pendiente)}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-red-600">Vencido: {formatCurrency(hotel.vencido)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vista por Servicio */}
      {activeView === "services" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos por Categoría de Servicio</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Total"]} />
                  <Legend />
                  <Bar dataKey="total" fill="#8B5CF6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Detalle por Categoría</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicios</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Promedio por Pago
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryStats.map((category) => (
                    <tr key={category.category}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{category.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(category.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.servicesCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.paymentsCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(category.avgAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Tendencias */}
      {activeView === "trends" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de Gastos (Últimos 6 Meses)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Total"]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    name="Total"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolución de Estados de Pago</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="abonado" stroke="#10B981" name="Abonados" />
                  <Line type="monotone" dataKey="pendiente" stroke="#F59E0B" name="Pendientes" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
