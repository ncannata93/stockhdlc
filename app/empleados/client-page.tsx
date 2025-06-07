"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import Inicio from "@/components/empleados/inicio"
import EmpleadosList from "@/components/empleados/empleados-list"
import Agregar from "@/components/empleados/agregar"
import Historial from "@/components/empleados/historial"
import Resumen from "@/components/empleados/resumen"
import CalendarioSimple from "@/components/empleados/calendario-simple"
import ImportarAsignaciones from "@/components/empleados/importar-asignaciones"

export default function EmpleadosClientPage() {
  const [activeTab, setActiveTab] = useState("inicio")

  return (
    <div className="container mx-auto py-4 px-2 sm:py-6 sm:px-4">
      <Tabs defaultValue="inicio" value={activeTab} onValueChange={setActiveTab}>
        {/* Pestañas responsivas */}
        <div className="mb-6 sm:mb-8">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-auto p-1 bg-muted rounded-lg w-full sm:w-auto">
              <div className="flex space-x-1 sm:space-x-2 min-w-max">
                <TabsTrigger
                  value="inicio"
                  className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Inicio
                </TabsTrigger>
                <TabsTrigger
                  value="empleados"
                  className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Empleados
                </TabsTrigger>
                <TabsTrigger
                  value="agregar"
                  className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Agregar
                </TabsTrigger>
                <TabsTrigger
                  value="importar"
                  className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Importar
                </TabsTrigger>
                <TabsTrigger
                  value="calendario"
                  className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Calendario
                </TabsTrigger>
                <TabsTrigger
                  value="historial"
                  className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Historial
                </TabsTrigger>
                <TabsTrigger
                  value="resumen"
                  className="px-2 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Resumen
                </TabsTrigger>
              </div>
            </TabsList>
          </ScrollArea>
        </div>

        <TabsContent value="inicio" className="mt-0">
          <Inicio />
        </TabsContent>
        <TabsContent value="empleados" className="mt-0">
          <EmpleadosList />
        </TabsContent>
        <TabsContent value="agregar" className="mt-0">
          <Agregar onSuccess={() => setActiveTab("empleados")} />
        </TabsContent>
        <TabsContent value="importar" className="mt-0">
          <ImportarAsignaciones onSuccess={() => setActiveTab("historial")} />
        </TabsContent>
        <TabsContent value="calendario" className="mt-0">
          <CalendarioSimple />
        </TabsContent>
        <TabsContent value="historial" className="mt-0">
          <Historial />
        </TabsContent>
        <TabsContent value="resumen" className="mt-0">
          <Resumen />
        </TabsContent>
      </Tabs>
    </div>
  )
}
