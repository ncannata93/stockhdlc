"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Scale,
  ArrowLeftRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  obtenerBalanceHoteles,
  obtenerPrestamos,
  actualizarPrestamo,
  crearPrestamo,
  formatearMonto,
  type BalanceHotel,
  type Prestamo,
} from "@/lib/prestamos-supabase"

interface CompensarSaldosProps {
  onCompensacionRealizada?: () => void
  refreshTrigger?: number
}

interface DeudaEntreHoteles {
  deudor: string
  acreedor: string
  monto: number
  prestamosIds: string[]
}

export function CompensarSaldos({ onCompensacionRealizada, refreshTrigger }: CompensarSaldosProps) {
  const { toast } = useToast()
  const [balances, setBalances] = useState<BalanceHotel[]>([])
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deudas, setDeudas] = useState<DeudaEntreHoteles[]>([])
  const [compensacionDialogOpen, setCompensacionDialogOpen] = useState(false)
  const [deudaSeleccionada, setDeudaSeleccionada] = useState<DeudaEntreHoteles | null>(null)
  const [montoCompensar, setMontoCompensar] = useState("")
  const [notasCompensacion, setNotasCompensacion] = useState("")
  const [procesando, setProcesando] = useState(false)

  // Cargar datos
  useEffect(() => {
    cargarDatos()
  }, [refreshTrigger])

  const cargarDatos = async () => {
    setIsLoading(true)
    try {
      const [balanceData, prestamosData] = await Promise.all([
        obtenerBalanceHoteles(),
        obtenerPrestamos(),
      ])
      setBalances(balanceData)
      setPrestamos(prestamosData)
      calcularDeudas(prestamosData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      toast({
        title: "Error al cargar datos",
        description: "No se pudieron cargar los balances",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calcularDeudas = (prestamosData: Prestamo[]) => {
    // Solo considerar prestamos pendientes
    const prestamosPendientes = prestamosData.filter((p) => p.estado === "pendiente")
    
    // Agrupar deudas por par de hoteles
    const deudasMap = new Map<string, DeudaEntreHoteles>()

    prestamosPendientes.forEach((prestamo) => {
      // El hotel_destino debe al hotel_origen
      const key = `${prestamo.hotel_destino}->${prestamo.hotel_origen}`
      
      if (deudasMap.has(key)) {
        const deuda = deudasMap.get(key)!
        deuda.monto += prestamo.valor
        deuda.prestamosIds.push(prestamo.id)
      } else {
        deudasMap.set(key, {
          deudor: prestamo.hotel_destino,
          acreedor: prestamo.hotel_origen,
          monto: prestamo.valor,
          prestamosIds: [prestamo.id],
        })
      }
    })

    // Convertir a array y ordenar por monto
    const deudasArray = Array.from(deudasMap.values()).sort((a, b) => b.monto - a.monto)
    setDeudas(deudasArray)
  }

  const abrirDialogoCompensacion = (deuda: DeudaEntreHoteles) => {
    setDeudaSeleccionada(deuda)
    setMontoCompensar(deuda.monto.toString())
    setNotasCompensacion("")
    setCompensacionDialogOpen(true)
  }

  const realizarCompensacion = async () => {
    if (!deudaSeleccionada) return

    const monto = parseFloat(montoCompensar)
    if (isNaN(monto) || monto <= 0) {
      toast({
        title: "Monto invalido",
        description: "Ingresa un monto valido mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (monto > deudaSeleccionada.monto) {
      toast({
        title: "Monto excede la deuda",
        description: `El monto maximo a compensar es ${formatearMonto(deudaSeleccionada.monto)}`,
        variant: "destructive",
      })
      return
    }

    setProcesando(true)
    try {
      // Si el monto es igual a la deuda total, marcar todos los prestamos como pagados
      if (monto >= deudaSeleccionada.monto) {
        // Marcar todos los prestamos como pagados
        for (const prestamoId of deudaSeleccionada.prestamosIds) {
          await actualizarPrestamo(prestamoId, { 
            estado: "pagado",
          })
        }
        
        toast({
          title: "Compensacion completa realizada",
          description: `Se compensaron ${formatearMonto(monto)} entre ${deudaSeleccionada.deudor} y ${deudaSeleccionada.acreedor}. ${deudaSeleccionada.prestamosIds.length} transaccion(es) marcadas como pagadas.`,
        })
      } else {
        // Compensacion parcial - marcar prestamos hasta cubrir el monto
        let montoRestante = monto
        const prestamosOrdenados = prestamos
          .filter((p) => deudaSeleccionada.prestamosIds.includes(p.id))
          .sort((a, b) => a.valor - b.valor) // Ordenar por valor ascendente para compensar los mas pequenos primero

        for (const prestamo of prestamosOrdenados) {
          if (montoRestante <= 0) break

          if (prestamo.valor <= montoRestante) {
            // Marcar como pagado completamente
            await actualizarPrestamo(prestamo.id, { estado: "pagado" })
            montoRestante -= prestamo.valor
          } else {
            // Compensacion parcial - crear una transaccion de compensacion inversa
            // Marcar el prestamo original como pagado
            await actualizarPrestamo(prestamo.id, { estado: "pagado" })
            
            // Crear nuevo prestamo por la diferencia
            const diferencia = prestamo.valor - montoRestante
            await crearPrestamo({
              fecha: new Date().toISOString().split("T")[0],
              responsable: "Compensacion Parcial",
              hotel_origen: prestamo.hotel_origen,
              hotel_destino: prestamo.hotel_destino,
              producto: `Saldo pendiente de: ${prestamo.producto}`,
              cantidad: prestamo.cantidad,
              valor: diferencia,
              estado: "pendiente",
            })
            montoRestante = 0
          }
        }

        toast({
          title: "Compensacion parcial realizada",
          description: `Se compensaron ${formatearMonto(monto)}. El saldo restante es ${formatearMonto(deudaSeleccionada.monto - monto)}`,
        })
      }

      setCompensacionDialogOpen(false)
      setDeudaSeleccionada(null)
      setMontoCompensar("")
      setNotasCompensacion("")
      
      // Recargar datos
      await cargarDatos()
      onCompensacionRealizada?.()
    } catch (error) {
      console.error("Error al realizar compensacion:", error)
      toast({
        title: "Error al compensar",
        description: "No se pudo realizar la compensacion",
        variant: "destructive",
      })
    } finally {
      setProcesando(false)
    }
  }

  const compensarTodo = async () => {
    if (deudas.length === 0) {
      toast({
        title: "Sin deudas pendientes",
        description: "No hay deudas para compensar",
      })
      return
    }

    setProcesando(true)
    try {
      // Obtener todos los prestamos pendientes
      const prestamosPendientes = prestamos.filter((p) => p.estado === "pendiente")
      
      // Marcar todos como pagados
      for (const prestamo of prestamosPendientes) {
        await actualizarPrestamo(prestamo.id, { estado: "pagado" })
      }

      toast({
        title: "Todos los saldos compensados",
        description: `Se marcaron ${prestamosPendientes.length} transacciones como pagadas`,
      })

      await cargarDatos()
      onCompensacionRealizada?.()
    } catch (error) {
      console.error("Error al compensar todo:", error)
      toast({
        title: "Error al compensar",
        description: "No se pudieron compensar todos los saldos",
        variant: "destructive",
      })
    } finally {
      setProcesando(false)
    }
  }

  const totalDeudas = deudas.reduce((sum, d) => sum + d.monto, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
          Compensar Saldos
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cargarDatos}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Registra cuando los hoteles compensan sus deudas entre si
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Total en Deudas</p>
                  <p className="text-2xl font-bold text-indigo-700">{formatearMonto(totalDeudas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm text-amber-600 font-medium">Relaciones Activas</p>
                  <p className="text-2xl font-bold text-amber-700">{deudas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Hoteles Involucrados</p>
                  <p className="text-2xl font-bold text-emerald-700">{balances.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boton para compensar todo */}
        {deudas.length > 0 && (
          <Alert className="border-indigo-200 bg-indigo-50">
            <Scale className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Hay <strong>{deudas.length}</strong> relaciones de deuda pendientes por un total de{" "}
                <strong>{formatearMonto(totalDeudas)}</strong>
              </span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    Compensar Todo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Compensacion Total</DialogTitle>
                    <DialogDescription>
                      Esta accion marcara todas las transacciones pendientes como pagadas.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Se compensaran <strong>{formatearMonto(totalDeudas)}</strong> en{" "}
                        <strong>{prestamos.filter((p) => p.estado === "pendiente").length}</strong> transacciones.
                        Esta accion no se puede deshacer.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={compensarTodo}
                      disabled={procesando}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {procesando ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Confirmar Compensacion"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de deudas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="ml-2">Cargando deudas...</span>
          </div>
        ) : deudas.length === 0 ? (
          <Alert className="border-emerald-200 bg-emerald-50">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">
              No hay deudas pendientes entre hoteles. Todos los saldos estan compensados.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Deudas Pendientes</h3>
            {deudas.map((deuda, index) => (
              <Card key={index} className="border-l-4 border-l-indigo-500">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="font-medium">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {deuda.deudor}
                        </Badge>
                        <span className="text-gray-500">debe a</span>
                        <Badge variant="default" className="font-medium bg-emerald-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {deuda.acreedor}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">
                          {formatearMonto(deuda.monto)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {deuda.prestamosIds.length} transaccion(es)
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => abrirDialogoCompensacion(deuda)}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Compensar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de compensacion individual */}
        <Dialog open={compensacionDialogOpen} onOpenChange={setCompensacionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compensar Deuda</DialogTitle>
              <DialogDescription>
                {deudaSeleccionada && (
                  <>
                    Registrar compensacion de {deudaSeleccionada.deudor} a {deudaSeleccionada.acreedor}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {deudaSeleccionada && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Deuda Total:</span>
                    <span className="font-bold text-lg">{formatearMonto(deudaSeleccionada.monto)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Transacciones:</span>
                    <span className="font-medium">{deudaSeleccionada.prestamosIds.length}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monto">Monto a Compensar</Label>
                  <Input
                    id="monto"
                    type="number"
                    value={montoCompensar}
                    onChange={(e) => setMontoCompensar(e.target.value)}
                    placeholder="Ingresa el monto"
                  />
                  <p className="text-xs text-gray-500">
                    Maximo: {formatearMonto(deudaSeleccionada.monto)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas (opcional)</Label>
                  <Textarea
                    id="notas"
                    value={notasCompensacion}
                    onChange={(e) => setNotasCompensacion(e.target.value)}
                    placeholder="Ej: Pago en efectivo, transferencia, etc."
                    rows={2}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompensacionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={realizarCompensacion}
                disabled={procesando}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {procesando ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Realizar Compensacion"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
