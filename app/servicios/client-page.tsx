"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import ProtectedRoute from "@/components/protected-route"
import { MainNavigation } from "@/components/main-navigation"
import { Inicio } from "@/components/servicios/inicio"
import { PagosList } from "@/components/servicios/pagos-list"
import { Estadisticas } from "@/components/servicios/estadisticas"
import { ServicesList } from "@/components/servicios/servicios-list"

type TabType = "inicio" | "pagos" | "servicios" | "estadisticas"

interface TabConfig {
  id: TabType
  label: string
}

const TABS: TabConfig[] = [
  { id: "inicio", label: "Inicio" },
  { id: "pagos", label: "Pagos" },
  { id: "servicios", label: "Servicios" },
  { id: "estadisticas", label: "Estadisticas" },
]

export default function ServiceClientPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const filterStatus = searchParams.get("status")
  const [activeTab, setActiveTab] = useState<TabType>("inicio")

  useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam as TabType)
    }
  }, [tabParam])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <MainNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestion de Servicios</h1>
            <p className="text-gray-600">Administra los pagos de servicios del hotel</p>
          </div>

          {/* Tabs de navegacion simplificados */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenido de la pestana activa */}
          <div>
            {activeTab === "inicio" && <Inicio onNavigate={setActiveTab} />}
            {activeTab === "pagos" && <PagosList initialFilterStatus={filterStatus} />}
            {activeTab === "servicios" && <ServicesList />}
            {activeTab === "estadisticas" && <Estadisticas />}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
