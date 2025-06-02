"use client"

import { useState } from "react"
import { Settings, RefreshCw, CheckCircle, AlertTriangle, Info } from "lucide-react"

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
    addLog("Iniciando actualización de promedios...")

    try {
      // Simular proceso de actualización
      await new Promise((resolve) => setTimeout(resolve, 2000))

      addLog("✅ Promedios actualizados correctamente")
      setStats((prev) => ({ ...prev, serviciosActualizados: prev.serviciosActualizados + 5 }))
    } catch (error) {
      addLog("❌ Error al actualizar promedios")
      setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
    } finally {
      setIsRunning(false)
    }
  }

  const generatePayments = async () => {
    setIsRunning(true)
    addLog("Verificando pagos faltantes...")

    try {
      // Simular proceso de generación
      await new Promise((resolve) => setTimeout(resolve, 1500))

      addLog("✅ Pagos generados correctamente")
      setStats((prev) => ({ ...prev, pagosGenerados: prev.pagosGenerados + 12 }))
    } catch (error) {
      addLog("❌ Error al generar pagos")
      setStats((prev) => ({ ...prev, errores: prev.errores + 1 }))
    } finally {
      setIsRunning(false)
    }
  }

  const runFullMaintenance = async () => {
    setLogs([])
    setStats({ serviciosActualizados: 0, pagosGenerados: 0, errores: 0 })

    addLog("🔧 Iniciando mantenimiento completo...")
    await updateAverages()
    await generatePayments()
    addLog("✅ Mantenimiento completo finalizado")
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
