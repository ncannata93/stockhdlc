"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IngresoRapido } from "@/components/prestamos/ingreso-rapido"
import { IngresoManual } from "@/components/prestamos/ingreso-manual"
import { ListaTransacciones } from "@/components/prestamos/lista-transacciones"
import { BalanceHoteles } from "@/components/prestamos/balance-hoteles"

export default function PrestamosClientPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTransaccionCreada = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header simplificado */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Préstamos</h1>
          <p className="text-gray-600">Sistema de control de préstamos entre hoteles</p>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="rapido" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rapido">Ingreso Rápido</TabsTrigger>
          <TabsTrigger value="manual">Ingreso Manual</TabsTrigger>
          <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
          <TabsTrigger value="balance">Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="rapido" className="space-y-4">
          <IngresoRapido onPrestamoCreado={handleTransaccionCreada} />
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingreso Manual</CardTitle>
              <CardDescription>Registra préstamos con información detallada</CardDescription>
            </CardHeader>
            <CardContent>
              <IngresoManual onTransaccionCreada={handleTransaccionCreada} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacciones" className="space-y-4">
          <ListaTransacciones key={refreshKey} onTransaccionActualizada={handleTransaccionCreada} />
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <BalanceHoteles key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
