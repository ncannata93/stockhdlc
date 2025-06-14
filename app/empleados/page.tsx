"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Users, Calendar, BarChart3, Upload, UserCog } from "lucide-react"

import EmpleadosInicio from "@/components/empleados/inicio"
import EmpleadosAgregar from "@/components/empleados/agregar"
import EmpleadosCalendario from "@/components/empleados/calendario"
import EmpleadosHistorial from "@/components/empleados/historial"
import EmpleadosResumen from "@/components/empleados/resumen"
import ImportarAsignaciones from "@/components/empleados/importar-asignaciones"
import EmpleadosList from "@/components/empleados/empleados-list"

export default function EmpleadosPage() {
  const [activeTab, setActiveTab] = useState("inicio")
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestión de Empleados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="inicio" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Inicio
              </TabsTrigger>
              <TabsTrigger value="empleados" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Empleados
              </TabsTrigger>
              <TabsTrigger value="agregar" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Agregar
              </TabsTrigger>
              <TabsTrigger value="calendario" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Historial
              </TabsTrigger>
              <TabsTrigger value="resumen" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="importar" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Importar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inicio" className="mt-6">
              <EmpleadosInicio key={`inicio-${refreshKey}`} onTabChange={handleTabChange} />
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
              <EmpleadosResumen key={`resumen-${refreshKey}`} />
            </TabsContent>

            <TabsContent value="importar" className="mt-6">
              <ImportarAsignaciones onSuccess={handleRefresh} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
