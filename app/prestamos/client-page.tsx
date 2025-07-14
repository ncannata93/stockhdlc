"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IngresoRapido } from "@/components/prestamos/ingreso-rapido"
import { IngresoManual } from "@/components/prestamos/ingreso-manual"
import { ListaTransacciones } from "@/components/prestamos/lista-transacciones"
import { BalanceHoteles } from "@/components/prestamos/balance-hoteles"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Cloud, Info } from "lucide-react"

export default function PrestamosClientPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePrestamoGuardado = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl">
      {/* Header optimizado para móvil */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              Gestión de Préstamos
              <Cloud className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Sistema de préstamos entre hoteles conectado a Supabase
            </p>
          </div>
        </div>

        {/* Información sobre Supabase - más compacta en móvil */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Conectado a Supabase:</strong> Todos los datos se guardan automáticamente en la nube y están
            sincronizados entre dispositivos.
          </AlertDescription>
        </Alert>
      </div>

      {/* Tabs optimizados para móvil */}
      <Tabs defaultValue="ingreso-rapido" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
          <TabsTrigger
            value="ingreso-rapido"
            className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
          >
            <span className="hidden sm:inline">Ingreso Rápido</span>
            <span className="sm:hidden">Rápido</span>
          </TabsTrigger>
          <TabsTrigger
            value="ingreso-manual"
            className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
          >
            <span className="hidden sm:inline">Ingreso Manual</span>
            <span className="sm:hidden">Manual</span>
          </TabsTrigger>
          <TabsTrigger
            value="transacciones"
            className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
          >
            <span className="hidden sm:inline">Transacciones</span>
            <span className="sm:hidden">Lista</span>
          </TabsTrigger>
          <TabsTrigger
            value="balance"
            className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800"
          >
            Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingreso-rapido" className="mt-4">
          <IngresoRapido onPrestamosCreados={handlePrestamoGuardado} />
        </TabsContent>

        <TabsContent value="ingreso-manual" className="mt-4">
          <IngresoManual onPrestamoCreado={handlePrestamoGuardado} />
        </TabsContent>

        <TabsContent value="transacciones" className="mt-4">
          <ListaTransacciones refreshTrigger={refreshTrigger} onTransaccionActualizada={handlePrestamoGuardado} />
        </TabsContent>

        <TabsContent value="balance" className="mt-4">
          <BalanceHoteles refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
