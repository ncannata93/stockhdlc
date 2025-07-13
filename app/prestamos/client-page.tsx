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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Gestión de Préstamos
            <Cloud className="h-6 w-6 text-blue-600" />
          </h1>
          <p className="text-gray-600">Sistema de préstamos entre hoteles conectado a Supabase</p>
        </div>
      </div>

      {/* Información sobre Supabase */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Conectado a Supabase:</strong> Todos los datos se guardan automáticamente en la nube. Los préstamos
          están sincronizados entre todos los dispositivos y usuarios.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="ingreso-rapido" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ingreso-rapido">Ingreso Rápido</TabsTrigger>
          <TabsTrigger value="ingreso-manual">Ingreso Manual</TabsTrigger>
          <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
          <TabsTrigger value="balance">Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="ingreso-rapido">
          <IngresoRapido onPrestamoGuardado={handlePrestamoGuardado} />
        </TabsContent>

        <TabsContent value="ingreso-manual">
          <IngresoManual onPrestamoGuardado={handlePrestamoGuardado} />
        </TabsContent>

        <TabsContent value="transacciones">
          <ListaTransacciones refreshTrigger={refreshTrigger} onTransaccionActualizada={handlePrestamoGuardado} />
        </TabsContent>

        <TabsContent value="balance">
          <BalanceHoteles refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
