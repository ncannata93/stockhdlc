"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Users, Plus, Upload, Calendar, History, BarChart3 } from "lucide-react"

// Importar componentes limpios
import EmpleadosInicio from "@/components/empleados/inicio"
import EmpleadosList from "@/components/empleados/empleados-list"
import EmpleadosAgregar from "@/components/empleados/agregar"
import ImportarAsignaciones from "@/components/empleados/importar-asignaciones"
import EmpleadosCalendario from "@/components/empleados/calendario"
import EmpleadosHistorial from "@/components/empleados/historial"
import EmpleadosResumen from "@/components/empleados/resumen"

type TabType = "inicio" | "empleados" | "agregar" | "importar" | "calendario" | "historial" | "resumen"

const tabs = [
  { id: "inicio" as TabType, label: "Inicio", icon: Home },
  { id: "empleados" as TabType, label: "Empleados", icon: Users },
  { id: "agregar" as TabType, label: "Agregar", icon: Plus },
  { id: "importar" as TabType, label: "Importar", icon: Upload },
  { id: "calendario" as TabType, label: "Calendario", icon: Calendar },
  { id: "historial" as TabType, label: "Historial", icon: History },
  { id: "resumen" as TabType, label: "Resumen", icon: BarChart3 },
]

export default function EmpleadosClient() {
  const [activeTab, setActiveTab] = useState<TabType>("inicio")

  const renderContent = () => {
    switch (activeTab) {
      case "inicio":
        return <EmpleadosInicio />
      case "empleados":
        return <EmpleadosList />
      case "agregar":
        return <EmpleadosAgregar />
      case "importar":
        return <ImportarAsignaciones />
      case "calendario":
        return <EmpleadosCalendario />
      case "historial":
        return <EmpleadosHistorial />
      case "resumen":
        return <EmpleadosResumen />
      default:
        return <EmpleadosInicio />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Empleados</h1>
              <p className="text-sm text-gray-600">Gestión de empleados y asignaciones</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 whitespace-nowrap
                    ${
                      isActive
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="min-h-[600px]">
          <CardContent className="p-6">{renderContent()}</CardContent>
        </Card>
      </div>
    </div>
  )
}
