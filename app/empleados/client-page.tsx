"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LogOut, UserPlus, ClipboardList, Calendar, BarChart } from "lucide-react"
import EmpleadosInicio from "@/components/empleados/inicio"
import EmpleadosHistorial from "@/components/empleados/historial"
import EmpleadosAgregar from "@/components/empleados/agregar"
import EmpleadosCalendario from "@/components/empleados/calendario"
import EmpleadosResumen from "@/components/empleados/resumen"
import EmpleadosList from "@/components/empleados/empleados-list"

export default function EmpleadosClient() {
  const { signOut, session } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("inicio")

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Empleados</h1>
            <p className="text-gray-600">
              Usuario: {session?.username} | Rol: {session?.isAdmin ? "Administrador" : "Usuario"}
            </p>
          </div>
          <div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="inicio">Inicio</TabsTrigger>
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
          <TabsTrigger value="agregar">
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar
          </TabsTrigger>
          <TabsTrigger value="calendario">
            <Calendar className="h-4 w-4 mr-2" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="historial">
            <ClipboardList className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="resumen">
            <BarChart className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inicio" className="mt-6">
          <EmpleadosInicio />
        </TabsContent>

        <TabsContent value="empleados" className="mt-6">
          <EmpleadosList />
        </TabsContent>

        <TabsContent value="agregar" className="mt-6">
          <EmpleadosAgregar />
        </TabsContent>

        <TabsContent value="calendario" className="mt-6">
          <EmpleadosCalendario />
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <EmpleadosHistorial />
        </TabsContent>

        <TabsContent value="resumen" className="mt-6">
          <EmpleadosResumen />
        </TabsContent>
      </Tabs>
    </div>
  )
}
