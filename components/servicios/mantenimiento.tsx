"use client"

import { useState } from "react"
import { Settings, RefreshCw, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { getServices, updateServiceAverage, getServicePayments, addServicePayment } from "@/lib/service-db"

export function Mantenimiento() {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState({
    serviciosActualizados: 0,
    pagosGenerados: 0,
    errores: 0,
  })

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const updateAverages = async () => {
    setIsRunning(true)
    addLog("🔄 Iniciando actualización de promedios...")

    try {
      // Obtener todos los servicios
      const services = await getServices()
      let serviciosActualizados = 0

      for (const service of services) {
        try {
          // Obtener pagos abonados del servicio directamente
          const allPayments = await getServicePayments(service.hotel_id)
          const paidPayments = allPayments.filter((p) => p.service_id === service.id && p.status === "abonado")

          if (paidPayments.length >= 1) {
            // Calcular nuevo promedio
            const totalAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)
            const oldAverage = service.average_amount || 0
            const newAverage = Math.round((totalAmount / paidPayments.length) * 100) / 100

            if (Math.abs(newAverage - oldAverage) > 0.01) {
              await updateServiceAverage(service.id)
              addLog(
                `✅ Promedio actualizado: ${service.name} (${service.hotel_name}) - Anterior: $${oldAverage.toLocaleString()} → Nuevo: $${newAverage.toLocaleString()} (basado en ${paidPayments.length} pagos)`,
              )
              serviciosActualizados++
            } else {
              addLog(
                `ℹ️ Sin cambios: ${service.name} (${service.hotel_name}) - Promedio actual: $${oldAverage.toLocaleString()}`,
              )
            }
          } else {
            addLog(
              `⚠️ Insuficientes datos: ${service.name} (${service.hotel_name}) - Solo ${paidPayments.length} pagos abonados`,
            )
          }
        } catch (error) {
          addLog(`❌ Error actualizando ${service.name}: ${error}`)
          setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
        }
      }

      if (serviciosActualizados > 0) {
        addLog(`✅ Actualización completada: ${serviciosActualizados} servicios actualizados`)
      } else {
        addLog("ℹ️ No se requirieron actualizaciones de promedios")
      }

      setStats((prev) => ({ ...prev, serviciosActualizados: prev.serviciosActualizados + serviciosActualizados }))
    } catch (error) {
      addLog(`❌ Error general al actualizar promedios: ${error}`)
      setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
    } finally {
      setIsRunning(false)
    }
  }

  const generatePayments = async () => {
    setIsRunning(true)
    addLog("🔍 Verificando pagos faltantes...")

    try {
      const services = await getServices()
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      let pagosGenerados = 0

      for (const service of services) {
        try {
          // Obtener todos los pagos del servicio directamente
          const allPayments = await getServicePayments(service.hotel_id)
          const servicePayments = allPayments.filter((p) => p.service_id === service.id)

          if (servicePayments.length === 0) {
            // Generar pagos desde el mes actual
            const generatedCount = await generatePaymentsForService(service, currentMonth, currentYear, 12)
            addLog(
              `✅ Pagos generados: ${service.name} (${service.hotel_name}) - ${generatedCount} meses desde ${currentMonth}/${currentYear}`,
            )
            pagosGenerados += generatedCount
            continue
          }

          // Encontrar el último pago
          const lastPayment = servicePayments.reduce((latest, payment) => {
            const paymentDate = new Date(payment.year, payment.month - 1)
            const latestDate = new Date(latest.year, latest.month - 1)
            return paymentDate > latestDate ? payment : latest
          })

          // Calcular meses hasta el último pago
          const lastPaymentDate = new Date(lastPayment.year, lastPayment.month - 1)
          const currentDateForComparison = new Date(currentYear, currentMonth - 1)
          const monthsDiff =
            (lastPaymentDate.getFullYear() - currentDateForComparison.getFullYear()) * 12 +
            (lastPaymentDate.getMonth() - currentDateForComparison.getMonth())

          if (monthsDiff < 3) {
            // Generar pagos adicionales
            const nextMonth = lastPayment.month === 12 ? 1 : lastPayment.month + 1
            const nextYear = lastPayment.month === 12 ? lastPayment.year + 1 : lastPayment.year

            const generatedCount = await generatePaymentsForService(service, nextMonth, nextYear, 12)
            if (generatedCount > 0) {
              addLog(
                `✅ Pagos faltantes generados: ${service.name} (${service.hotel_name}) - ${generatedCount} pagos desde ${nextMonth}/${nextYear}`,
              )
              pagosGenerados += generatedCount
            } else {
              addLog(
                `ℹ️ Sin pagos faltantes: ${service.name} (${service.hotel_name}) - Buffer suficiente hasta ${lastPayment.month}/${lastPayment.year}`,
              )
            }
          } else {
            addLog(
              `ℹ️ Buffer suficiente: ${service.name} (${service.hotel_name}) - Pagos hasta ${lastPayment.month}/${lastPayment.year}`,
            )
          }
        } catch (error) {
          addLog(`❌ Error verificando ${service.name}: ${error}`)
          setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
        }
      }

      if (pagosGenerados > 0) {
        addLog(`✅ Verificación completada: ${pagosGenerados} pagos faltantes generados`)
      } else {
        addLog("ℹ️ No se requirieron pagos adicionales")
      }

      setStats((prev) => ({ ...prev, pagosGenerados: prev.pagosGenerados + pagosGenerados }))
    } catch (error) {
      addLog(`❌ Error general al verificar pagos: ${error}`)
      setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
    } finally {
      setIsRunning(false)
    }
  }

  const generatePaymentsForService = async (
    service: any,
    startMonth: number,
    startYear: number,
    monthsAhead: number,
  ): Promise<number> => {
    let generatedCount = 0

    for (let i = 0; i < monthsAhead; i++) {
      const month = ((startMonth - 1 + i) % 12) + 1
      const year = startYear + Math.floor((startMonth - 1 + i) / 12)

      // Verificar si ya existe un pago para este mes/año
      const allPayments = await getServicePayments(service.hotel_id, { month, year })
      const existingPayments = allPayments.filter((p) => p.service_id === service.id)

      if (existingPayments.length === 0) {
        // Generar fecha de vencimiento (día 10 del mismo mes)
        const dueDate = `${year}-${month.toString().padStart(2, "0")}-10`

        const newPayment = {
          service_id: service.id,
          service_name: service.name,
          hotel_id: service.hotel_id,
          hotel_name: service.hotel_name,
          month,
          year,
          amount: service.average_amount || 0,
          due_date: dueDate,
          status: "pendiente" as const,
          notes: "Generado automáticamente por mantenimiento",
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

  const runFullMaintenance = async () => {
    setLogs([])
    setStats({ serviciosActualizados: 0, pagosGenerados: 0, errores: 0 })

    addLog("🔧 Iniciando mantenimiento completo del sistema...")
    await updateAverages()
    await generatePayments()
    addLog("✅ Mantenimiento completo finalizado exitosamente")
  }

  const clearLogs = () => {
    setLogs([])
    setStats({ serviciosActualizados: 0, pagosGenerados: 0, errores: 0 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Settings className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Herramientas de Mantenimiento</h2>
        </div>
        <p className="text-gray-600">
          Utiliza estas herramientas para mantener actualizado el sistema de pagos y servicios.
        </p>
      </div>

      {/* Estadísticas rápidas */}
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

      {/* Herramientas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones de Mantenimiento</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={updateAverages}
            disabled={isRunning}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-8 w-8 text-blue-600 mb-2 ${isRunning ? "animate-spin" : ""}`} />
            <span className="font-medium text-gray-900">Actualizar Promedios</span>
            <span className="text-sm text-gray-500 text-center mt-1">
              Recalcula los promedios basándose en pagos reales
            </span>
          </button>

          <button
            onClick={generatePayments}
            disabled={isRunning}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
            <span className="font-medium text-gray-900">Verificar Pagos</span>
            <span className="text-sm text-gray-500 text-center mt-1">
              Genera pagos faltantes para servicios activos
            </span>
          </button>

          <button
            onClick={runFullMaintenance}
            disabled={isRunning}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50"
          >
            <Settings className="h-8 w-8 text-blue-600 mb-2" />
            <span className="font-medium text-gray-900">Mantenimiento Completo</span>
            <span className="text-sm text-gray-500 text-center mt-1">Ejecuta todas las tareas de mantenimiento</span>
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Log de Actividades</h3>
          <button onClick={clearLogs} className="text-sm text-gray-500 hover:text-gray-700">
            Limpiar
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Info className="h-5 w-5 mr-2" />
              <span>No hay actividades registradas</span>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-gray-700">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Información */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Información sobre el mantenimiento:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Los promedios se actualizan automáticamente al abonar pagos</li>
              <li>Los pagos se generan automáticamente cuando quedan menos de 3 meses</li>
              <li>Ejecuta el mantenimiento completo mensualmente para mejores resultados</li>
              <li>El log muestra detalles específicos de cada operación realizada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
