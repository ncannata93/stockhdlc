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
import { Calendar, DollarSign, TrendingUp, Download, HotelIcon, Wrench } from "lucide-react"

export function Estadisticas() {
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

  // Colores para gráficos
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"]

  const exportData = () => {
    const dataToExport = {
      resumen: {
        totalAnual: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
        promedioMensual: filteredPayments.reduce((sum, p) => sum + p.amount, 0) / 12,
        totalServicios: services.length,
        totalHoteles: hotels.length,
      },
      porMes: monthlyExpenses,
      porHotel: hotelStats,
      porCategoria: categoryStats,
      tendencias: trendData,
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `estadisticas-servicios-${filters.year}.json`
    a.click()
    URL.revokeObjectURL(url)
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
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar Datos
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Anual</p>
              <p className="text-2xl font-bold text-blue-600">
                ${filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promedio Mensual</p>
              <p className="text-2xl font-bold text-green-600">
                ${(filteredPayments.reduce((sum, p) => sum + p.amount, 0) / 12).toLocaleString()}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Servicios Activos</p>
              <p className="text-2xl font-bold text-purple-600">{services.length}</p>
            </div>
            <Wrench className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoteles</p>
              <p className="text-2xl font-bold text-orange-600">{hotels.length}</p>
            </div>
            <HotelIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

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
                  <Tooltip formatter={(value) => [`$${value}`, "Monto"]} />
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
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, "Total"]} />
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
                  <Tooltip formatter={(value) => [`$${value}`, "Total"]} />
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
                        ${hotel.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${hotel.avgMonthly.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hotel.servicesCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hotel.paymentsCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs">
                            <span className="text-green-600">Abonado: ${hotel.abonado.toLocaleString()}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-yellow-600">Pendiente: ${hotel.pendiente.toLocaleString()}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-red-600">Vencido: ${hotel.vencido.toLocaleString()}</span>
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
                  <Tooltip formatter={(value) => [`$${value}`, "Total"]} />
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
                        ${category.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.servicesCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.paymentsCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${category.avgAmount.toLocaleString()}
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
                  <Tooltip formatter={(value) => [`$${value}`, "Total"]} />
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
