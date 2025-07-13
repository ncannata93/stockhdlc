"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Zap, Upload, AlertCircle, CheckCircle, Cloud, WifiOff, Database, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  crearPrestamosMasivos,
  verificarConexion,
  verificarTablaPrestamons,
  type PrestamoInput,
} from "@/lib/prestamos-supabase"

interface IngresoRapidoProps {
  onPrestamoCreado?: () => void
}

export function IngresoRapido({ onPrestamoCreado }: IngresoRapidoProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [tablaExiste, setTablaExiste] = useState(false)
  const [textoMasivo, setTextoMasivo] = useState("")
  const [preview, setPreview] = useState<PrestamoInput[]>([])

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [conexion, tabla] = await Promise.all([verificarConexion(), verificarTablaPrestamons()])
        setConectado(conexion.conectado)
        setTablaExiste(tabla.existe)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setConectado(false)
        setTablaExiste(false)
      }
    }
    cargarDatos()
  }, [])

  // Parsear texto masivo
  const parsearTextoMasivo = (texto: string): PrestamoInput[] => {
    if (!texto.trim()) return []

    const lineas = texto.trim().split("\n")
    const prestamos: PrestamoInput[] = []

    for (const linea of lineas) {
      if (!linea.trim()) continue

      // Formato: Responsable, Hotel que retira, Hotel que recibe, Producto, Cantidad, Valor
      const partes = linea.split(",").map((p) => p.trim())

      if (partes.length < 6) {
        console.warn(`Línea incompleta ignorada: ${linea}`)
        continue
      }

      const [responsable, hotel_origen, hotel_destino, producto, cantidad, valorStr] = partes
      const valor = Number.parseFloat(valorStr.replace(/[^\d.-]/g, "")) || 0

      if (valor <= 0) {
        console.warn(`Valor inválido en línea: ${linea}`)
        continue
      }

      prestamos.push({
        responsable,
        hotel_origen,
        hotel_destino,
        producto,
        cantidad,
        valor,
        estado: "pendiente",
      })
    }

    return prestamos
  }

  // Actualizar preview cuando cambia el texto
  useEffect(() => {
    const prestamos = parsearTextoMasivo(textoMasivo)
    setPreview(prestamos)
  }, [textoMasivo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!textoMasivo.trim()) {
      toast({
        title: "Texto requerido",
        description: "Por favor ingresa los datos de los préstamos",
        variant: "destructive",
      })
      return
    }

    if (preview.length === 0) {
      toast({
        title: "Datos inválidos",
        description: "No se pudieron procesar los datos ingresados. Verifica el formato.",
        variant: "destructive",
      })
      return
    }

    if (!tablaExiste) {
      toast({
        title: "Error de base de datos",
        description: "La tabla prestamos no existe. Ejecuta el script de creación primero.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const resultado = await crearPrestamosMasivos(preview)

      if (resultado.exitosos > 0) {
        toast({
          title: "✅ Préstamos creados",
          description: `${resultado.exitosos} préstamos creados exitosamente${resultado.errores.length > 0 ? ` (${resultado.errores.length} errores)` : ""}`,
        })

        // Limpiar formulario
        setTextoMasivo("")
        setPreview([])
        onPrestamoCreado?.()
      } else {
        toast({
          title: "Error al crear préstamos",
          description: `No se pudo crear ningún préstamo. Errores: ${resultado.errores.join(", ")}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al crear préstamos:", error)
      setConectado(false)
      toast({
        title: "Error al crear préstamos",
        description: "No se pudo guardar en Supabase. Verifica tu conexión.",
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

  const ejemploTexto = `Nicolas Cannata, Jaguel, Monaco, Efectivo, 1, 50000
Juan Manuel, Argentina, Falkner, Toallas, 20, 15000
Nacho, Stromboli, San Miguel, Sábanas, 10, 25000`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Ingreso Rápido Masivo
          <div className="ml-auto">{estadoConexion()}</div>
        </CardTitle>
        <CardDescription>Ingresa múltiples préstamos de una vez usando texto separado por comas</CardDescription>
      </CardHeader>
      <CardContent>
        {!conectado && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sin conexión a Supabase. Los préstamos no se pueden guardar en este momento.
            </AlertDescription>
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

        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Formato:</strong> Responsable, Hotel que retira, Hotel que recibe, Producto, Cantidad, Valor
            <br />
            <strong>Ejemplo:</strong>
            <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">{ejemploTexto}</pre>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="texto-masivo">Datos de préstamos (una línea por préstamo)</Label>
            <Textarea
              id="texto-masivo"
              placeholder={`Ingresa los datos separados por comas, ejemplo:\n${ejemploTexto}`}
              value={textoMasivo}
              onChange={(e) => setTextoMasivo(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Vista previa ({preview.length} préstamos)</Label>
              <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                {preview.map((prestamo, index) => (
                  <div key={index} className="text-xs mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{prestamo.responsable}</span>
                    <span>→</span>
                    <span className="text-blue-600">{prestamo.hotel_origen}</span>
                    <span>→</span>
                    <span className="text-green-600">{prestamo.hotel_destino}</span>
                    <span>|</span>
                    <span>{prestamo.producto}</span>
                    <span>|</span>
                    <span>{prestamo.cantidad}</span>
                    <span>|</span>
                    <span className="font-bold">${prestamo.valor.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !conectado || !tablaExiste || preview.length === 0}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando {preview.length} préstamos...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Crear {preview.length} Préstamos
              </>
            )}
          </Button>

          {conectado && tablaExiste && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Conectado a Supabase - Los datos se guardan automáticamente</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
