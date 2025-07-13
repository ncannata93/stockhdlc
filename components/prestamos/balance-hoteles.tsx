"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Scale, TrendingUp, TrendingDown, Eye, AlertCircle, Cloud, WifiOff, Database, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  obtenerBalanceHoteles,
  verificarConexion,
  verificarTablaPrestamons,
  formatearMonto,
  type BalanceHotel,
} from "@/lib/prestamos-supabase"

interface BalanceHotelesProps {
  onActualizar?: () => void
}

export function BalanceHoteles({ onActualizar }: BalanceHotelesProps) {
  const { toast } = useToast()
  const [balances, setBalances] = useState<BalanceHotel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [tablaExiste, setTablaExiste] = useState(false)
  const [hotelSeleccionado, setHotelSeleccionado] = useState<BalanceHotel | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [conexion, tabla] = await Promise.all([verificarConexion(), verificarTablaPrestamons()])
        setConectado(conexion.conectado)
        setTablaExiste(tabla.existe)

        if (conexion.conectado && tabla.existe) {
          setIsLoading(true)
          const balanceData = await obtenerBalanceHoteles()
          setBalances(balanceData)
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setConectado(false)
        setTablaExiste(false)
        toast({
          title: "Error al cargar balance",
          description: "No se pudo cargar el balance de hoteles",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    cargarDatos()
  }, [])

  const actualizarBalance = async () => {
    if (!conectado || !tablaExiste) return

    setIsLoading(true)
    try {
      const balanceData = await obtenerBalanceHoteles()
      setBalances(balanceData)
      toast({
        title: "✅ Balance actualizado",
        description: "El balance de hoteles ha sido actualizado",
      })
      onActualizar?.()
    } catch (error) {
      console.error("Error al actualizar balance:", error)
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar el balance",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const estadoConexion = () => {
    if (!conectado) {
      return (
        <div className="flex items-center gap-1">
          <WifiOff className="h-4 w-4 text-red-600" />
          <span className="text-xs text-red-600">Sin conexión</span>
        </div>
      )
    }

    if (!tablaExiste) {
      return (
        <div className="flex items-center gap-1">
          <Database className="h-4 w-4 text-orange-600" />
          <span className="text-xs text-orange-600">Tabla no existe</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1">
        <Cloud className="h-4 w-4 text-green-600" />
        <span className="text-xs text-green-600">Supabase OK</span>
      </div>
    )
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600"
    if (balance < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (balance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Scale className="h-4 w-4 text-gray-600" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-purple-600" />
          Balance de Hoteles
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={actualizarBalance}
              disabled={isLoading || !conectado || !tablaExiste}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            {estadoConexion()}
          </div>
        </CardTitle>
        <CardDescription>
          Balance neto de préstamos entre hoteles ({balances.length} hoteles con transacciones)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!conectado && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Sin conexión a Supabase. No se puede cargar el balance.</AlertDescription>
          </Alert>
        )}

        {conectado && !tablaExiste && (
          <Alert variant="destructive" className="mb-4">
            <Database className="h-4 w-4" />
            <AlertDescription>
              La tabla 'prestamos' no existe en Supabase. Ejecuta el script 'create-prestamos-table-complete.sql'
              primero.
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel</TableHead>
                <TableHead>Acreedor</TableHead>
                <TableHead>Deudor</TableHead>
                <TableHead>Balance Neto</TableHead>
                <TableHead>Transacciones</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Calculando balance...
                    </div>
                  </TableCell>
                </TableRow>
              ) : balances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {conectado && tablaExiste
                      ? "No hay transacciones para mostrar balance"
                      : "No hay datos disponibles"}
                  </TableCell>
                </TableRow>
              ) : (
                balances.map((balance) => (
                  <TableRow key={balance.hotel}>
                    <TableCell className="font-medium">{balance.hotel}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatearMonto(balance.acreedor)}</TableCell>
                    <TableCell className="text-red-600 font-medium">{formatearMonto(balance.deudor)}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 font-bold ${getBalanceColor(balance.balance)}`}>
                        {getBalanceIcon(balance.balance)}
                        {formatearMonto(balance.balance)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{balance.transacciones}</Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setHotelSeleccionado(balance)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalle de Balance - {balance.hotel}</DialogTitle>
                            <DialogDescription>Desglose completo de las relaciones financieras</DialogDescription>
                          </DialogHeader>
                          {hotelSeleccionado && (
                            <div className="space-y-6">
                              {/* Resumen */}
                              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Total Acreedor</p>
                                  <p className="text-lg font-bold text-green-600">
                                    {formatearMonto(hotelSeleccionado.acreedor)}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Total Deudor</p>
                                  <p className="text-lg font-bold text-red-600">
                                    {formatearMonto(hotelSeleccionado.deudor)}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">Balance Neto</p>
                                  <p className={`text-lg font-bold ${getBalanceColor(hotelSeleccionado.balance)}`}>
                                    {formatearMonto(hotelSeleccionado.balance)}
                                  </p>
                                </div>
                              </div>

                              {/* Acreedores */}
                              {hotelSeleccionado.acreedorDe.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-green-600 mb-2">
                                    Es acreedor de ({hotelSeleccionado.acreedorDe.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {hotelSeleccionado.acreedorDe.map((relacion, index) => (
                                      <div
                                        key={index}
                                        className="flex justify-between items-center p-2 bg-green-50 rounded"
                                      >
                                        <span className="font-medium">{relacion.hotel}</span>
                                        <span className="text-green-600 font-bold">
                                          {formatearMonto(relacion.monto)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Deudores */}
                              {hotelSeleccionado.deudorDe.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-red-600 mb-2">
                                    Es deudor de ({hotelSeleccionado.deudorDe.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {hotelSeleccionado.deudorDe.map((relacion, index) => (
                                      <div
                                        key={index}
                                        className="flex justify-between items-center p-2 bg-red-50 rounded"
                                      >
                                        <span className="font-medium">{relacion.hotel}</span>
                                        <span className="text-red-600 font-bold">{formatearMonto(relacion.monto)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {hotelSeleccionado.acreedorDe.length === 0 && hotelSeleccionado.deudorDe.length === 0 && (
                                <div className="text-center py-4 text-gray-500">
                                  No hay relaciones de deuda pendientes
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {conectado && tablaExiste && balances.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <p className="text-center">Balance calculado con compensación automática entre hoteles</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
