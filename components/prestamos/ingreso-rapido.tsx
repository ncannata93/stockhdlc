"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Zap, CheckCircle, XCircle, Info } from "lucide-react"
import { RESPONSABLES, HOTELES } from "@/lib/prestamos-types"
import { procesarIngresoRapido } from "@/lib/prestamos-db"
import { useToast } from "@/hooks/use-toast"

interface IngresoRapidoProps {
  onTransaccionCreada?: () => void
}

interface ResultadoProcesamiento {
  linea: string
  exito: boolean
  mensaje: string
  datos?: any
}

export function IngresoRapido({ onTransaccionCreada }: IngresoRapidoProps) {
  const { toast } = useToast()
  const [texto, setTexto] = useState("")
  const [responsable, setResponsable] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [resultados, setResultados] = useState<ResultadoProcesamiento[]>([])

  const ejemplos = [
    "Argentina → Mallak $50000 Préstamo para reparaciones",
    "Mallak ← Monaco $30000 Devolución de préstamo anterior",
    "Jaguel → Argentina $75000 Préstamo para renovación",
    "Monaco ← Jaguel $25000 Devolución parcial",
  ]

  const parsearLinea = (linea: string): any => {
    // Limpiar la línea
    const lineaLimpia = linea.trim()
    if (!lineaLimpia) return null

    // Patrones para préstamo (→) y devolución (←)
    const patronPrestamo = /^(.+?)\s*→\s*(.+?)\s*\$(\d+(?:\.\d+)?)\s*(.*)$/
    const patronDevolucion = /^(.+?)\s*←\s*(.+?)\s*\$(\d+(?:\.\d+)?)\s*(.*)$/

    let match = lineaLimpia.match(patronPrestamo)
    if (match) {
      return {
        tipo: "prestamo",
        hotel1: match[1].trim(),
        hotel2: match[2].trim(),
        monto: Number.parseFloat(match[3]),
        concepto: match[4].trim() || "Préstamo",
      }
    }

    match = lineaLimpia.match(patronDevolucion)
    if (match) {
      return {
        tipo: "devolucion",
        hotel1: match[1].trim(),
        hotel2: match[2].trim(),
        monto: Number.parseFloat(match[3]),
        concepto: match[4].trim() || "Devolución",
      }
    }

    return null
  }

  const validarDatos = (datos: any): string | null => {
    if (!datos.hotel1 || !datos.hotel2) {
      return "Faltan hoteles"
    }

    if (!HOTELES.includes(datos.hotel1)) {
      return `Hotel no válido: ${datos.hotel1}`
    }

    if (!HOTELES.includes(datos.hotel2)) {
      return `Hotel no válido: ${datos.hotel2}`
    }

    if (datos.hotel1 === datos.hotel2) {
      return "Los hoteles no pueden ser iguales"
    }

    if (!datos.monto || datos.monto <= 0) {
      return "Monto inválido"
    }

    return null
  }

  const procesarTexto = async () => {
    if (!responsable) {
      toast({
        title: "Error",
        description: "Debes seleccionar un responsable",
        variant: "destructive",
      })
      return
    }

    if (!texto.trim()) {
      toast({
        title: "Error",
        description: "Debes ingresar al menos una transacción",
        variant: "destructive",
      })
      return
    }

    setProcesando(true)
    const lineas = texto.split("\n").filter((l) => l.trim())
    const nuevosResultados: ResultadoProcesamiento[] = []
    let exitosos = 0

    for (const linea of lineas) {
      try {
        const datos = parsearLinea(linea)

        if (!datos) {
          nuevosResultados.push({
            linea,
            exito: false,
            mensaje: "Formato inválido. Usa: Hotel1 → Hotel2 $monto concepto",
          })
          continue
        }

        const errorValidacion = validarDatos(datos)
        if (errorValidacion) {
          nuevosResultados.push({
            linea,
            exito: false,
            mensaje: errorValidacion,
          })
          continue
        }

        // Procesar la transacción
        const resultado = await procesarIngresoRapido({
          ...datos,
          responsable,
        })

        if (resultado) {
          nuevosResultados.push({
            linea,
            exito: true,
            mensaje: `${datos.tipo === "prestamo" ? "Préstamo" : "Devolución"} creado correctamente`,
            datos: resultado,
          })
          exitosos++
        } else {
          nuevosResultados.push({
            linea,
            exito: false,
            mensaje: "Error al crear la transacción",
          })
        }
      } catch (error) {
        nuevosResultados.push({
          linea,
          exito: false,
          mensaje: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
        })
      }
    }

    setResultados(nuevosResultados)
    setProcesando(false)

    // Mostrar toast de resumen
    if (exitosos > 0) {
      toast({
        title: "Procesamiento completado",
        description: `${exitosos} de ${lineas.length} transacciones creadas exitosamente`,
      })

      // Limpiar el formulario si todo fue exitoso
      if (exitosos === lineas.length) {
        setTexto("")
        setResultados([])
      }

      // Notificar que se crearon transacciones
      onTransaccionCreada?.()
    } else {
      toast({
        title: "Error en el procesamiento",
        description: "No se pudo crear ninguna transacción",
        variant: "destructive",
      })
    }
  }

  const limpiarFormulario = () => {
    setTexto("")
    setResultados([])
  }

  const insertarEjemplo = () => {
    setTexto(ejemplos.join("\n"))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Ingreso Rápido
        </CardTitle>
        <CardDescription>
          Ingresa múltiples transacciones usando texto simple. Usa → para préstamos y ← para devoluciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de responsable */}
        <div className="space-y-2">
          <Label htmlFor="responsable">Responsable</Label>
          <Select value={responsable} onValueChange={setResponsable}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el responsable" />
            </SelectTrigger>
            <SelectContent>
              {RESPONSABLES.map((resp) => (
                <SelectItem key={resp} value={resp}>
                  {resp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Área de texto */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="texto">Transacciones</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={insertarEjemplo}>
                Insertar ejemplos
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </div>
          </div>
          <Textarea
            id="texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Formato: Hotel1 → Hotel2 $monto concepto

Ejemplos:
${ejemplos.join("\n")}

Hoteles disponibles: ${HOTELES.join(", ")}`}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        {/* Información de formato */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Formato de entrada:</p>
              <ul className="space-y-1 text-xs">
                <li>
                  • <strong>Préstamo:</strong> Hotel1 → Hotel2 $monto concepto
                </li>
                <li>
                  • <strong>Devolución:</strong> Hotel1 ← Hotel2 $monto concepto
                </li>
                <li>• Una transacción por línea</li>
                <li>• El concepto es opcional</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón de procesamiento */}
        <Button onClick={procesarTexto} disabled={procesando || !responsable || !texto.trim()} className="w-full">
          {procesando ? "Procesando..." : "Procesar Transacciones"}
        </Button>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="space-y-2">
            <Label>Resultados del procesamiento:</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {resultados.map((resultado, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    resultado.exito ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}
                >
                  {resultado.exito ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-gray-600 mb-1 break-all">{resultado.linea}</div>
                    <div className={`text-sm ${resultado.exito ? "text-green-800" : "text-red-800"}`}>
                      {resultado.mensaje}
                    </div>
                  </div>
                  <Badge variant={resultado.exito ? "secondary" : "destructive"} className="text-xs">
                    {resultado.exito ? "OK" : "Error"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
