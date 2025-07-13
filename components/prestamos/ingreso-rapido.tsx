"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Zap, Upload, CheckCircle, AlertCircle, Info, Users, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { crearPrestamo } from "@/lib/prestamos-db"
import { HOTELES, RESPONSABLES } from "@/lib/prestamos-types"
import type { PrestamoInput } from "@/lib/prestamos-types"

interface IngresoRapidoProps {
  onPrestamosCreados?: () => void
}

interface PrestamoParseado {
  responsable: string
  hotel_origen: string
  hotel_destino: string
  producto: string
  cantidad: number
  monto: number
  linea: number
}

export function IngresoRapido({ onPrestamosCreados }: IngresoRapidoProps) {
  const { toast } = useToast()
  const [texto, setTexto] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [prestamosParseados, setPrestamosParseados] = useState<PrestamoParseado[]>([])
  const [errores, setErrores] = useState<string[]>([])
  const [mostrarVista, setMostrarVista] = useState<"entrada" | "revision">("entrada")

  const parsearLinea = (linea: string, numeroLinea: number): PrestamoParseado | string => {
    const partes = linea.split("|").map((p) => p.trim())

    if (partes.length !== 6) {
      return `Línea ${numeroLinea}: Formato incorrecto. Se esperan 6 campos separados por |`
    }

    const [responsable, hotelOrigen, hotelDestino, producto, cantidadStr, montoStr] = partes

    // Validaciones
    if (!responsable) return `Línea ${numeroLinea}: Responsable no puede estar vacío`
    if (!hotelOrigen) return `Línea ${numeroLinea}: Hotel que retira no puede estar vacío`
    if (!hotelDestino) return `Línea ${numeroLinea}: Hotel que recibe no puede estar vacío`
    if (!producto) return `Línea ${numeroLinea}: Producto no puede estar vacío`

    if (!HOTELES.includes(hotelOrigen)) {
      return `Línea ${numeroLinea}: Hotel "${hotelOrigen}" no existe. Hoteles disponibles: ${HOTELES.join(", ")}`
    }

    if (!HOTELES.includes(hotelDestino)) {
      return `Línea ${numeroLinea}: Hotel "${hotelDestino}" no existe. Hoteles disponibles: ${HOTELES.join(", ")}`
    }

    if (hotelOrigen === hotelDestino) {
      return `Línea ${numeroLinea}: Los hoteles no pueden ser iguales`
    }

    const cantidad = Number.parseInt(cantidadStr)
    if (isNaN(cantidad) || cantidad <= 0) {
      return `Línea ${numeroLinea}: Cantidad debe ser un número mayor a 0`
    }

    const monto = Number.parseInt(montoStr)
    if (isNaN(monto) || monto <= 0) {
      return `Línea ${numeroLinea}: Valor debe ser un número mayor a 0`
    }

    return {
      responsable,
      hotel_origen: hotelOrigen,
      hotel_destino: hotelDestino,
      producto,
      cantidad,
      monto,
      linea: numeroLinea,
    }
  }

  const procesarTexto = () => {
    if (!texto.trim()) {
      toast({
        title: "Error",
        description: "Ingresa al menos un préstamo",
        variant: "destructive",
      })
      return
    }

    const lineas = texto
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    const prestamosValidos: PrestamoParseado[] = []
    const erroresEncontrados: string[] = []

    lineas.forEach((linea, index) => {
      const resultado = parsearLinea(linea, index + 1)
      if (typeof resultado === "string") {
        erroresEncontrados.push(resultado)
      } else {
        prestamosValidos.push(resultado)
      }
    })

    setPrestamosParseados(prestamosValidos)
    setErrores(erroresEncontrados)

    if (erroresEncontrados.length === 0 && prestamosValidos.length > 0) {
      setMostrarVista("revision")
    } else if (erroresEncontrados.length > 0) {
      toast({
        title: "Errores encontrados",
        description: `Se encontraron ${erroresEncontrados.length} errores. Revisa el formato.`,
        variant: "destructive",
      })
    }
  }

  const confirmarPrestamos = async () => {
    setProcesando(true)
    let exitosos = 0
    let fallidos = 0

    try {
      for (const prestamo of prestamosParseados) {
        const prestamoInput: PrestamoInput = {
          hotel_origen: prestamo.hotel_origen,
          hotel_destino: prestamo.hotel_destino,
          monto: prestamo.monto,
          concepto: `${prestamo.producto} (${prestamo.cantidad} unidades)`,
          responsable: prestamo.responsable,
          notas: `Préstamo de ${prestamo.cantidad} ${prestamo.producto} por valor de $${prestamo.monto.toLocaleString()}. Responsable: ${prestamo.responsable}`,
        }

        const resultado = await crearPrestamo(prestamoInput)
        if (resultado) {
          exitosos++
        } else {
          fallidos++
        }
      }

      if (exitosos > 0) {
        toast({
          title: "¡Préstamos registrados!",
          description: `${exitosos} préstamos registrados exitosamente${fallidos > 0 ? `. ${fallidos} fallaron.` : ""}`,
        })

        // Limpiar formulario
        setTexto("")
        setPrestamosParseados([])
        setErrores([])
        setMostrarVista("entrada")

        if (onPrestamosCreados) {
          onPrestamosCreados()
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo registrar ningún préstamo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al procesar préstamos:", error)
      toast({
        title: "Error",
        description: "Error inesperado al procesar los préstamos",
        variant: "destructive",
      })
    } finally {
      setProcesando(false)
    }
  }

  if (mostrarVista === "revision") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Revisar Préstamos ({prestamosParseados.length})
          </CardTitle>
          <CardDescription>Confirma los datos antes de guardar todos los préstamos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-3">
            {prestamosParseados.map((prestamo, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">Préstamo #{index + 1}</Badge>
                  <span className="text-lg font-bold text-orange-600">${prestamo.monto.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Responsable:</span> {prestamo.responsable}
                  </div>
                  <div>
                    <span className="font-medium">Producto:</span> {prestamo.producto}
                  </div>
                  <div>
                    <span className="font-medium">Retira:</span>{" "}
                    <Badge className="bg-red-100 text-red-800">{prestamo.hotel_origen}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Recibe:</span>{" "}
                    <Badge className="bg-green-100 text-green-800">{prestamo.hotel_destino}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Cantidad:</span> {prestamo.cantidad}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={confirmarPrestamos}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={procesando}
            >
              {procesando ? "Guardando..." : `Confirmar ${prestamosParseados.length} Préstamos`}
            </Button>
            <Button variant="outline" onClick={() => setMostrarVista("entrada")} disabled={procesando}>
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          Ingreso Rápido
        </CardTitle>
        <CardDescription>Ingresa múltiples préstamos de forma masiva usando formato de texto</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formato de ejemplo */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Formato:</strong> Responsable | Hotel que retira | Hotel que recibe | Producto | Cantidad | Valor
            <br />
            <strong>Ejemplo:</strong> Juan Pérez | Monaco | Argentina | Toallas | 10 | 5000
          </AlertDescription>
        </Alert>

        {/* Listas de referencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">Hoteles disponibles:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {HOTELES.map((hotel) => (
                <Badge key={hotel} variant="outline" className="text-xs">
                  {hotel}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Responsables sugeridos:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {RESPONSABLES.map((responsable) => (
                <Badge key={responsable} variant="outline" className="text-xs">
                  {responsable}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Área de texto para ingreso masivo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ingresa los préstamos (uno por línea):</label>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Juan Pérez | Monaco | Argentina | Toallas | 10 | 5000
María García | Jaguel | Munich | Sábanas | 5 | 3000
Carlos López | Falkner | Stromboli | Efectivo | 1 | 10000`}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        {/* Errores */}
        {errores.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Errores encontrados:</strong>
                {errores.map((error, index) => (
                  <div key={index} className="text-sm">
                    • {error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={procesarTexto} className="w-full bg-orange-600 hover:bg-orange-700" disabled={!texto.trim()}>
          <Upload className="h-4 w-4 mr-2" />
          Procesar Préstamos
        </Button>
      </CardContent>
    </Card>
  )
}
