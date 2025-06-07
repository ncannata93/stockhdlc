"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Inicio from "@/components/empleados/inicio"
import EmpleadosList from "@/components/empleados/empleados-list"
import Agregar from "@/components/empleados/agregar"
import Historial from "@/components/empleados/historial"
import Resumen from "@/components/empleados/resumen"
import CalendarioSimple from "@/components/empleados/calendario-simple"
import ImportarAsignaciones from "@/components/empleados/importar-asignaciones"

const tabs = [
  { value: "inicio", label: "Inicio" },
  { value: "empleados", label: "Empleados" },
  { value: "agregar", label: "Agregar" },
  { value: "importar", label: "Importar" },
  { value: "calendario", label: "Calendario" },
  { value: "historial", label: "Historial" },
  { value: "resumen", label: "Resumen" },
]

export default function EmpleadosClientPage() {
  const [activeTab, setActiveTab] = useState("inicio")

  const currentTabLabel = tabs.find((tab) => tab.value === activeTab)?.label || "Inicio"

  return (
    <div className="container mx-auto py-4 px-2 sm:py-6 sm:px-4">
      <Tabs defaultValue="inicio" value={activeTab} onValueChange={setActiveTab}>
        {/* Navegación Desktop - Pestañas normales */}
        <div className="hidden sm:block mb-8">
          <TabsList className="grid grid-cols-7 w-full">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Navegación Mobile - Dropdown */}
        <div className="block sm:hidden mb-6">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Sección Actual</label>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <span className="font-medium">{currentTabLabel}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tabs.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
