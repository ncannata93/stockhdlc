"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Building2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { HOTELES } from "@/lib/prestamos-types"
import { useToast } from "@/hooks/use-toast"

interface Prestamo {
  id: string
  responsable: string
  hotel_origen: string
  hotel_destino: string
  producto: string
  cantidad: string
  valor: number
  fecha: string
  notas?: string
  created_at?: string
  updated_at?: string
}

interface BalanceHotel {
  hotel: string
  comoAcreedor: number // Dinero que le deben a este hotel (dinero que prestó)
  comoDeudor: number // Dinero que debe este hotel (dinero que recibió)
  balanceNeto: number // Diferencia (positivo = le deben, negativo = debe)
  transacciones: Prestamo[]
  estado: "equilibrado" | "acreedor" | "deudor"
}

interface BalanceHotelesProps {
  refreshTrigger?: number
}

export function BalanceHoteles({ refreshTrigger }: BalanceHotelesProps) {
  const { toast } = useToast()
  const [balances, setBalances] = useState<BalanceHotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hotelesExpandidos, setHotelesExpandidos] = useState<Set<string>>(new Set())

  const formatearMonto = (monto: number): string => {
    // Asegurar que monto sea un número válido
    const montoNumerico = typeof monto === "string" ? Number.parseFloat(monto) : monto
    if (isNaN(montoNumerico)) {
      return "$0"
    }

    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montoNumerico)
  }

  const calcularBalances = () => {
    try {
      setIsLoading(true)
      setError(null)

      // Cargar préstamos desde localStorage
      const prestamosData: Prestamo[] = JSON.parse(localStorage.getItem("prestamos_data") || "[]")

      // Inicializar balances para todos los hoteles
      const balancesMap = new Map<string, BalanceHotel>()

      HOTELES.forEach((hotel) => {
        balancesMap.set(hotel, {
          hotel,
          comoAcreedor: 0,
          comoDeudor: 0,
          balanceNeto: 0,
          transacciones: [],
          estado: "equilibrado",
        })
      })

      // Procesar cada préstamo
      prestamosData.forEach((prestamo) => {
        const valor = typeof prestamo.valor === "string" ? Number.parseFloat(prestamo.valor) : prestamo.valor
        if (isNaN(valor)) return

        const hotelOrigen = prestamo.hotel_origen // Hotel que presta (acreedor)
        const hotelDestino = prestamo.hotel_destino // Hotel que recibe (deudor)

        // El hotel origen presta dinero, por lo tanto es ACREEDOR
        if (balancesMap.has(hotelOrigen)) {
          const balance = balancesMap.get(hotelOrigen)!
          balance.comoAcreedor += valor // Le deben dinero
          balance.transacciones.push(prestamo)
        }

        // El hotel destino recibe dinero, por lo tanto es DEUDOR
        if (balancesMap.has(hotelDestino)) {
          const balance = balancesMap.get(hotelDestino)!
          balance.comoDeudor += valor // Debe dinero
          balance.transacciones.push(prestamo)
        }
      })

      // Calcular balance neto y estado para cada hotel
      const balancesArray = Array.from(balancesMap.values()).map((balance) => {
        balance.balanceNeto = balance.comoAcreedor - balance.comoDeudor

        if (Math.abs(balance.balanceNeto) < 0.01) {
          balance.estado = "equilibrado"
        } else if (balance.balanceNeto > 0) {
          balance.estado = "acreedor" // Le deben más de lo que debe
        } else {
          balance.estado = "deudor" // Debe más de lo que le deben
        }

        return balance
      })

      // Ordenar por balance neto (acreedores primero, luego equilibrados, luego deudores)
      balancesArray.sort((a, b) => {
        if (a.estado !== b.estado) {
          if (a.estado === "acreedor") return -1
          if (b.estado === "acreedor") return 1
          if (a.estado === "equilibrado") return -1
          if (b.estado === "equilibrado") return 1
        }
        return Math.abs(b.balanceNeto) - Math.abs(a.balanceNeto)
      })

      setBalances(balancesArray)
    } catch (error) {
      console.error("Error al calcular balances:", error)
      setError("Error al calcular los balances")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    calcularBalances()
  }, [refreshTrigger])

  const toggleHotelExpandido = (hotel: string) => {
    const nuevosExpandidos = new Set(hotelesExpandidos)
    if (nuevosExpandidos.has(hotel)) {
      nuevosExpandidos.delete(hotel)
    } else {
      nuevosExpandidos.add(hotel)
    }
    setHotelesExpandidos(nuevosExpandidos)
  }

  const exportarBalance = () => {
    try {
      const datos = balances.map((balance) => ({
        Hotel: balance.hotel,
        "Como Acreedor": formatearMonto(balance.comoAcreedor),
        "Como Deudor": formatearMonto(balance.comoDeudor),
        "Balance Neto": formatearMonto(balance.balanceNeto),
        Estado: balance.estado,
        "Cantidad Transacciones": balance.transacciones.length,
      }))

      const csv = [Object.keys(datos[0]).join(","), ...datos.map((fila) => Object.values(fila).join(","))].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `balance-hoteles-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Éxito",
        description: "Balance exportado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar el balance",
        variant: "destructive",
      })
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "acreedor":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <TrendingUp className="h-3 w-3 mr-1" />
            Acreedor
          </Badge>
        )
      case "deudor":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <TrendingDown className="h-3 w-3 mr-1" />
            Deudor
          </Badge>
        )
      case "equilibrado":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <Minus className="h-3 w-3 mr-1" />
            Equilibrado
          </Badge>
        )
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Balance Detallado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Calculando balances...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Balance Detallado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={calcularBalances} className="ml-4 bg-transparent">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Balance Detallado
            </CardTitle>
            <CardDescription>Balance neto entre hoteles (Acreedor - Deudor)</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportarBalance}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={calcularBalances}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {balances.map((balance) => (
            <Collapsible
              key={balance.hotel}
              open={hotelesExpandidos.has(balance.hotel)}
              onOpenChange={() => toggleHotelExpandido(balance.hotel)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    {hotelesExpandidos.has(balance.hotel) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">{balance.hotel}</span>
                    {getEstadoBadge(balance.estado)}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{balance.transacciones.length} transacciones</span>
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${
                          balance.balanceNeto > 0
                            ? "text-green-600"
                            : balance.balanceNeto < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {formatearMonto(balance.balanceNeto)}
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Card className="bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Como Acreedor</span>
                        </div>
                        <div className="text-2xl font-bold text-green-700 mt-2">
                          {formatearMonto(balance.comoAcreedor)}
                        </div>
                        <p className="text-xs text-green-600 mt-1">Dinero prestado a otros hoteles</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Como Deudor</span>
                        </div>
                        <div className="text-2xl font-bold text-red-700 mt-2">{formatearMonto(balance.comoDeudor)}</div>
                        <p className="text-xs text-red-600 mt-1">Dinero recibido de otros hoteles</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Balance Neto</span>
                        </div>
                        <div
                          className={`text-2xl font-bold mt-2 ${
                            balance.balanceNeto > 0
                              ? "text-green-700"
                              : balance.balanceNeto < 0
                                ? "text-red-700"
                                : "text-gray-700"
                          }`}
                        >
                          {formatearMonto(balance.balanceNeto)}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Diferencia total</p>
                      </CardContent>
                    </Card>
                  </div>

                  {balance.transacciones.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>No hay transacciones registradas para este hotel</p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Transacciones Relacionadas:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {balance.transacciones.map((transaccion) => (
                          <div
                            key={transaccion.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {transaccion.hotel_origen} → {transaccion.hotel_destino}
                              </span>
                              <span className="text-xs text-gray-500">({transaccion.producto})</span>
                              {transaccion.hotel_origen === balance.hotel && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  Prestó
                                </Badge>
                              )}
                              {transaccion.hotel_destino === balance.hotel && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                  Recibió
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{formatearMonto(transaccion.valor)}</span>
                              <span className="text-xs text-gray-500">{transaccion.fecha}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
