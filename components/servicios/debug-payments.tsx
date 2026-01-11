"use client"

import { useState, useEffect } from "react"
import { getServicePayments, getHotels, getServices, addServicePayment } from "@/lib/service-db"
import type { ServicePayment, Hotel, Service } from "@/lib/service-types"

export function DebugPayments() {
  const [payments, setPayments] = useState<ServicePayment[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  const loadData = async () => {
    setLoading(true)
    addLog("Iniciando carga de datos...")

    try {
      addLog("Cargando hoteles...")
      const hotelsData = await getHotels()
      setHotels(hotelsData)
      addLog(`Hoteles cargados: ${hotelsData.length}`)

      addLog("Cargando servicios...")
      const servicesData = await getServices()
      setServices(servicesData)
      addLog(`Servicios cargados: ${servicesData.length}`)

      addLog("Cargando pagos...")
      const paymentsData = await getServicePayments()
      setPayments(paymentsData)
      addLog(`Pagos cargados: ${paymentsData.length}`)

      // Mostrar pagos de enero y febrero
      const janFebPayments = paymentsData.filter((p) => (p.month === 1 || p.month === 2) && p.year === 2025)
      addLog(`Pagos de enero/febrero 2025: ${janFebPayments.length}`)

      janFebPayments.forEach((payment) => {
        addLog(`- ${payment.service_name} (${payment.month}/${payment.year}): $${payment.amount}`)
      })
    } catch (error) {
      addLog(`Error cargando datos: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestPayment = async () => {
    addLog("Creando pago de prueba para enero...")

    try {
      const testPayment = {
        service_id: "1",
        service_name: "Servicio de Prueba",
        hotel_id: hotels[0]?.id || "1",
        month: 1,
        year: 2025,
        amount: 1000,
        due_date: "2025-01-31T00:00:00.000Z",
        status: "pendiente" as const,
      }

      await addServicePayment(testPayment)
      addLog("Pago de prueba creado exitosamente")

      // Recargar datos
      await loadData()
    } catch (error) {
      addLog(`Error creando pago de prueba: ${error}`)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">🐛 Debug de Pagos de Servicios</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium text-gray-700">Hoteles</h4>
          <p className="text-2xl font-bold text-blue-600">{hotels.length}</p>
        </div>
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium text-gray-700">Servicios</h4>
          <p className="text-2xl font-bold text-green-600">{services.length}</p>
        </div>
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium text-gray-700">Pagos</h4>
          <p className="text-2xl font-bold text-purple-600">{payments.length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Recargar Datos"}
        </button>
        <button onClick={createTestPayment} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Crear Pago de Prueba (Enero)
        </button>
      </div>

      {/* Mostrar pagos de enero/febrero */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Pagos de Enero/Febrero 2025:</h4>
        <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
          {payments
            .filter((p) => (p.month === 1 || p.month === 2) && p.year === 2025)
            .map((payment) => (
              <div key={payment.id} className="text-sm border-b py-1">
                {payment.service_name} - {payment.hotel_name} - {payment.month}/{payment.year} - ${payment.amount}
              </div>
            ))}
          {payments.filter((p) => (p.month === 1 || p.month === 2) && p.year === 2025).length === 0 && (
            <p className="text-gray-500 text-sm">No hay pagos para enero/febrero 2025</p>
          )}
        </div>
      </div>

      {/* Logs */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Logs de Debug:</h4>
        <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
