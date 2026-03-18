"use client"

import { useState, useEffect } from "react"
import { Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Database, ArrowRight, Plus, TrendingUp, TrendingDown } from "lucide-react"

interface InicioProps {
  onNavigate?: (tab: string) => void
}

export function Inicio({ onNavigate }: InicioProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendientes: 0,
    abonados: 0,
    vencidos: 0,
    totalPendiente: 0,
    totalAbonado: 0,
    totalVencido: 0,
    proximosVencer: [] as any[],
    mesActual: {
      total: 0,
      pagados: 0,
      pendientes: 0,
      monto: 0,
    },
    mesAnterior: {
      total: 0,
      monto: 0,
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("ARS", "$")
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const { getServicePayments } = await import("@/lib/service-db")
        const payments = await getServicePayments()
        const calculatedStats = calculateStats(payments || [])
        setStats(calculatedStats)
      } catch {
        // Si hay error, mantener stats vacios
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const calculateStats = (payments: any[]) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

    if (payments.length === 0) {
      return {
        pendientes: 0,
        abonados: 0,
        vencidos: 0,
        totalPendiente: 0,
        totalAbonado: 0,
        totalVencido: 0,
        proximosVencer: [],
        mesActual: { total: 0, pagados: 0, pendientes: 0, monto: 0 },
        mesAnterior: { total: 0, monto: 0 },
      }
    }

    const validPayments = payments.map((p) => ({
      ...p,
      amount: typeof p.amount === "number" ? p.amount : Number.parseFloat(p.amount) || 0,
    }))

    // Separar por estado
    const abonados = validPayments.filter((p) => p.status === "paid" || p.status === "abonado")
    const pendientesYVencidos = validPayments.filter(
      (p) => p.status === "pending" || p.status === "pendiente" || p.status === "vencido",
    )

    const pendientes: any[] = []
    const vencidos: any[] = []

    for (const payment of pendientesYVencidos) {
      if (!payment.due_date) {
        pendientes.push(payment)
        continue
      }

      try {
        const dueDate = new Date(payment.due_date)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDate < now) {
          vencidos.push(payment)
        } else {
          pendientes.push(payment)
        }
      } catch {
        pendientes.push(payment)
      }
    }

    // Calcular totales
    const totalPendiente = pendientes.reduce((sum, p) => sum + p.amount, 0)
    const totalAbonado = abonados.reduce((sum, p) => sum + p.amount, 0)
    const totalVencido = vencidos.reduce((sum, p) => sum + p.amount, 0)

    // Pagos del mes actual
    const pagosMesActual = validPayments.filter((p) => p.month === currentMonth && p.year === currentYear)
    const pagosMesActualPagados = pagosMesActual.filter((p) => p.status === "paid" || p.status === "abonado")
    const pagosMesActualPendientes = pagosMesActual.filter((p) => p.status !== "paid" && p.status !== "abonado")

    // Pagos del mes anterior
    const pagosMesAnterior = validPayments.filter((p) => p.month === lastMonth && p.year === lastMonthYear)

    // Proximos a vencer
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
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5)

    return {
      pendientes: pendientes.length,
      abonados: abonados.length,
      vencidos: vencidos.length,
      totalPendiente,
      totalAbonado,
      totalVencido,
      proximosVencer,
      mesActual: {
        total: pagosMesActual.length,
        pagados: pagosMesActualPagados.length,
        pendientes: pagosMesActualPendientes.length,
        monto: pagosMesActual.reduce((sum, p) => sum + p.amount, 0),
      },
      mesAnterior: {
        total: pagosMesAnterior.length,
        monto: pagosMesAnterior.reduce((sum, p) => sum + p.amount, 0),
      },
    }
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
      return "Fecha invalida"
    }
  }

  const getMonthName = (month: number) => {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    return months[month - 1] || "Mes invalido"
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
    if (days < 0) return `Vencido hace ${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""}`
    if (days === 0) return "Vence hoy"
    if (days === 1) return "Vence manana"
    return `Vence en ${days} dias`
  }

  const handleNavigate = (tab: string, params?: string) => {
    if (onNavigate) {
      onNavigate(tab)
    }
    // Actualizar URL con parametros si es necesario
    if (params) {
      window.history.pushState({}, '', `/servicios?tab=${tab}&${params}`)
    }
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const variacionMes = stats.mesAnterior.monto > 0 
    ? ((stats.mesActual.monto - stats.mesAnterior.monto) / stats.mesAnterior.monto * 100).toFixed(1)
    : "0"

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen del Mes Actual - Destacado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-medium opacity-90">Resumen de {getMonthName(currentMonth)} {currentYear}</h2>
            <p className="text-3xl font-bold mt-2">{formatCurrency(stats.mesActual.monto)}</p>
            <div className="flex items-center mt-2 text-sm opacity-80">
              {Number(variacionMes) > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+{variacionMes}% vs mes anterior</span>
                </>
              ) : Number(variacionMes) < 0 ? (
                <>
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span>{variacionMes}% vs mes anterior</span>
                </>
              ) : (
                <span>Sin variacion vs mes anterior</span>
              )}
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.mesActual.total}</p>
              <p className="text-sm opacity-80">Total pagos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-300">{stats.mesActual.pagados}</p>
              <p className="text-sm opacity-80">Pagados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-300">{stats.mesActual.pendientes}</p>
              <p className="text-sm opacity-80">Pendientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos Rapidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleNavigate("pagos", "status=vencido")}
          className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-left transition-colors"
        >
          <div className="flex items-center justify-between">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold text-red-600">{stats.vencidos}</span>
          </div>
          <p className="text-sm font-medium text-red-700 mt-2">Ver Vencidos</p>
          <p className="text-xs text-red-600">{formatCurrency(stats.totalVencido)}</p>
        </button>

        <button
          onClick={() => handleNavigate("pagos", "status=pendiente")}
          className="bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-left transition-colors"
        >
          <div className="flex items-center justify-between">
            <Clock className="h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600">{stats.pendientes}</span>
          </div>
          <p className="text-sm font-medium text-yellow-700 mt-2">Ver Pendientes</p>
          <p className="text-xs text-yellow-600">{formatCurrency(stats.totalPendiente)}</p>
        </button>

        <button
          onClick={() => handleNavigate("pagos", "status=abonado")}
          className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left transition-colors"
        >
          <div className="flex items-center justify-between">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <span className="text-2xl font-bold text-green-600">{stats.abonados}</span>
          </div>
          <p className="text-sm font-medium text-green-700 mt-2">Ver Abonados</p>
          <p className="text-xs text-green-600">{formatCurrency(stats.totalAbonado)}</p>
        </button>

        <button
          onClick={() => handleNavigate("pagos")}
          className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-left transition-colors"
        >
          <div className="flex items-center justify-between">
            <Plus className="h-8 w-8 text-blue-500" />
            <ArrowRight className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-blue-700 mt-2">Agregar Pago</p>
          <p className="text-xs text-blue-600">Registrar nuevo pago</p>
        </button>
      </div>

      {/* Proximos a Vencer */}
      {stats.proximosVencer.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Proximos a Vencer</h2>
              <p className="text-sm text-gray-600">Pagos que requieren atencion</p>
            </div>
            <button
              onClick={() => handleNavigate("pagos")}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {stats.proximosVencer.map((payment: any) => (
              <div key={payment.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{payment.hotel_name || "Hotel"}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-gray-700">{payment.service_name || "Servicio"}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {payment.month ? getMonthName(payment.month) : "N/A"} {payment.year || ""}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(payment.amount || 0)}</p>
                  <p className={`text-xs ${getDueDateClass(payment.due_date)}`}>
                    {getDueDateText(payment.due_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacio */}
      {stats.proximosVencer.length === 0 && stats.pendientes === 0 && stats.vencidos === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No hay pagos pendientes</p>
          <p className="text-sm text-gray-500 mt-2">Todos los pagos estan al dia</p>
        </div>
      )}
    </div>
  )
}
