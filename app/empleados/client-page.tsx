"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Inicio from "@/components/empleados/inicio"
import Agregar from "@/components/empleados/agregar"
import CalendarioSimple from "@/components/empleados/calendario-simple"
import CalendarioMobile from "@/components/empleados/calendario-mobile"
import Resumen from "@/components/empleados/resumen"
import Historial from "@/components/empleados/historial"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function EmpleadosClientPage() {
  const [activeTab, setActiveTab] = useState("inicio")
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="inicio">Inicio</TabsTrigger>
          <TabsTrigger value="agregar">Agregar</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="inicio">
          <Inicio onTabChange={setActiveTab} />
        </TabsContent>
        <TabsContent value="agregar">
          <Agregar />
        </TabsContent>
        <TabsContent value="calendario">{isMobile ? <CalendarioMobile /> : <CalendarioSimple />}</TabsContent>
        <TabsContent value="resumen">
          <Resumen />
        </TabsContent>
        <TabsContent value="historial">
          <Historial />
        </TabsContent>
      </Tabs>
    </div>
  )
}
