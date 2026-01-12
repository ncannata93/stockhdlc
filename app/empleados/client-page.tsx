"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, BarChart3, UserPlus, Clock, ListChecks, FileUp } from "lucide-react"
import Inicio from "@/components/empleados/inicio"
import Agregar from "@/components/empleados/agregar"
import EmpleadosList from "@/components/empleados/empleados-list"
import CalendarioSimple from "@/components/empleados/calendario-simple"
import CalendarioMobile from "@/components/empleados/calendario-mobile"
import Resumen from "@/components/empleados/resumen"
import Historial from "@/components/empleados/historial"
import ImportarAsignaciones from "@/components/empleados/importar-asignaciones"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function EmpleadosClientPage() {
  const [activeTab, setActiveTab] = useState("inicio")
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7 mb-4">
          <TabsTrigger value="inicio" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Inicio</span>
          </TabsTrigger>
          <TabsTrigger value="empleados" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Empleados</span>
          </TabsTrigger>
          <TabsTrigger value="agregar" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Asignar</span>
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
          <TabsTrigger value="importar" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inicio">
          <Inicio onTabChange={setActiveTab} />
        </TabsContent>

        <TabsContent value="empleados">
          <EmpleadosList />
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

        <TabsContent value="importar">
          <ImportarAsignaciones />
        </TabsContent>
      </Tabs>
    </div>
  )
}
