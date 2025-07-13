"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle, AlertCircle, Info } from "lucide-react"
import { HOTELES, RESPONSABLES, type PrestamoFormData } from "@/lib/prestamos-types"

interface ParsedPrestamo extends PrestamoFormData {
  lineNumber: number
}

interface ValidationError {
  line: number
  field: string
  message: string
}

export function IngresoRapido() {
  const [textInput, setTextInput] = useState("")
  const [parsedPrestamos, setParsedPrestamos] = useState<ParsedPrestamo[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const parseTextInput = () => {
    const lines = textInput
      .trim()
      .split("\n")
      .filter((line) => line.trim())
    const prestamos: ParsedPrestamo[] = []
    const errors: ValidationError[] = []

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const parts = line.split("|").map((part) => part.trim())

      if (parts.length !== 6) {
        errors.push({
          line: lineNumber,
          field: "formato",
          message: `Línea debe tener 6 campos separados por |. Encontrados: ${parts.length}`,
        })
        return
      }

      const [responsable, hotelOrigen, hotelDestino, producto, cantidadStr, valorStr] = parts

      // Validaciones
      if (!responsable) {
        errors.push({ line: lineNumber, field: "responsable", message: "Responsable requerido" })
      }

      if (!HOTELES.includes(hotelOrigen as any)) {
        errors.push({ line: lineNumber, field: "hotel_origen", message: `Hotel origen "${hotelOrigen}" no válido` })
      }

      if (!HOTELES.includes(hotelDestino as any)) {
        errors.push({ line: lineNumber, field: "hotel_destino", message: `Hotel destino "${hotelDestino}" no válido` })
      }

      if (hotelOrigen === hotelDestino) {
        errors.push({ line: lineNumber, field: "hoteles", message: "Hotel origen y destino no pueden ser iguales" })
      }

      if (!producto) {
        errors.push({ line: lineNumber, field: "producto", message: "Producto requerido" })
      }

      const cantidad = Number.parseInt(cantidadStr)
      if (isNaN(cantidad) || cantidad <= 0) {
        errors.push({ line: lineNumber, field: "cantidad", message: "Cantidad debe ser un número positivo" })
      }

      const valor = Number.parseFloat(valorStr)
      if (isNaN(valor) || valor <= 0) {
        errors.push({ line: lineNumber, field: "valor", message: "Valor debe ser un número positivo" })
      }

      if (errors.filter((e) => e.line === lineNumber).length === 0) {
        prestamos.push({
          responsable,
          hotel_origen: hotelOrigen,
          hotel_destino: hotelDestino,
          producto,
          cantidad,
          valor,
          lineNumber,
        })
      }
    })

    setParsedPrestamos(prestamos)
    setValidationErrors(errors)
    setShowPreview(true)
  }

  const processPrestamos = async () => {
    setIsProcessing(true)
    try {
      // Aquí iría la lógica para guardar en la base de datos
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulación

      // Reset form
      setTextInput("")
      setParsedPrestamos([])
      setValidationErrors([])
      setShowPreview(false)

      alert(`${parsedPrestamos.length} préstamos procesados exitosamente`)
    } catch (error) {
      console.error("Error procesando préstamos:", error)
      alert("Error al procesar préstamos")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ingreso Rápido Masivo
          </CardTitle>
          <CardDescription>Ingresa múltiples préstamos usando formato de texto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Formato: Responsable | Hotel que retira | Hotel que recibe | Producto | Cantidad | Valor
            </label>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Ejemplo:
Nicolas Cannata | Munich | Monaco | Toallas | 10 | 5000
Juan Manuel | Jaguel | Argentina | Sabanas | 5 | 3000
Nacho | Colores | Tupe | Almohadas | 8 | 2400`}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={parseTextInput} disabled={!textInput.trim()} variant="outline">
              <Info className="h-4 w-4 mr-2" />
              Validar Datos
            </Button>
            {showPreview && parsedPrestamos.length > 0 && (
              <Button onClick={processPrestamos} disabled={isProcessing || validationErrors.length > 0}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {isProcessing ? "Procesando..." : `Procesar ${parsedPrestamos.length} Préstamos`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hoteles disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Hoteles/Personas Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {HOTELES.map((hotel) => (
              <Badge key={hotel} variant="secondary" className="text-xs">
                {hotel}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Responsables sugeridos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Responsables Sugeridos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {RESPONSABLES.map((responsable) => (
              <Badge key={responsable} variant="outline" className="text-xs">
                {responsable}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Errores de validación */}
      {validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Errores de Validación ({validationErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    <strong>Línea {error.line}:</strong> {error.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview de préstamos válidos */}
      {showPreview && parsedPrestamos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Préstamos Válidos ({parsedPrestamos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parsedPrestamos.map((prestamo, index) => (
                <div key={index} className="p-3 border rounded-lg bg-green-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <strong>Responsable:</strong> {prestamo.responsable}
                    </div>
                    <div>
                      <strong>De:</strong> {prestamo.hotel_origen}
                    </div>
                    <div>
                      <strong>Para:</strong> {prestamo.hotel_destino}
                    </div>
                    <div>
                      <strong>Producto:</strong> {prestamo.producto}
                    </div>
                    <div>
                      <strong>Cantidad:</strong> {prestamo.cantidad}
                    </div>
                    <div>
                      <strong>Valor:</strong> ${prestamo.valor.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Named export
