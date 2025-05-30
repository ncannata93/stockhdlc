"use client"

import { useState, useEffect } from "react"
import { getServicePayments } from "@/lib/service-db"
import type { ServicePayment } from "@/lib/service-types"
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
} from "recharts"

export function Estadisticas() {
  const [payments, setPayments] = useState<ServicePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    const loadData = async () => {
      try {
        const paymentsData = await getServicePayments()
        setPayments(paymentsData)
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

  // Filtrar pagos por año
  const filteredPayments = payments.filter((payment) => payment.year === yearFilter)

  // Datos para gráfico de gastos por mes
  const monthlyExpenses = Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
    const monthPayments = filteredPayments.filter((p) => p.month === month)
    return {
      name: getMonthName(month),
      total: monthPayments.reduce((sum, p) => sum + p.amount, 0),
    }
  })

  // Datos para gráfico de distribución por servicio
  const serviceDistribution = filteredPayments.reduce(
    (acc, payment) => {
      const existingService = acc.find((s) => s.name === payment.serviceName)
      if (existingService) {
        existingService.value += payment.amount
      } else {
        acc.push({ name: payment.serviceName, value: payment.amount })
      }
      return acc
    },
    [] as { name: string; value: number }[],
  )

  // Colores para el gráfico de pie
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B", "#6B66FF"]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Estadísticas de Gastos</h2>
          <div className="mt-2 sm:mt-0">
            <label htmlFor="year-filter" className="mr-2 text-sm text-gray-600">
              Año:
            </label>
            <select
              id="year-filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Gastos Mensuales</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpenses} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, "Total"]} />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" name="Monto Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Distribución por Servicio</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {serviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, "Monto"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen Anual</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Total Anual</h3>
            <p className="text-2xl font-bold text-blue-600">
              ${filteredPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Promedio Mensual</h3>
            <p className="text-2xl font-bold text-green-600">
              ${(filteredPayments.reduce((sum, p) => sum + p.amount, 0) / 12).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Servicios Registrados</h3>
            <p className="text-2xl font-bold text-purple-600">
              {new Set(filteredPayments.map((p) => p.serviceName)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
