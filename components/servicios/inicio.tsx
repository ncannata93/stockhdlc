"use client"

import { useState, useEffect } from "react"
import { Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Database, Wifi, WifiOff } from "lucide-react"

export function Inicio() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [stats, setStats] = useState({
    pendientes: 0,
    abonados: 0,
    vencidos: 0,
    totalPendiente: 0,
    totalAbonado: 0,
    totalVencido: 0,
    proximosVencer: [],
  })

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

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        setLoading(true)
        setError(null)

        // Verificar si hay variables de entorno
        const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const hasSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!hasSupabaseUrl || !hasSupabaseKey) {
          setDbStatus("disconnected")
          setError("Variables de entorno de Supabase no configuradas")
          loadEmptyData()
          return
        }

        // Intentar cargar datos con timeout
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))

        try {
          // Importar dinámicamente para evitar errores de SSR
          const { getServicePayments } = await import("@/lib/service-db")

          const dataPromise = getServicePayments()
          const payments = (await Promise.race([dataPromise, timeoutPromise])) as any[]

          console.log("🔍 Datos recibidos de la base de datos:", payments?.length || 0, "pagos")

          setDbStatus("connected")
          const calculatedStats = calculateStats(payments || [])
          setStats(calculatedStats)
        } catch (dbError) {
          console.warn("Error conectando a la base de datos:", dbError)
          setDbStatus("disconnected")
          setError("No se pudo conectar a la base de datos")
          loadEmptyData()
        }
      } catch (error) {
        console.error("Error general:", error)
        setError("Error al cargar los datos")
        setDbStatus("disconnected")
        loadEmptyData()
      } finally {
        setLoading(false)
      }
    }

    checkDatabase()
  }, [])

  const loadEmptyData = () => {
    // Cargar datos vacíos en lugar de datos hardcodeados
    setStats({
      pendientes: 0,
      abonados: 0,
      vencidos: 0,
      totalPendiente: 0,
      totalAbonado: 0,
      totalVencido: 0,
      proximosVencer: [],
    })
  }

  const calculateStats = (payments: any[]) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Resetear horas para comparación de solo fecha

    console.log("=== CALCULANDO ESTADÍSTICAS REALES ===")
    console.log("Total de pagos recibidos:", payments.length)
    console.log("Fecha actual para comparación:", now.toISOString().split("T")[0])

    if (payments.length === 0) {
      console.log("⚠️ No hay pagos para procesar")
      return {
        pendientes: 0,
        abonados: 0,
        vencidos: 0,
        totalPendiente: 0,
        totalAbonado: 0,
        totalVencido: 0,
        proximosVencer: [],
      }
    }

    // Asegurarse de que los pagos tengan valores numéricos válidos
    const validPayments = payments.map((p) => ({
      ...p,
      amount: typeof p.amount === "number" ? p.amount : Number.parseFloat(p.amount) || 0,
    }))

    console.log("Pagos válidos procesados:", validPayments.length)
    console.log("Primeros 3 pagos:", validPayments.slice(0, 3))

    // Separar pagos por estado real (no solo por campo status)
    const abonados = validPayments.filter((p) => p.status === "paid" || p.status === "abonado")
    console.log("Pagos abonados:", abonados.length)

    // Para pendientes y vencidos, verificar tanto el status como la fecha
    const pendientesYVencidos = validPayments.filter(
      (p) => p.status === "pending" || p.status === "pendiente" || p.status === "vencido",
    )

    console.log("Pagos pendientes/vencidos por status:", pendientesYVencidos.length)

    // Separar entre realmente pendientes y realmente vencidos
    const pendientes = []
    const vencidos = []

    for (const payment of pendientesYVencidos) {
      if (!payment.due_date) {
        // Si no tiene fecha de vencimiento, considerarlo pendiente
        pendientes.push(payment)
        continue
      }

      try {
        const dueDate = new Date(payment.due_date)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDate < now) {
          // Está vencido
          vencidos.push(payment)
          console.log(`Pago vencido: ${payment.service_name || "Sin nombre"} - Vence: ${payment.due_date}`)
        } else {
          // Está pendiente
          pendientes.push(payment)
        }
      } catch (error) {
        console.error("Error parseando fecha:", payment.due_date, error)
        // Si hay error parseando fecha, considerarlo pendiente
        pendientes.push(payment)
      }
    }

    console.log("Pagos realmente pendientes:", pendientes.length)
    console.log("Pagos realmente vencidos:", vencidos.length)

    // Calcular totales con valores numéricos garantizados
    const totalPendiente = pendientes.reduce((sum, p) => sum + p.amount, 0)
    const totalAbonado = abonados.reduce((sum, p) => sum + p.amount, 0)
    const totalVencido = vencidos.reduce((sum, p) => sum + p.amount, 0)

    console.log("Total pendiente: $", totalPendiente)
    console.log("Total abonado: $", totalAbonado)
    console.log("Total vencido: $", totalVencido)

    // Pagos próximos a vencer (pendientes en los próximos 30 días)
    const proximosVencer = pendientes
      .filter((p) => {
        if (!p.due_date) return false
        try {
          const dueDate = new Date(p.due_date)
          const diffTime = dueDate.getTime() - now.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return diffDays >= 0 && diffDays <= 30
        } catch {
          return false
        }
      })
      .sort((a, b) => {
        try {
          const dateA = new Date(a.due_date)
          const dateB = new Date(b.due_date)
          return dateA.getTime() - dateB.getTime()
        } catch {
          return 0
        }
      })
      .slice(0, 10)

    console.log("Próximos a vencer:", proximosVencer.length)

    const stats = {
      pendientes: pendientes.length,
      abonados: abonados.length,
      vencidos: vencidos.length,
      totalPendiente,
      totalAbonado,
      totalVencido,
      proximosVencer,
    }

    console.log("=== ESTADÍSTICAS FINALES ===", stats)
    return stats
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return "Fecha inválida"
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
    return months[month - 1] || "Mes inválido"
  }

  const getDaysUntilDue = (dateString: string) => {
    try {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const dueDate = new Date(dateString)
      dueDate.setHours(0, 0, 0, 0)
      const diffTime = dueDate.getTime() - now.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return 0
    }
  }

  const getDueDateClass = (dateString: string) => {
    const days = getDaysUntilDue(dateString)
    if (days < 0) return "text-red-600 font-semibold"
    if (days <= 7) return "text-orange-600 font-semibold"
    return "text-gray-600"
  }

  const getDueDateText = (dateString: string) => {
    const days = getDaysUntilDue(dateString)
    if (days < 0) return `Vencido hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}`
    if (days === 0) return "Vence hoy"
    if (days === 1) return "Vence mañana"
    if (days <= 7) return `Vence en ${days} días`
    return `Vence en ${days} días`
  }

  const retryConnection = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de servicios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Servicios</h1>
        <p className="text-gray-600">Gestión y pago de servicios por hotel</p>
      </div>

      {/* Estado de la Base de Datos */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Estado de la Conexión</h3>
          <div className="flex items-center space-x-2">
            {dbStatus === "checking" && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600">Verificando...</span>
              </>
            )}
            {dbStatus === "connected" && (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Conectado a Supabase</span>
              </>
            )}
            {dbStatus === "disconnected" && (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Sin conexión a base de datos</span>
                <button
                  onClick={retryConnection}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Reintentar
                </button>
              </>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
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
            Total: <span className="font-semibold">{formatCurrency(stats.totalPendiente)}</span>
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
            Total: <span className="font-semibold">{formatCurrency(stats.totalAbonado)}</span>
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
          <p className="mt-2 text-sm text-gray-600">
            Total: <span className="font-semibold text-red-600">{formatCurrency(stats.totalVencido)}</span>
          </p>
        </div>
      </div>

      {/* Mensaje informativo */}
      {dbStatus === "disconnected" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Sin conexión a base de datos</p>
              <p className="text-xs text-yellow-700 mt-1">
                Configura la conexión a Supabase para ver datos reales de servicios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pagos próximos a vencer */}
      {stats.proximosVencer.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Pagos Próximos a Vencer</h2>
            <p className="text-sm text-gray-600">Servicios que requieren atención</p>
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
                {stats.proximosVencer.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.hotel_name || "Hotel no encontrado"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.service_name || "Servicio"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.month ? getMonthName(payment.month) : "N/A"} {payment.year || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        {formatCurrency(payment.amount || 0)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {stats.proximosVencer.length === 0 && dbStatus === "connected" && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay pagos próximos a vencer.</p>
          <p className="text-sm text-gray-400 mt-2">Comienza agregando servicios y sus pagos mensuales.</p>
        </div>
      )}

      {/* Mensaje si no hay conexión */}
      {dbStatus === "disconnected" && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Sin conexión a la base de datos.</p>
          <p className="text-sm text-gray-400 mt-2">
            Configura las variables de entorno de Supabase para ver datos reales.
          </p>
          <button onClick={retryConnection} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Reintentar Conexión
          </button>
        </div>
      )}
    </div>
  )
}
