"use client"

import { useState, useEffect } from "react"
import { 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Calendar, 
  Download, 
  Clock, 
  Play,
  Eye,
  History,
  Wrench,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { getServices, updateServiceAverage, getServicePayments, addServicePayment } from "@/lib/service-db"
import { supabase } from "@/lib/supabase"

interface MaintenanceHistory {
  id: string
  executed_at: string
  services_updated: number
  payments_generated: number
  errors: number
  duration_seconds: number
  notes: string | null
}

interface ServicePreview {
  id: string
  name: string
  hotel_name: string
  current_average: number
  new_average: number | null
  paid_payments_count: number
  needs_update: boolean
  missing_payments: number
  last_payment_date: string | null
}

export function Mantenimiento() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState({
    serviciosActualizados: 0,
    pagosGenerados: 0,
    errores: 0,
  })
  
  // Configuracion
  const [monthsAhead, setMonthsAhead] = useState(12)
  const [dueDay, setDueDay] = useState(10)
  
  // Historial
  const [history, setHistory] = useState<MaintenanceHistory[]>([])
  const [lastMaintenance, setLastMaintenance] = useState<MaintenanceHistory | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  
  // Vista previa
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<ServicePreview[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  
  // Acciones individuales
  const [expandedService, setExpandedService] = useState<string | null>(null)
  
  // Timer para duracion
  const [startTime, setStartTime] = useState<number | null>(null)

  // Cargar historial al montar
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance_history")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(10)
      
      if (error) throw error
      
      setHistory(data || [])
      if (data && data.length > 0) {
        setLastMaintenance(data[0])
      }
    } catch (error) {
      console.error("Error loading history:", error)
    }
  }

  const getDaysSinceLastMaintenance = () => {
    if (!lastMaintenance) return null
    const lastDate = new Date(lastMaintenance.executed_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const isMaintenanceOverdue = () => {
    const days = getDaysSinceLastMaintenance()
    return days !== null && days > 30
  }

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const loadPreview = async () => {
    setLoadingPreview(true)
    setPreviewData([])
    
    try {
      const services = await getServices()
      const previews: ServicePreview[] = []
      
      for (const service of services) {
        const allPayments = await getServicePayments(service.hotel_id)
        const servicePayments = allPayments.filter((p) => p.service_id === service.id)
        const paidPayments = servicePayments.filter((p) => p.status === "abonado")
        
        // Calcular nuevo promedio
        let newAverage: number | null = null
        let needsUpdate = false
        
        if (paidPayments.length >= 1) {
          const totalAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0)
          newAverage = Math.round((totalAmount / paidPayments.length) * 100) / 100
          needsUpdate = Math.abs(newAverage - (service.average_amount || 0)) > 0.01
        }
        
        // Calcular pagos faltantes
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()
        
        let missingPayments = 0
        let lastPaymentDate: string | null = null
        
        if (servicePayments.length > 0) {
          const lastPayment = servicePayments.reduce((latest, p) => {
            const pDate = new Date(p.year, p.month - 1)
            const lDate = new Date(latest.year, latest.month - 1)
            return pDate > lDate ? p : latest
          })
          
          lastPaymentDate = `${lastPayment.month}/${lastPayment.year}`
          
          // Calcular cuantos meses faltan
          const targetMonth = currentMonth + monthsAhead - 1
          const targetYear = currentYear + Math.floor((currentMonth + monthsAhead - 2) / 12)
          
          const lastDate = new Date(lastPayment.year, lastPayment.month - 1)
          const targetDate = new Date(targetYear, (targetMonth - 1) % 12)
          
          const monthsDiff = (targetDate.getFullYear() - lastDate.getFullYear()) * 12 + 
                            (targetDate.getMonth() - lastDate.getMonth())
          
          missingPayments = Math.max(0, monthsDiff)
        } else {
          missingPayments = monthsAhead
        }
        
        previews.push({
          id: service.id,
          name: service.name,
          hotel_name: service.hotel_name || "Sin hotel",
          current_average: service.average_amount || 0,
          new_average: newAverage,
          paid_payments_count: paidPayments.length,
          needs_update: needsUpdate,
          missing_payments: missingPayments,
          last_payment_date: lastPaymentDate,
        })
      }
      
      setPreviewData(previews)
      setShowPreview(true)
    } catch (error) {
      addLog(`Error al cargar vista previa: ${error}`)
    } finally {
      setLoadingPreview(false)
    }
  }

  const updateAverages = async () => {
    addLog("Iniciando actualizacion de promedios...")

    try {
      const services = await getServices()
      let serviciosActualizados = 0

      for (const service of services) {
        try {
          const allPayments = await getServicePayments(service.hotel_id)
          const paidPayments = allPayments.filter((p) => p.service_id === service.id && p.status === "abonado")

          if (paidPayments.length >= 1) {
            const totalAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)
            const oldAverage = service.average_amount || 0
            const newAverage = Math.round((totalAmount / paidPayments.length) * 100) / 100

            if (Math.abs(newAverage - oldAverage) > 0.01) {
              await updateServiceAverage(service.id)
              addLog(
                `[OK] Promedio actualizado: ${service.name} (${service.hotel_name}) - $${oldAverage.toLocaleString()} -> $${newAverage.toLocaleString()}`,
              )
              serviciosActualizados++
            }
          }
        } catch (error) {
          addLog(`[ERROR] ${service.name}: ${error}`)
          setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
        }
      }

      addLog(`Promedios actualizados: ${serviciosActualizados} servicios`)
      setStats((prev) => ({ ...prev, serviciosActualizados: prev.serviciosActualizados + serviciosActualizados }))
      return serviciosActualizados
    } catch (error) {
      addLog(`[ERROR] Error general: ${error}`)
      setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
      return 0
    }
  }

  const generatePayments = async () => {
    addLog("Verificando pagos faltantes...")

    try {
      const services = await getServices()
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      let pagosGenerados = 0

      for (const service of services) {
        try {
          const allPayments = await getServicePayments(service.hotel_id)
          const servicePayments = allPayments.filter((p) => p.service_id === service.id)

          if (servicePayments.length === 0) {
            const generatedCount = await generatePaymentsForService(service, currentMonth, currentYear, monthsAhead)
            if (generatedCount > 0) {
              addLog(`[OK] ${service.name}: ${generatedCount} pagos generados`)
              pagosGenerados += generatedCount
            }
            continue
          }

          const lastPayment = servicePayments.reduce((latest, payment) => {
            const paymentDate = new Date(payment.year, payment.month - 1)
            const latestDate = new Date(latest.year, latest.month - 1)
            return paymentDate > latestDate ? payment : latest
          })

          const nextMonth = lastPayment.month === 12 ? 1 : lastPayment.month + 1
          const nextYear = lastPayment.month === 12 ? lastPayment.year + 1 : lastPayment.year

          const generatedCount = await generatePaymentsForService(service, nextMonth, nextYear, monthsAhead)
          if (generatedCount > 0) {
            addLog(`[OK] ${service.name}: ${generatedCount} pagos generados`)
            pagosGenerados += generatedCount
          }
        } catch (error) {
          addLog(`[ERROR] ${service.name}: ${error}`)
          setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
        }
      }

      addLog(`Pagos generados: ${pagosGenerados} total`)
      setStats((prev) => ({ ...prev, pagosGenerados: prev.pagosGenerados + pagosGenerados }))
      return pagosGenerados
    } catch (error) {
      addLog(`[ERROR] Error general: ${error}`)
      setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
      return 0
    }
  }

  const generatePaymentsForService = async (
    service: any,
    startMonth: number,
    startYear: number,
    months: number,
  ): Promise<number> => {
    let generatedCount = 0

    for (let i = 0; i < months; i++) {
      const month = ((startMonth - 1 + i) % 12) + 1
      const year = startYear + Math.floor((startMonth - 1 + i) / 12)

      const allPayments = await getServicePayments(service.hotel_id, { month, year })
      const existingPayments = allPayments.filter((p) => p.service_id === service.id)

      if (existingPayments.length === 0) {
        const dueDateStr = `${year}-${month.toString().padStart(2, "0")}-${dueDay.toString().padStart(2, "0")}`

        const newPayment = {
          service_id: service.id,
          service_name: service.name,
          hotel_id: service.hotel_id,
          hotel_name: service.hotel_name,
          month,
          year,
          amount: service.average_amount || 0,
          due_date: dueDateStr,
          status: "pendiente" as const,
          notes: "Generado automaticamente por mantenimiento",
        }

        try {
          await addServicePayment(newPayment)
          generatedCount++
        } catch (error) {
          console.error("Error creating payment:", error)
        }
      }
    }

    return generatedCount
  }

  const updateSingleService = async (serviceId: string) => {
    setIsRunning(true)
    addLog(`Actualizando servicio individual...`)
    
    try {
      const services = await getServices()
      const service = services.find(s => s.id === serviceId)
      
      if (!service) {
        addLog(`[ERROR] Servicio no encontrado`)
        return
      }
      
      const allPayments = await getServicePayments(service.hotel_id)
      const paidPayments = allPayments.filter((p) => p.service_id === service.id && p.status === "abonado")
      
      if (paidPayments.length >= 1) {
        await updateServiceAverage(service.id)
        addLog(`[OK] Promedio actualizado para ${service.name}`)
        setStats((prev) => ({ ...prev, serviciosActualizados: prev.serviciosActualizados + 1 }))
      }
      
      // Generar pagos faltantes
      const servicePayments = allPayments.filter((p) => p.service_id === service.id)
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      
      let startMonth = currentMonth
      let startYear = currentYear
      
      if (servicePayments.length > 0) {
        const lastPayment = servicePayments.reduce((latest, p) => {
          const pDate = new Date(p.year, p.month - 1)
          const lDate = new Date(latest.year, latest.month - 1)
          return pDate > lDate ? p : latest
        })
        startMonth = lastPayment.month === 12 ? 1 : lastPayment.month + 1
        startYear = lastPayment.month === 12 ? lastPayment.year + 1 : lastPayment.year
      }
      
      const generatedCount = await generatePaymentsForService(service, startMonth, startYear, monthsAhead)
      if (generatedCount > 0) {
        addLog(`[OK] ${generatedCount} pagos generados para ${service.name}`)
        setStats((prev) => ({ ...prev, pagosGenerados: prev.pagosGenerados + generatedCount }))
      }
      
      // Recargar preview
      await loadPreview()
    } catch (error) {
      addLog(`[ERROR] ${error}`)
      setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
    } finally {
      setIsRunning(false)
    }
  }

  const runFullMaintenance = async () => {
    setLogs([])
    setStats({ serviciosActualizados: 0, pagosGenerados: 0, errores: 0 })
    setIsRunning(true)
    setStartTime(Date.now())

    addLog("=== INICIANDO MANTENIMIENTO COMPLETO ===")
    addLog(`Configuracion: ${monthsAhead} meses, vencimiento dia ${dueDay}`)
    
    const serviciosActualizados = await updateAverages()
    const pagosGenerados = await generatePayments()
    
    const duration = Math.round((Date.now() - (startTime || Date.now())) / 1000)
    addLog(`=== MANTENIMIENTO FINALIZADO (${duration}s) ===`)
    
    // Guardar en historial
    try {
      await supabase.from("maintenance_history").insert({
        services_updated: serviciosActualizados,
        payments_generated: pagosGenerados,
        errors: stats.errores,
        duration_seconds: duration,
        notes: `Config: ${monthsAhead} meses, dia ${dueDay}`,
      })
      await loadHistory()
    } catch (error) {
      console.error("Error saving history:", error)
    }
    
    setIsRunning(false)
    setStartTime(null)
  }

  const exportLog = () => {
    const content = logs.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mantenimiento-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    setLogs([])
    setStats({ serviciosActualizados: 0, pagosGenerados: 0, errores: 0 })
  }

  const daysSinceLast = getDaysSinceLastMaintenance()
  const isOverdue = isMaintenanceOverdue()

  return (
    <div className="space-y-6">
      {/* Header con estado */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Herramientas de Mantenimiento</h2>
          </div>
          
          {/* Indicador de ultimo mantenimiento */}
          {lastMaintenance && (
            <div className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
              isOverdue ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}>
              <Clock className="h-4 w-4 mr-1.5" />
              <span>
                Ultimo: hace {daysSinceLast} dias
                {isOverdue && " - Vencido"}
              </span>
            </div>
          )}
        </div>
        
        {!lastMaintenance && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center text-yellow-800">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm">No hay registro de mantenimientos anteriores</span>
            </div>
          </div>
        )}
        
        <p className="text-gray-600">
          Ejecuta el mantenimiento mensualmente para mantener actualizados los promedios y generar pagos futuros.
        </p>
      </div>

      {/* Configuracion */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuracion</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meses a generar
            </label>
            <select
              value={monthsAhead}
              onChange={(e) => setMonthsAhead(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
              <option value={18}>18 meses</option>
              <option value={24}>24 meses</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Cantidad de meses a futuro para generar pagos</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dia de vencimiento
            </label>
            <select
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                <option key={day} value={day}>Dia {day}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Dia del mes para vencimiento de pagos</p>
          </div>
        </div>
      </div>

      {/* Estadisticas de sesion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Servicios Actualizados</p>
              <p className="text-lg font-semibold text-gray-900">{stats.serviciosActualizados}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Pagos Generados</p>
              <p className="text-lg font-semibold text-gray-900">{stats.pagosGenerados}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Errores</p>
              <p className="text-lg font-semibold text-gray-900">{stats.errores}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={loadPreview}
            disabled={isRunning || loadingPreview}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className={`h-5 w-5 text-gray-600 ${loadingPreview ? "animate-pulse" : ""}`} />
            <span className="font-medium text-gray-700">
              {loadingPreview ? "Cargando..." : "Vista Previa"}
            </span>
          </button>

          <button
            onClick={runFullMaintenance}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className={`h-5 w-5 ${isRunning ? "animate-spin" : ""}`} />
            <span className="font-medium">
              {isRunning ? "Ejecutando..." : "Ejecutar Mantenimiento"}
            </span>
          </button>
        </div>
      </div>

      {/* Vista previa */}
      {showPreview && previewData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Vista Previa</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
          
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{previewData.length}</p>
              <p className="text-xs text-blue-700">Servicios</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {previewData.filter(s => s.needs_update).length}
              </p>
              <p className="text-xs text-orange-700">Promedios a actualizar</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {previewData.reduce((sum, s) => sum + s.missing_payments, 0)}
              </p>
              <p className="text-xs text-green-700">Pagos a generar</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{monthsAhead}</p>
              <p className="text-xs text-purple-700">Meses configurados</p>
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {previewData.map((service) => (
              <div key={service.id} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.hotel_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {service.needs_update && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                        Actualizar
                      </span>
                    )}
                    {service.missing_payments > 0 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        +{service.missing_payments} pagos
                      </span>
                    )}
                    {expandedService === service.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {expandedService === service.id && (
                  <div className="border-t bg-gray-50 p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Promedio actual:</span>
                        <span className="ml-2 font-medium">${service.current_average.toLocaleString()}</span>
                      </div>
                      {service.new_average !== null && (
                        <div>
                          <span className="text-gray-500">Nuevo promedio:</span>
                          <span className={`ml-2 font-medium ${service.needs_update ? "text-orange-600" : ""}`}>
                            ${service.new_average.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Pagos abonados:</span>
                        <span className="ml-2 font-medium">{service.paid_payments_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ultimo pago:</span>
                        <span className="ml-2 font-medium">{service.last_payment_date || "N/A"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => updateSingleService(service.id)}
                      disabled={isRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      Actualizar este servicio
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Log de Actividades</h3>
          <div className="flex gap-2">
            {logs.length > 0 && (
              <button 
                onClick={exportLog}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            )}
            <button onClick={clearLogs} className="text-sm text-gray-500 hover:text-gray-700">
              Limpiar
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Info className="h-5 w-5 mr-2" />
              <span>No hay actividades registradas</span>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`text-sm font-mono ${
                    log.includes("[ERROR]") ? "text-red-400" :
                    log.includes("[OK]") ? "text-green-400" :
                    log.includes("===") ? "text-yellow-400 font-bold" :
                    "text-gray-300"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center">
            <History className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Historial de Mantenimientos</h3>
          </div>
          {showHistory ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {showHistory && (
          <div className="mt-4">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay historial disponible</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Fecha</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Servicios</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Pagos</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Errores</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Duracion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 px-3">
                          {new Date(item.executed_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {item.services_updated}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            {item.payments_generated}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full ${
                            item.errors > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {item.errors}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-gray-600">
                          {item.duration_seconds}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
