"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Clock, CheckCircle } from "lucide-react"
import { IngresoRapido } from "@/components/prestamos/ingreso-rapido"
import { IngresoManual } from "@/components/prestamos/ingreso-manual"
import { ListaTransacciones } from "@/components/prestamos/lista-transacciones"
import { BalanceHoteles } from "@/components/prestamos/balance-hoteles"
import { obtenerEstadisticas, formatearMonto } from "@/lib/prestamos-db"
import type { EstadisticasPrestamos } from "@/lib/prestamos-types"

export default function PrestamosClientPage() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasPrestamos | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      setLoading(true)
      const stats = await obtenerEstadisticas()
      setEstadisticas(stats)
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransaccionCreada = () => {
    cargarEstadisticas()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header con estadísticas */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Préstamos</h1>
          <p className="text-gray-600">Sistema de control de préstamos entre hoteles</p>
        </div>

        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Préstamos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.totalPrestamos}</div>
                <p className="text-xs text-muted-foreground">{formatearMonto(estadisticas.montoTotal)} en total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{estadisticas.prestamosActivos}</div>
                <p className="text-xs text-muted-foreground">Por cobrar/pagar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{estadisticas.prestamosPagados}</div>
                <p className="text-xs text-muted-foreground">Completados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatearMonto(estadisticas.promedioMonto)}</div>
                <p className="text-xs text-muted-foreground">Por transacción</p>
              </CardContent>
            </Card>
          </div>
        )}
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
          <Card>
            <CardHeader>
              <CardTitle>Ingreso Rápido</CardTitle>
              <CardDescription>Registra préstamos y devoluciones de forma rápida</CardDescription>
            </CardHeader>
            <CardContent>
              <IngresoRapido onTransaccionCreada={handleTransaccionCreada} />
            </CardContent>
          </Card>
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
          <ListaTransacciones onTransaccionActualizada={handleTransaccionCreada} />
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <BalanceHoteles />
        </TabsContent>
      </Tabs>
    </div>
  )
}
