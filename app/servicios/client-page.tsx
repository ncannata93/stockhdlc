"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import ProtectedRoute from "@/components/protected-route"
import { MainNavigation } from "@/components/main-navigation"
import { Inicio } from "@/components/servicios/inicio"
import { PagosList } from "@/components/servicios/pagos-list"
import { AgregarPago } from "@/components/servicios/agregar-pago"
import { EditarPago } from "@/components/servicios/editar-pago"
import { Estadisticas } from "@/components/servicios/estadisticas"
import { ServicesList } from "@/components/servicios/servicios-list"
import { AgregarServicio } from "@/components/servicios/agregar-servicio"
import { Mantenimiento } from "@/components/servicios/mantenimiento"
import { DebugArgentina } from "@/components/servicios/debug-argentina"

export default function ServiceClientPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState("inicio")

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <MainNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Servicios</h1>
            <p className="text-gray-600">Administra los pagos de servicios del hotel</p>
          </div>

          {/* Tabs de navegación */}
          <div className="mb-6 overflow-x-auto">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("inicio")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "inicio"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Inicio
                </button>
                <button
                  onClick={() => setActiveTab("pagos")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "pagos"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Pagos
                </button>
                <button
                  onClick={() => setActiveTab("agregar-pago")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "agregar-pago"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Agregar Pago
                </button>
                <button
                  onClick={() => setActiveTab("servicios")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "servicios"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Servicios
                </button>
                <button
                  onClick={() => setActiveTab("agregar-servicio")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "agregar-servicio"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Agregar Servicio
                </button>
                <button
                  onClick={() => setActiveTab("estadisticas")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "estadisticas"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Estadísticas
                </button>
                <button
                  onClick={() => setActiveTab("debug")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "debug"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  🔍 Debug
                </button>
                <button
                  onClick={() => setActiveTab("mantenimiento")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "mantenimiento"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Mantenimiento
                </button>
              </nav>
            </div>
          </div>

          {/* Contenido de la pestaña activa */}
          <div>
            {activeTab === "inicio" && <Inicio />}
            {activeTab === "pagos" && <PagosList />}
            {activeTab === "agregar-pago" && <AgregarPago />}
            {activeTab === "editar-pago" && <EditarPago />}
            {activeTab === "servicios" && <ServicesList />}
            {activeTab === "agregar-servicio" && <AgregarServicio />}
            {activeTab === "estadisticas" && <Estadisticas />}
            {activeTab === "debug" && <DebugArgentina />}
            {activeTab === "mantenimiento" && <Mantenimiento />}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
