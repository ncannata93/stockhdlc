"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Inicio from "@/components/empleados/inicio"
import EmpleadosList from "@/components/empleados/empleados-list"
import Agregar from "@/components/empleados/agregar"
import Historial from "@/components/empleados/historial"
import Resumen from "@/components/empleados/resumen"
import CalendarioSimple from "@/components/empleados/calendario-simple"

export default function EmpleadosClientPage() {
  const [activeTab, setActiveTab] = useState("inicio")

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="inicio" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="inicio">Inicio</TabsTrigger>
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
          <TabsTrigger value="agregar">Agregar</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
        </TabsList>
        <TabsContent value="inicio">
          <Inicio />
        </TabsContent>
        <TabsContent value="empleados">
          <EmpleadosList />
        </TabsContent>
        <TabsContent value="agregar">
          <Agregar onSuccess={() => setActiveTab("empleados")} />
        </TabsContent>
        <TabsContent value="calendario">
          <CalendarioSimple />
        </TabsContent>
        <TabsContent value="historial">
          <Historial />
        </TabsContent>
        <TabsContent value="resumen">
          <Resumen />
        </TabsContent>
      </Tabs>
    </div>
  )
}
