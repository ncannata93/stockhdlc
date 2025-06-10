"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, BarChart3, UserPlus, Clock } from "lucide-react"

// Importar componentes existentes
import EmpleadosInicio from "@/components/empleados/inicio"
import EmpleadosAgregar from "@/components/empleados/agregar"
import EmpleadosCalendario from "@/components/empleados/calendario"
import EmpleadosResumen from "@/components/empleados/resumen"
import EmpleadosHistorial from "@/components/empleados/historial"

export default function EmpleadosClient() {
  const [activeTab, setActiveTab] = useState("inicio")

  // Función para cambiar pestañas desde componentes hijos
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">👥 Gestión de Empleados</h1>
          <p className="text-muted-foreground">Sistema completo para gestionar empleados, asignaciones y pagos</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inicio" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Inicio</span>
          </TabsTrigger>
          <TabsTrigger value="agregar" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Agregar</span>
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendario</span>
          </TabsTrigger>
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inicio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Panel Principal de Empleados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmpleadosInicio onTabChange={handleTabChange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agregar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-6 w-6" />
                Agregar Nueva Asignación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmpleadosAgregar onSuccess={() => handleTabChange("historial")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Calendario de Asignaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmpleadosCalendario />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumen" className="space-y-6">
          <EmpleadosResumen />
        </TabsContent>

        <TabsContent value="historial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Historial de Asignaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmpleadosHistorial />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
