"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Zap, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResultadoProcesamiento {
  linea: string
  exito: boolean
  mensaje: string
  datos?: {
    responsable: string
    hotel_origen: string
    hotel_destino: string
    producto: string
    cantidad: string
    valor: number
  }
}

interface IngresoRapidoProps {
  onTransaccionCreada?: () => void
}

export function IngresoRapido({ onTransaccionCreada }: IngresoRapidoProps) {
  const { toast } = useToast()
  const [responsableDefecto, setResponsableDefecto] = useState("")
  const [texto, setTexto] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [resultados, setResultados] = useState<ResultadoProcesamiento[]>([])

  const procesarLinea = (linea: string, responsableDefecto: string): ResultadoProcesamiento => {
    const lineaTrimmed = linea.trim()
    if (!lineaTrimmed) {
      return {
        linea,
        exito: false,
        mensaje: "Línea vacía",
      }
    }

    // Dividir por comas y limpiar espacios
    const partes = lineaTrimmed.split(",").map((parte) => parte.trim())

    // Verificar que tenga exactamente 6 campos o 5 (sin responsable)
    if (partes.length === 5) {
      // Formato: Hotel que retira, Hotel que recibe, Producto, Cantidad, Valor
      // Usar responsable por defecto
      if (!responsableDefecto) {
        return {
          linea,
          exito: false,
          mensaje: "Falta responsable por defecto para formato de 5 campos",
        }
      }
      partes.unshift(responsableDefecto) // Agregar responsable al inicio
    } else if (partes.length !== 6) {
      return {
        linea,
        exito: false,
        mensaje: `Formato incorrecto. Se esperan 6 campos: Responsable, Hotel que retira, Hotel que recibe, Producto, Cantidad, Valor. Se encontraron ${partes.length} campos.`,
      }
    }

    const [responsable, hotel_origen, hotel_destino, producto, cantidad, valorStr] = partes

    // Validar campos obligatorios
    if (!responsable || !hotel_origen || !hotel_destino || !producto || !cantidad || !valorStr) {
      return {
        linea,
        exito: false,
        mensaje: "Todos los campos son obligatorios",
      }
    }

    // Validar y convertir valor
    const valor = Number.parseFloat(valorStr.replace(/[^\d.-]/g, ""))
    if (isNaN(valor) || valor <= 0) {
      return {
        linea,
        exito: false,
        mensaje: `Valor inválido: ${valorStr}`,
      }
    }

    return {
      linea,
      exito: true,
      mensaje: "Procesado correctamente",
      datos: {
        responsable,
        hotel_origen,
        hotel_destino,
        producto,
        cantidad,
        valor,
      },
    }
  }

  const guardarTransaccion = async (datos: {
    responsable: string
    hotel_origen: string
    hotel_destino: string
    producto: string
    cantidad: string
    valor: number
  }) => {
    try {
      // Crear la transacción
      const nuevaTransaccion = {
        id: `prestamo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        responsable: datos.responsable,
        hotel_origen: datos.hotel_origen,
        hotel_destino: datos.hotel_destino,
        producto: datos.producto,
        cantidad: datos.cantidad,
        valor: datos.valor,
        fecha: new Date().toISOString().split("T")[0],
        notas: `${datos.producto} - ${datos.cantidad}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Obtener transacciones existentes
      const transaccionesExistentes = JSON.parse(localStorage.getItem("prestamos_data") || "[]")

      // Agregar la nueva transacción
      const todasLasTransacciones = [...transaccionesExistentes, nuevaTransaccion]

      // Guardar en localStorage
      localStorage.setItem("prestamos_data", JSON.stringify(todasLasTransacciones))

      return true
    } catch (error) {
      console.error("Error al guardar transacción:", error)
      return false
    }
  }

  const procesarTexto = async () => {
    if (!texto.trim()) {
      toast({
        title: "Error",
        description: "Ingresa al menos una línea de datos",
        variant: "destructive",
      })
      return
    }

    setProcesando(true)
    const lineas = texto.split("\n").filter((linea) => linea.trim())
    const resultadosProcesamiento: ResultadoProcesamiento[] = []
    let exitosos = 0
    let errores = 0

    for (const linea of lineas) {
      const resultado = procesarLinea(linea, responsableDefecto)
      resultadosProcesamiento.push(resultado)

      if (resultado.exito && resultado.datos) {
        const guardado = await guardarTransaccion(resultado.datos)
        if (guardado) {
          exitosos++
        } else {
          resultado.exito = false
          resultado.mensaje = "Error al guardar en localStorage"
          errores++
        }
      } else {
        errores++
      }
    }

    setResultados(resultadosProcesamiento)
    setProcesando(false)

    // Mostrar toast de resumen
    if (exitosos > 0) {
      toast({
        title: "Procesamiento completado",
        description: `${exitosos} transacciones guardadas, ${errores} errores`,
      })
      onTransaccionCreada?.()
    } else {
      toast({
        title: "Error",
        description: `No se pudo procesar ninguna transacción. ${errores} errores`,
        variant: "destructive",
      })
    }
  }

  const limpiarFormulario = () => {
    setTexto("")
    setResultados([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Ingreso Rápido
        </CardTitle>
        <CardDescription>
          Ingresa múltiples transacciones usando formato CSV: Responsable, Hotel que retira, Hotel que recibe, Producto,
          Cantidad, Valor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Responsable por defecto */}
        <div className="space-y-2">
          <Label htmlFor="responsable-defecto">Responsable por defecto (opcional)</Label>
          <Input
            id="responsable-defecto"
            value={responsableDefecto}
            onChange={(e) => setResponsableDefecto(e.target.value)}
            placeholder="Ej: Nicolas Cannata"
          />
          <p className="text-xs text-gray-600">
            Si se especifica, puedes usar formato de 5 campos omitiendo el responsable
          </p>
        </div>

        {/* Área de texto */}
        <div className="space-y-2">
          <Label htmlFor="texto-rapido">Datos de transacciones</Label>
          <Textarea
            id="texto-rapido"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Ejemplos:
Nicolas Cannata, Argentina, Mallak, Toallas, 20 unidades, 50000
Diego Pili, Mallak, Monaco, Equipamiento, 5 items, 30000
Juan Prey, Jaguel, Argentina, Materiales, 10 kg, 75000

O con responsable por defecto (5 campos):
Argentina, Mallak, Toallas, 20 unidades, 50000
Mallak, Monaco, Equipamiento, 5 items, 30000`}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <Button onClick={procesarTexto} disabled={procesando} className="flex-1">
            {procesando ? "Procesando..." : "Procesar Transacciones"}
          </Button>
          <Button onClick={limpiarFormulario} variant="outline">
            Limpiar
          </Button>
        </div>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Resultados del procesamiento:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {resultados.map((resultado, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded text-sm ${
                    resultado.exito ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}
                >
                  {resultado.exito ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-gray-600 truncate">{resultado.linea}</div>
                    <div className={resultado.exito ? "text-green-700" : "text-red-700"}>{resultado.mensaje}</div>
                    {resultado.exito && resultado.datos && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {resultado.datos.hotel_origen} → {resultado.datos.hotel_destino}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ${resultado.datos.valor.toLocaleString()}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ayuda */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Formato de datos:</p>
              <ul className="text-xs space-y-1">
                <li>• 6 campos: Responsable, Hotel que retira, Hotel que recibe, Producto, Cantidad, Valor</li>
                <li>
                  • 5 campos: Hotel que retira, Hotel que recibe, Producto, Cantidad, Valor (requiere responsable por
                  defecto)
                </li>
                <li>• Separar campos con comas</li>
                <li>• Una transacción por línea</li>
                <li>• El valor debe ser numérico</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
