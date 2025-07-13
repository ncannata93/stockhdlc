"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { obtenerBalanceHoteles, formatearMonto, exportarDatos } from "@/lib/prestamos-db"
import type { BalanceHotel } from "@/lib/prestamos-types"

export function BalanceHoteles() {
  const [balance, setBalance] = useState<BalanceHotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarBalance()
  }, [])

  const cargarBalance = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await obtenerBalanceHoteles()
      setBalance(data)
    } catch (err) {
      setError("Error al cargar el balance de hoteles")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = async () => {
    try {
      const datos = await exportarDatos()
      const blob = new Blob([datos], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `balance-hoteles-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error al exportar datos:", err)
    }
  }

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (balance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600"
    if (balance < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getBalanceBadge = (balance: number) => {
    if (balance > 0)
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Acreedor
        </Badge>
      )
    if (balance < 0)
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          Deudor
        </Badge>
      )
    return <Badge variant="outline">Equilibrado</Badge>
  }

  // Estadísticas generales
  const acreedores = balance.filter((h) => h.balance > 0).length
  const deudores = balance.filter((h) => h.balance < 0).length
  const equilibrados = balance.filter((h) => h.balance === 0).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={cargarBalance} className="mt-4">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (balance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Entre Hoteles</CardTitle>
          <CardDescription>No hay transacciones registradas entre hoteles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <p>Crea algunos préstamos para ver el balance entre hoteles</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Hoteles</CardDescription>
            <CardTitle className="text-2xl">{balance.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Acreedores</CardDescription>
            <CardTitle className="text-2xl text-green-600">{acreedores}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Deudores</CardDescription>
            <CardTitle className="text-2xl text-red-600">{deudores}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Equilibrados</CardDescription>
            <CardTitle className="text-2xl text-gray-600">{equilibrados}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Balance detallado */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Balance Detallado</CardTitle>
              <CardDescription>Balance neto entre hoteles (Acreedor - Deudor)</CardDescription>
            </div>
            <Button onClick={handleExportar} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {balance.map((hotel) => (
              <AccordionItem key={hotel.hotel} value={hotel.hotel}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-3">
                      {getBalanceIcon(hotel.balance)}
                      <span className="font-medium">{hotel.hotel}</span>
                      {getBalanceBadge(hotel.balance)}
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getBalanceColor(hotel.balance)}`}>
                        {formatearMonto(hotel.balance)}
                      </div>
                      <div className="text-sm text-gray-500">{hotel.transacciones} transacciones</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    {/* Resumen del hotel */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-700 font-medium">Como Acreedor</div>
                        <div className="text-lg font-bold text-green-800">{formatearMonto(hotel.acreedor)}</div>
                        <div className="text-xs text-green-600">Dinero prestado a otros hoteles</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-sm text-red-700 font-medium">Como Deudor</div>
                        <div className="text-lg font-bold text-red-800">{formatearMonto(hotel.deudor)}</div>
                        <div className="text-xs text-red-600">Dinero recibido de otros hoteles</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-blue-700 font-medium">Balance Neto</div>
                        <div className={`text-lg font-bold ${getBalanceColor(hotel.balance)}`}>
                          {formatearMonto(hotel.balance)}
                        </div>
                        <div className="text-xs text-blue-600">Diferencia total</div>
                      </div>
                    </div>

                    {/* Relaciones específicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Acreedor de */}
                      {hotel.acreedorDe.length > 0 && (
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Acreedor de:</h4>
                          <div className="space-y-2">
                            {hotel.acreedorDe.map((relacion) => (
                              <div
                                key={relacion.hotel}
                                className="flex justify-between items-center bg-green-50 p-2 rounded"
                              >
                                <span className="text-sm">{relacion.hotel}</span>
                                <div className="text-right">
                                  <div className="font-medium text-green-800">{formatearMonto(relacion.monto)}</div>
                                  <div className="text-xs text-green-600">{relacion.transacciones} transacciones</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deudor de */}
                      {hotel.deudorDe.length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Deudor de:</h4>
                          <div className="space-y-2">
                            {hotel.deudorDe.map((relacion) => (
                              <div
                                key={relacion.hotel}
                                className="flex justify-between items-center bg-red-50 p-2 rounded"
                              >
                                <span className="text-sm">{relacion.hotel}</span>
                                <div className="text-right">
                                  <div className="font-medium text-red-800">{formatearMonto(relacion.monto)}</div>
                                  <div className="text-xs text-red-600">{relacion.transacciones} transacciones</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mensaje si no hay relaciones */}
                    {hotel.acreedorDe.length === 0 && hotel.deudorDe.length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <p>No hay relaciones específicas registradas</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
