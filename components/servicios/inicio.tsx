"use client"

import { useState, useEffect } from "react"
import { getServicePayments } from "@/lib/service-db"
import type { ServicePayment } from "@/lib/service-types"
import { Calendar, DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { SupabaseDebug } from "@/components/supabase-debug"

export function Inicio() {
  const [payments, setPayments] = useState<ServicePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    pendientes: 0,
    abonados: 0,
    vencidos: 0,
    totalPendiente: 0,
    totalAbonado: 0,
    proximosVencer: [],
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null)
        const paymentsData = await getServicePayments()
        setPayments(paymentsData)
        calculateStats(paymentsData)
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Error al cargar los datos. Por favor, intenta nuevamente.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const calculateStats = (payments: ServicePayment[]) => {
    const now = new Date()
    const pendientes = payments.filter((p) => p.status === "pendiente")
    const abonados = payments.filter((p) => p.status === "abonado")
    const vencidos = payments.filter((p) => p.status === "vencido")

    // Pagos próximos a vencer (en los próximos 7 días)
    const proximosVencer = pendientes.filter((p) => {
      const dueDate = new Date(p.due_date)
      const diffTime = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 7
    })

    setStats({
      pendientes: pendientes.length,
      abonados: abonados.length,
      vencidos: vencidos.length,
      totalPendiente: pendientes.reduce((sum, p) => sum + p.amount, 0),
      totalAbonado: abonados.reduce((sum, p) => sum + p.amount, 0),
      proximosVencer,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug de Supabase */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Estado de la Base de Datos</h3>
        <SupabaseDebug />
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendientes}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Total: <span className="font-semibold">${stats.totalPendiente.toFixed(2)}</span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pagos Abonados</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.abonados}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Total: <span className="font-semibold">${stats.totalAbonado.toFixed(2)}</span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 mr-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pagos Vencidos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.vencidos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje si no hay datos */}
      {payments.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No hay pagos registrados aún.</p>
          <p className="text-sm text-gray-400 mt-2">Comienza agregando servicios y sus pagos mensuales.</p>
        </div>
      )}

      {/* Pagos próximos a vencer */}
      {stats.proximosVencer.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Pagos Próximos a Vencer</h2>
            <p className="text-sm text-gray-600">Servicios que vencen en los próximos 7 días</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hotel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.proximosVencer.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.hotel_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.service_name}</div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
