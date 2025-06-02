"use client"

import { useState, useEffect } from "react"
import { getServicePayments, markPaymentAsPaid } from "@/lib/service-db"
import type { ServicePayment } from "@/lib/service-types"
import { Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Check, Edit, Building2 } from "lucide-react"
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
    proximosVencer: [] as ServicePayment[],
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

    // Pagos próximos a vencer (en los próximos 30 días)
    const proximosVencer = pendientes
      .filter((p) => {
        const [year, month, day] = p.due_date.split("T")[0].split("-")
        const dueDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
        const diffTime = dueDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays >= -7 && diffDays <= 30 // Incluye vencidos hace 7 días y próximos 30 días
      })
      .sort((a, b) => {
        const [yearA, monthA, dayA] = a.due_date.split("T")[0].split("-")
        const [yearB, monthB, dayB] = b.due_date.split("T")[0].split("-")
        const dateA = new Date(Number.parseInt(yearA), Number.parseInt(monthA) - 1, Number.parseInt(dayA))
        const dateB = new Date(Number.parseInt(yearB), Number.parseInt(monthB) - 1, Number.parseInt(dayB))
        return dateA.getTime() - dateB.getTime()
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
    // Crear la fecha sin conversión de zona horaria
    const [year, month, day] = dateString.split("T")[0].split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

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

  const getDaysUntilDue = (dateString: string) => {
    const now = new Date()
    const [year, month, day] = dateString.split("T")[0].split("-")
    const dueDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDueDateClass = (dateString: string) => {
    const days = getDaysUntilDue(dateString)
    if (days < 0) return "text-red-600 font-semibold" // Vencido
    if (days <= 7) return "text-orange-600 font-semibold" // Próximo a vencer
    return "text-gray-600" // Normal
  }

  const getDueDateText = (dateString: string) => {
    const days = getDaysUntilDue(dateString)
    if (days < 0) return `Vencido hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}`
    if (days === 0) return "Vence hoy"
    if (days === 1) return "Vence mañana"
    if (days <= 7) return `Vence en ${days} días`
    return `Vence en ${days} días`
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    const invoiceNumber = prompt("Número de factura (opcional):")
    try {
      await markPaymentAsPaid(paymentId, new Date().toISOString(), invoiceNumber || undefined)
      // Recargar datos
      const paymentsData = await getServicePayments()
      setPayments(paymentsData)
      calculateStats(paymentsData)
    } catch (error) {
      console.error("Error al marcar como abonado:", error)
      alert("Error al marcar como abonado")
    }
  }

  const handleEditPayment = (paymentId: string) => {
    window.location.href = `/servicios?tab=editar-pago&id=${paymentId}`
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
            <p className="text-sm text-gray-600">Servicios que requieren atención</p>
          </div>

          {/* Vista desktop */}
          <div className="hidden lg:block overflow-x-auto">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.proximosVencer.map((payment) => (
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
                        {getMonthName(payment.month)} {payment.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />${payment.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(payment.due_date)}
                        </div>
                        <div className={`text-xs ${getDueDateClass(payment.due_date)}`}>
                          {getDueDateText(payment.due_date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEditPayment(payment.id)}
                          title="Editar pago"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleMarkAsPaid(payment.id)}
                          title="Marcar como abonado"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil */}
          <div className="lg:hidden">
            <div className="space-y-4 p-4">
              {stats.proximosVencer.map((payment) => (
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
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleMarkAsPaid(payment.id)}
                      >
                        <Check className="h-5 w-5" />
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

                  <div className={`mt-2 text-sm ${getDueDateClass(payment.due_date)}`}>
                    {getDueDateText(payment.due_date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
