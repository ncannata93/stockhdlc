"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Calendar, BarChart3, Clock } from "lucide-react"

// Importar componentes
import Inicio from "./components/Inicio"
import Agregar from "./components/Agregar"
import EmpleadosList from "./components/EmpleadosList"
import Calendario from "./components/Calendario"
import Resumen from "./components/Resumen"
import Historial from "./components/Historial"

export default function EmpleadosPage() {
  const [activeTab, setActiveTab] = useState("inicio")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleTabChange = (tab: string) => {
    console.log("🔄 Cambiando a tab:", tab)
    setActiveTab(tab)
  }

  const handleStatsChange = () => {
    console.log("📊 Estadísticas cambiadas, actualizando inicio...")
    setRefreshTrigger((prev) => {
      const newValue = prev + 1
      console.log("🔄 Nuevo refreshTrigger:", newValue)
      return newValue
    })
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestión de Empleados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
              <TabsTrigger value="inicio" className="flex items-center gap-1 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Inicio</span>
              </TabsTrigger>
              <TabsTrigger value="empleados" className="flex items-center gap-1 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </TabsTrigger>
              <TabsTrigger value="agregar" className="flex items-center gap-1 text-xs sm:text-sm">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Asignar</span>
              </TabsTrigger>
              <TabsTrigger value="calendario" className="flex items-center gap-1 text-xs sm:text-sm">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendario</span>
              </TabsTrigger>
              <TabsTrigger value="resumen" className="flex items-center gap-1 text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Pagos</span>
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex items-center gap-1 text-xs sm:text-sm">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inicio" className="mt-6">
              <Inicio onTabChange={handleTabChange} refreshTrigger={refreshTrigger} />
            </TabsContent>

            <TabsContent value="empleados" className="mt-6">
              <EmpleadosList />
            </TabsContent>

            <TabsContent value="agregar" className="mt-6">
              <Agregar />
            </TabsContent>

            <TabsContent value="calendario" className="mt-6">
              <Calendario />
            </TabsContent>

            <TabsContent value="resumen" className="mt-6">
              <Resumen onStatsChange={handleStatsChange} />
            </TabsContent>

            <TabsContent value="historial" className="mt-6">
              <Historial />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
