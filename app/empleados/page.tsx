"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Users, Calendar, BarChart3, Upload, UserCog, DollarSign } from "lucide-react"

import EmpleadosInicio from "@/components/empleados/inicio"
import EmpleadosAgregar from "@/components/empleados/agregar"
import EmpleadosCalendario from "@/components/empleados/calendario"
import EmpleadosHistorial from "@/components/empleados/historial"
import EmpleadosResumen from "@/components/empleados/resumen"
import ImportarAsignaciones from "@/components/empleados/importar-asignaciones"
import EmpleadosList from "@/components/empleados/empleados-list"
import PagoSimple from "@/components/empleados/pago-simple"

export default function EmpleadosPage() {
  const [activeTab, setActiveTab] = useState("inicio")
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleStatsChange = () => {
    console.log("📊 Estadísticas cambiadas, actualizando inicio...")
    setRefreshKey((prev) => {
      const newValue = prev + 1
      console.log("🔄 Nuevo refreshKey:", newValue)
      return newValue
    })
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestión de Empleados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7 md:grid-cols-4 sm:grid-cols-2 gap-1 h-auto p-1 overflow-x-auto">
              <TabsTrigger
                value="inicio"
                className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 py-2"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Inicio</span>
              </TabsTrigger>
              <TabsTrigger
                value="empleados"
                className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 py-2"
              >
                <UserCog className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Empleados</span>
              </TabsTrigger>
              <TabsTrigger
                value="agregar"
                className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 py-2"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Agregar</span>
              </TabsTrigger>
              <TabsTrigger
                value="calendario"
                className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 py-2"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Calendario</span>
              </TabsTrigger>
              <TabsTrigger
                value="historial"
                className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 py-2"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
              <TabsTrigger
                value="resumen"
                className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 py-2"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Resumen</span>
              </TabsTrigger>
              <TabsTrigger
                value="importar"
                className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 py-2"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Importar</span>
              </TabsTrigger>
              <TabsTrigger
                value="pagos"
                className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 py-2"
              >
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Pagos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inicio" className="mt-6">
              <EmpleadosInicio key={`inicio-${refreshKey}`} onTabChange={handleTabChange} refreshTrigger={refreshKey} />
            </TabsContent>

            <TabsContent value="empleados" className="mt-6">
              <EmpleadosList key={`empleados-${refreshKey}`} />
            </TabsContent>

            <TabsContent value="agregar" className="mt-6">
              <EmpleadosAgregar onSuccess={handleRefresh} />
            </TabsContent>

            <TabsContent value="calendario" className="mt-6">
              <EmpleadosCalendario key={`calendario-${refreshKey}`} />
            </TabsContent>

            <TabsContent value="historial" className="mt-6">
              <EmpleadosHistorial key={`historial-${refreshKey}`} />
            </TabsContent>

            <TabsContent value="resumen" className="mt-6">
              <EmpleadosResumen key={`resumen-${refreshKey}`} onStatsChange={handleStatsChange} />
            </TabsContent>

            <TabsContent value="importar" className="mt-6">
              <ImportarAsignaciones onSuccess={handleRefresh} />
            </TabsContent>

            <TabsContent value="pagos" className="mt-6">
              <PagoSimple />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
