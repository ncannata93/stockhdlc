"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Home, Users, Plus, Calendar, History, BarChart3 } from "lucide-react"
import EmpleadosInicio from "@/components/empleados/inicio"
import EmpleadosList from "@/components/empleados/empleados-list"
import EmpleadosAgregar from "@/components/empleados/agregar"
import EmpleadosCalendario from "@/components/empleados/calendario"
import EmpleadosHistorial from "@/components/empleados/historial"
import EmpleadosResumen from "@/components/empleados/resumen"
import ImportarAsignaciones from "@/components/empleados/importar-asignaciones"

export default function EmpleadosClient() {
  const [activeTab, setActiveTab] = useState("inicio")

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Gestión de Empleados</h1>
        <p className="text-gray-600 mt-2">Gestiona empleados, asignaciones y pagos de manera eficiente</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="inicio" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Inicio
          </TabsTrigger>
          <TabsTrigger value="empleados" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Empleados
          </TabsTrigger>
          <TabsTrigger value="agregar" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar
          </TabsTrigger>
          <TabsTrigger value="importar" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inicio">
          <EmpleadosInicio />
        </TabsContent>

        <TabsContent value="empleados">
          <EmpleadosList />
        </TabsContent>

        <TabsContent value="agregar">
          <EmpleadosAgregar />
        </TabsContent>

        <TabsContent value="importar">
          <ImportarAsignaciones />
        </TabsContent>

        <TabsContent value="calendario">
          <EmpleadosCalendario />
        </TabsContent>

        <TabsContent value="historial">
          <EmpleadosHistorial />
        </TabsContent>

        <TabsContent value="resumen">
          <EmpleadosResumen />
        </TabsContent>
      </Tabs>
    </div>
  )
}
