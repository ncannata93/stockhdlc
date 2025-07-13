"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, CheckCircle, AlertCircle, Info } from "lucide-react"
import { crearPrestamo } from "@/lib/prestamos-db"
import { HOTELES, RESPONSABLES } from "@/lib/prestamos-types"
import type { PrestamoInput } from "@/lib/prestamos-types"

interface IngresoRapidoProps {
  onPrestamoCreado?: () => void
}

export function IngresoRapido({ onPrestamoCreado }: IngresoRapidoProps) {
  const [textoMasivo, setTextoMasivo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error" | "info"; texto: string } | null>(null)

  const formatoEjemplo = `Ejemplo de formato (una línea por préstamo):
Nicolás Cannata | Jaguel | Monaco | Toallas | 50 | 25000
Diego Pili | Argentina | Mallak | Sábanas | 30 | 15000
Juan Prey | Munich | Falkner | Efectivo | 1 | 100000`

  const procesarTextoMasivo = (texto: string): PrestamoInput[] => {
    const lineas = texto
      .trim()
      .split("\n")
      .filter((linea) => linea.trim())
    const prestamos: PrestamoInput[] = []
    const errores: string[] = []

    lineas.forEach((linea, index) => {
      const partes = linea.split("|").map((parte) => parte.trim())

      if (partes.length !== 6) {
        errores.push(`Línea ${index + 1}: Debe tener 6 campos separados por |`)
        return
      }

      const [responsable, hotelRetira, hotelRecibe, producto, cantidadStr, valorStr] = partes

      // Validaciones
      if (!RESPONSABLES.includes(responsable)) {
        errores.push(`Línea ${index + 1}: Responsable "${responsable}" no válido`)
      }

      if (!HOTELES.includes(hotelRetira)) {
        errores.push(`Línea ${index + 1}: Hotel que retira "${hotelRetira}" no válido`)
      }

      if (!HOTELES.includes(hotelRecibe)) {
        errores.push(`Línea ${index + 1}: Hotel que recibe "${hotelRecibe}" no válido`)
      }

      if (hotelRetira === hotelRecibe) {
        errores.push(`Línea ${index + 1}: Los hoteles no pueden ser iguales`)
      }

      const cantidad = Number.parseInt(cantidadStr)
      const valor = Number.parseInt(valorStr)

      if (isNaN(cantidad) || cantidad <= 0) {
        errores.push(`Línea ${index + 1}: Cantidad debe ser un número mayor a 0`)
      }

      if (isNaN(valor) || valor <= 0) {
        errores.push(`Línea ${index + 1}: Valor debe ser un número mayor a 0`)
      }

      if (errores.length === 0 || errores.filter((e) => e.includes(`Línea ${index + 1}`)).length === 0) {
        prestamos.push({
          hotel_origen: hotelRetira,
          hotel_destino: hotelRecibe,
          monto: valor,
          concepto: `${producto} (${cantidad} unidades)`,
          responsable: responsable,
          producto: producto,
          cantidad: cantidad,
          notas: `Préstamo de ${cantidad} ${producto} por valor de $${valor.toLocaleString()}`,
        })
      }
    })

    if (errores.length > 0) {
      throw new Error(errores.join("\n"))
    }

    return prestamos
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!textoMasivo.trim()) {
      setMensaje({ tipo: "error", texto: "Por favor ingresa los datos de los préstamos" })
      return
    }

    setIsLoading(true)
    setMensaje(null)

    try {
      const prestamos = procesarTextoMasivo(textoMasivo)

      if (prestamos.length === 0) {
        setMensaje({ tipo: "error", texto: "No se encontraron préstamos válidos para procesar" })
        return
      }

      let exitosos = 0
      let fallidos = 0

      for (const prestamo of prestamos) {
        const resultado = await crearPrestamo(prestamo)
        if (resultado) {
          exitosos++
        } else {
          fallidos++
        }
      }

      if (exitosos > 0) {
        setMensaje({
          tipo: "success",
          texto: `Se procesaron ${exitosos} préstamos exitosamente${fallidos > 0 ? ` (${fallidos} fallaron)` : ""}`,
        })
        setTextoMasivo("")
        onPrestamoCreado?.()
      } else {
        setMensaje({ tipo: "error", texto: "No se pudo procesar ningún préstamo" })
      }
    } catch (error) {
      console.error("Error:", error)
      setMensaje({
        tipo: "error",
        texto: error instanceof Error ? error.message : "Error inesperado al procesar los préstamos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          Ingreso Rápido de Préstamos
        </CardTitle>
        <CardDescription>Ingresa múltiples préstamos de forma masiva usando el formato especificado</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del formato */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Formato:</strong> Responsable | Hotel que retira | Hotel que recibe | Producto | Cantidad |
                  Valor
                </p>
                <div className="text-sm font-mono bg-gray-50 p-2 rounded whitespace-pre-line">{formatoEjemplo}</div>
                <p className="text-xs text-gray-600">
                  <strong>Hoteles disponibles:</strong> {HOTELES.join(", ")}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Responsables disponibles:</strong> {RESPONSABLES.join(", ")}
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Área de texto para ingreso masivo */}
          <div className="space-y-2">
            <Label htmlFor="textoMasivo">Datos de Préstamos</Label>
            <Textarea
              id="textoMasivo"
              placeholder="Ingresa los préstamos, uno por línea..."
              value={textoMasivo}
              onChange={(e) => setTextoMasivo(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Mensaje de Estado */}
          {mensaje && (
            <Alert variant={mensaje.tipo === "error" ? "destructive" : "default"}>
              {mensaje.tipo === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription className="whitespace-pre-line">{mensaje.texto}</AlertDescription>
            </Alert>
          )}

          {/* Botón de Envío */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Procesando préstamos..." : "Procesar Préstamos"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
