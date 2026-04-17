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
import { Scale, TrendingUp, TrendingDown, Eye, AlertCircle, Cloud, WifiOff, Database, RefreshCw, Download, Clock, CheckCircle2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as XLSX from "xlsx"
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
  refreshTrigger?: number
}

export function BalanceHoteles({ onActualizar, refreshTrigger }: BalanceHotelesProps) {
  const { toast } = useToast()
  const [balancesPendientes, setBalancesPendientes] = useState<BalanceHotel[]>([])
  const [balancesPagados, setBalancesPagados] = useState<BalanceHotel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [tablaExiste, setTablaExiste] = useState(false)
  const [hotelSeleccionado, setHotelSeleccionado] = useState<BalanceHotel | null>(null)
  const [tabActivo, setTabActivo] = useState<"pendiente" | "pagado">("pendiente")

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [conexion, tabla] = await Promise.all([verificarConexion(), verificarTablaPrestamons()])
        setConectado(conexion.conectado)
        setTablaExiste(tabla.existe)

        if (conexion.conectado && tabla.existe) {
          setIsLoading(true)
          const [pendientes, pagados] = await Promise.all([
            obtenerBalanceHoteles("pendiente"),
            obtenerBalanceHoteles("pagado")
          ])
          setBalancesPendientes(pendientes)
          setBalancesPagados(pagados)
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
  }, [refreshTrigger])

  const actualizarBalance = async () => {
    if (!conectado || !tablaExiste) return

    setIsLoading(true)
    try {
      const [pendientes, pagados] = await Promise.all([
        obtenerBalanceHoteles("pendiente"),
        obtenerBalanceHoteles("pagado")
      ])
      setBalancesPendientes(pendientes)
      setBalancesPagados(pagados)
      toast({
        title: "Balance actualizado",
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
  
  // Obtener balances actuales segun el tab
  const balances = tabActivo === "pendiente" ? balancesPendientes : balancesPagados

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

  const exportarExcel = () => {
    if (balances.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay datos para exportar",
        variant: "destructive",
      })
      return
    }

    // Hoja 1: Resumen de Balance
    const resumenData = balances.map((b) => ({
      Hotel: b.hotel,
      "Total Acreedor": b.acreedor,
      "Total Deudor": b.deudor,
      "Balance Neto": b.balance,
      Estado: b.balance > 0 ? "A Favor" : b.balance < 0 ? "En Contra" : "Equilibrado",
      Transacciones: b.transacciones,
    }))

    // Hoja 2: Detalle de Relaciones
    const detalleData: Array<{
      Hotel: string
      Tipo: string
      "Hotel Relacionado": string
      Monto: number
    }> = []

    balances.forEach((b) => {
      b.acreedorDe.forEach((rel) => {
        detalleData.push({
          Hotel: b.hotel,
          Tipo: "Es Acreedor de",
          "Hotel Relacionado": rel.hotel,
          Monto: rel.monto,
        })
      })
      b.deudorDe.forEach((rel) => {
        detalleData.push({
          Hotel: b.hotel,
          Tipo: "Es Deudor de",
          "Hotel Relacionado": rel.hotel,
          Monto: rel.monto,
        })
      })
    })

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()

    // Agregar hoja de resumen
    const wsResumen = XLSX.utils.json_to_sheet(resumenData)
    // Ajustar ancho de columnas
    wsResumen["!cols"] = [
      { wch: 20 }, // Hotel
      { wch: 15 }, // Total Acreedor
      { wch: 15 }, // Total Deudor
      { wch: 15 }, // Balance Neto
      { wch: 12 }, // Estado
      { wch: 14 }, // Transacciones
    ]
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Balance")

    // Agregar hoja de detalle si hay datos
    if (detalleData.length > 0) {
      const wsDetalle = XLSX.utils.json_to_sheet(detalleData)
      wsDetalle["!cols"] = [
        { wch: 20 }, // Hotel
        { wch: 15 }, // Tipo
        { wch: 20 }, // Hotel Relacionado
        { wch: 15 }, // Monto
      ]
      XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle Relaciones")
    }

    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split("T")[0]
    const nombreArchivo = `Balance_Hoteles_${fecha}.xlsx`

    // Generar el archivo como array buffer y crear blob para descarga
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    
    // Crear link de descarga y ejecutar
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Archivo exportado",
      description: `Se descargo ${nombreArchivo}`,
    })
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
              onClick={exportarExcel}
              disabled={isLoading || !conectado || !tablaExiste || balances.length === 0}
              title="Descargar Excel"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={actualizarBalance}
              disabled={isLoading || !conectado || !tablaExiste}
              title="Actualizar"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            {estadoConexion()}
          </div>
        </CardTitle>
        <CardDescription>
          Balance neto de prestamos entre hoteles
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

        {/* Resumen rapido */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{balancesPendientes.length}</p>
            <p className="text-xs text-orange-600">
              {balancesPendientes.reduce((sum, b) => sum + Math.abs(b.balance), 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" })} en deudas activas
            </p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Compensados</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{balancesPagados.length}</p>
            <p className="text-xs text-green-600">
              {balancesPagados.reduce((sum, b) => sum + Math.abs(b.balance), 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" })} ya saldados
            </p>
          </div>
        </div>

        {/* Tabs para filtrar */}
        <Tabs value={tabActivo} onValueChange={(v) => setTabActivo(v as "pendiente" | "pagado")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pendiente" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
              <Clock className="h-4 w-4 mr-2" />
              Pendientes ({balancesPendientes.length})
            </TabsTrigger>
            <TabsTrigger value="pagado" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Compensados ({balancesPagados.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
                      ? tabActivo === "pendiente" 
                        ? "No hay deudas pendientes - todo esta compensado" 
                        : "No hay transacciones compensadas aun"
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

        {conectado && tablaExiste && (
          <div className="mt-4 text-sm text-gray-600">
            <p className="text-center">
              {tabActivo === "pendiente" 
                ? "Mostrando deudas pendientes de compensar" 
                : "Mostrando transacciones ya compensadas/pagadas"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
