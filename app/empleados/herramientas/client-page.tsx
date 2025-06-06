"use client"

import { useState } from "react"
import { CheckCircle, User, FileText, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { empleados } from "@/data/empleados"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import VerificarImportacion from "@/components/empleados/verificar-importacion"

type Status = "Activo" | "Inactivo" | "Pendiente"

const tabs = [
  {
    id: "general",
    label: "General",
    icon: User,
    component: () => (
      <div>
        <p>Información general de los empleados registrados en el sistema.</p>
        <Table>
          <TableCaption>Lista de empleados del sistema</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Puesto</TableHead>
              <TableHead>Fecha de Contratación</TableHead>
              <TableHead>Salario</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empleados.map((empleado) => (
              <TableRow key={empleado.id}>
                <TableCell className="font-medium">{empleado.id}</TableCell>
                <TableCell>{empleado.nombre}</TableCell>
                <TableCell>{empleado.email}</TableCell>
                <TableCell>{empleado.telefono}</TableCell>
                <TableCell>{empleado.departamento}</TableCell>
                <TableCell>{empleado.puesto}</TableCell>
                <TableCell>{empleado.fecha_contratacion}</TableCell>
                <TableCell>${empleado.salario.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      empleado.status === "Activo" && "bg-green-500 text-white border-green-500",
                      empleado.status === "Inactivo" && "bg-red-500 text-white border-red-500",
                      empleado.status === "Pendiente" && "bg-yellow-500 text-white border-yellow-500",
                    )}
                  >
                    {empleado.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ),
  },
  {
    id: "importar",
    label: "Importar Datos",
    icon: FileText,
    component: () => (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Importación Masiva de Asignaciones</h3>
        <p className="text-muted-foreground">
          Herramientas para importar grandes cantidades de asignaciones de empleados desde archivos externos.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📋 Scripts SQL Disponibles</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • <code>insertar-asignaciones-abril-mayo.sql</code>
            </li>
            <li>
              • <code>insertar-asignaciones-abril-mayo-parte2.sql</code>
            </li>
            <li>
              • <code>insertar-asignaciones-abril-mayo-parte3.sql</code>
            </li>
          </ul>
          <p className="text-sm text-blue-700 mt-2">
            Ejecuta estos scripts desde la sección de diagnóstico para importar datos masivos.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "verificar",
    label: "Verificar Importación",
    icon: CheckCircle,
    component: VerificarImportacion,
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: Settings,
    component: () => (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Configuración del Sistema</h3>
        <p className="text-muted-foreground">Configuraciones avanzadas para el manejo de empleados y asignaciones.</p>
        <div className="grid gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Tarifas por Defecto</h4>
            <p className="text-sm text-muted-foreground">Tarifa base: $50,000 por día por hotel</p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">División de Tarifas</h4>
            <p className="text-sm text-muted-foreground">
              Cuando un empleado trabaja en múltiples hoteles el mismo día, la tarifa se divide automáticamente.
            </p>
          </div>
        </div>
      </div>
    ),
  },
]

export default function HerramientasClientPage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  return (
    <div className="container mx-auto py-6">
      <div className="md:flex items-center justify-between space-y-2 md:space-y-0 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/empleados">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Empleados
              </Button>
            </Link>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Herramientas de Empleados</h2>
          <p className="text-muted-foreground">Herramientas avanzadas para importación y configuración.</p>
        </div>
      </div>
      <Separator className="my-4" />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
