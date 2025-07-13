"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Building2, TrendingUp, TrendingDown, DollarSign, RefreshCw } from "lucide-react"
import { obtenerBalanceHoteles, formatearMonto } from "@/lib/prestamos-db"
import type { BalanceHotel } from "@/lib/prestamos-types"

interface BalanceHotelesProps {
  actualizarTrigger?: number
}

export function BalanceHoteles({ actualizarTrigger }: BalanceHotelesProps) {
  const [balances, setBalances] = useState<BalanceHotel[]>([])
  const [cargando, setCargando] = useState(true)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  const cargarBalances = async () => {
    setCargando(true)
    try {
      const data = await obtenerBalanceHoteles()
      setBalances(data)
    } catch (error) {
      console.error("Error al cargar balances:", error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarBalances()
  }, [actualizarTrigger])

  const toggleExpandido = (hotel: string) => {
    const nuevosExpandidos = new Set(expandidos)
    if (nuevosExpandidos.has(hotel)) {
      nuevosExpandidos.delete(hotel)
    } else {
      nuevosExpandidos.add(hotel)
    }
    setExpandidos(nuevosExpandidos)
  }

  const obtenerColorBalance = (balance: number) => {
    if (balance > 0) return "text-green-600"
    if (balance < 0) return "text-red-600"
    return "text-gray-600"
  }

  const obtenerIconoBalance = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (balance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <DollarSign className="h-4 w-4 text-gray-600" />
  }

  const calcularProgreso = (monto: number, maxMonto: number) => {
    if (maxMonto === 0) return 0
    return Math.min((monto / maxMonto) * 100, 100)
  }

  if (cargando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Balance de Hoteles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Calculando balances compensados...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Balance de Hoteles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay transacciones registradas</p>
            <p className="text-sm">Los balances aparecerán cuando agregues préstamos</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxMonto = Math.max(...balances.map((b) => Math.max(b.acreedor, b.deudor)))
  const totalTransacciones = balances.reduce((sum, b) => sum + b.transacciones, 0)
  const montoTotalCirculacion = balances.reduce((sum, b) => sum + b.acreedor, 0)

  return (
    <div className="space-y-6">
      {/* Resumen con compensación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumen de Balance Compensado
          </CardTitle>
          <CardDescription>
            Los montos mostrados son netos después de compensar deudas mutuas entre hoteles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{balances.length}</div>
              <div className="text-sm text-blue-700">Hoteles con Actividad</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalTransacciones}</div>
              <div className="text-sm text-green-700">Transacciones Totales</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatearMonto(montoTotalCirculacion)}</div>
              <div className="text-sm text-purple-700">Monto Neto en Circulación</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance detallado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Balance Compensado por Hotel
              </CardTitle>
              <CardDescription>Montos netos después de compensar deudas cruzadas entre hoteles</CardDescription>
            </div>
            <Button onClick={cargarBalances} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {balances.map((balance) => (
              <Collapsible key={balance.hotel}>
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto hover:bg-gray-50"
                      onClick={() => toggleExpandido(balance.hotel)}
                    >
                      <div className="flex items-center gap-3">
                        {obtenerIconoBalance(balance.balance)}
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">{balance.hotel}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{balance.transacciones} transacciones</span>
                            <span>•</span>
                            <span className={obtenerColorBalance(balance.balance)}>
                              Balance neto: {formatearMonto(balance.balance)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={balance.balance > 0 ? "default" : balance.balance < 0 ? "destructive" : "secondary"}
                          className="text-sm px-3 py-1"
                        >
                          {balance.balance > 0 ? "ACREEDOR NETO" : balance.balance < 0 ? "DEUDOR NETO" : "EQUILIBRADO"}
                        </Badge>
                        {expandidos.has(balance.hotel) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 bg-gray-50 border-t">
                      <div className="space-y-4 pt-4">
                        {/* Indicadores visuales */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-700 font-medium">Le deben (neto)</span>
                              <span className="font-bold text-green-700">{formatearMonto(balance.acreedor)}</span>
                            </div>
                            <Progress
                              value={calcularProgreso(balance.acreedor, maxMonto)}
                              className="h-3 bg-green-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-red-700 font-medium">Debe (neto)</span>
                              <span className="font-bold text-red-700">{formatearMonto(balance.deudor)}</span>
                            </div>
                            <Progress value={calcularProgreso(balance.deudor, maxMonto)} className="h-3 bg-red-100" />
                          </div>
                        </div>

                        {/* Relaciones netas como acreedor */}
                        {balance.acreedorDe.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-green-700 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Le deben (después de compensación):
                            </h4>
                            <div className="space-y-2">
                              {balance.acreedorDe.map((relacion) => (
                                <div
                                  key={relacion.hotel}
                                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">{relacion.hotel}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-green-700">{formatearMonto(relacion.monto)}</div>
                                    <div className="text-xs text-green-600">Monto neto</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Relaciones netas como deudor */}
                        {balance.deudorDe.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-red-700 flex items-center gap-2">
                              <TrendingDown className="h-4 w-4" />
                              Debe (después de compensación):
                            </h4>
                            <div className="space-y-2">
                              {balance.deudorDe.map((relacion) => (
                                <div
                                  key={relacion.hotel}
                                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-red-600" />
                                    <span className="font-medium">{relacion.hotel}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-red-700">{formatearMonto(relacion.monto)}</div>
                                    <div className="text-xs text-red-600">Monto neto</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mensaje si no hay relaciones netas */}
                        {balance.acreedorDe.length === 0 && balance.deudorDe.length === 0 && (
                          <div className="text-center py-4 text-gray-500 bg-gray-100 rounded-lg">
                            <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="font-medium">Sin deudas netas pendientes</p>
                            <p className="text-sm">Todas las deudas han sido compensadas</p>
                          </div>
                        )}

                        {/* Resumen final */}
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Balance Final:</span>
                            <div className="text-right">
                              <div className={`text-xl font-bold ${obtenerColorBalance(balance.balance)}`}>
                                {balance.balance >= 0 ? "+" : ""}
                                {formatearMonto(balance.balance)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {balance.balance > 0
                                  ? "Le deben más de lo que debe"
                                  : balance.balance < 0
                                    ? "Debe más de lo que le deben"
                                    : "Cuentas equilibradas"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
