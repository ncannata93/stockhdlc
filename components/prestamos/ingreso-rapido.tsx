"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Zap,
  Upload,
  AlertCircle,
  CheckCircle,
  Cloud,
  WifiOff,
  Database,
  Eye,
  EyeOff,
  Copy,
  FileText,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  crearPrestamosMasivos,
  verificarConexion,
  verificarTablaPrestamons,
  formatearMonto,
  type PrestamoInput,
} from "@/lib/prestamos-supabase"

interface IngresoRapidoProps {
  onPrestamosCreados?: () => void
}

interface PrestamoParseado extends PrestamoInput {
  linea: number
  valido: boolean
  errores: string[]
}

export function IngresoRapido({ onPrestamosCreados }: IngresoRapidoProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [tablaExiste, setTablaExiste] = useState(false)
  const [textoEntrada, setTextoEntrada] = useState("")
  const [prestamosParseados, setPrestamosParseados] = useState<PrestamoParseado[]>([])
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)

  // Ejemplo de formato con espacios - actualizado según solicitud
  const ejemploTexto = `Juan Manuel Argentina Falkner Toallas 20 15000
Nacho Stromboli San Miguel Sábanas 10 25000`

  // Verificar conexión al cargar
  useEffect(() => {
    const verificarEstado = async () => {
      try {
        const [conexion, tabla] = await Promise.all([verificarConexion(), verificarTablaPrestamons()])
        setConectado(conexion.conectado)
        setTablaExiste(tabla.existe)
      } catch (error) {
        console.error("Error al verificar estado:", error)
        setConectado(false)
        setTablaExiste(false)
      }
    }
    verificarEstado()
  }, [])

  // Parsear texto cuando cambia
  useEffect(() => {
    if (textoEntrada.trim()) {
      parsearTexto(textoEntrada)
    } else {
      setPrestamosParseados([])
    }
  }, [textoEntrada])

  const parsearTexto = (texto: string) => {
    const lineas = texto.split("\n").filter((linea) => linea.trim())
    const prestamosParseados: PrestamoParseado[] = []

    lineas.forEach((linea, index) => {
      // Dividir por espacios múltiples o espacios simples
      const partes = linea.trim().split(/\s+/)
      const errores: string[] = []

      // Validar que tenga al menos 6 partes
      if (partes.length < 6) {
        errores.push(`Faltan datos. Formato: Responsable HotelOrigen HotelDestino Producto Cantidad Valor`)
      }

      // Tomar las últimas 2 partes como cantidad y valor
      const valor = partes[partes.length - 1]
      const cantidad = partes[partes.length - 2]

      // El producto puede ser múltiples palabras, tomar desde índice 3 hasta cantidad
      const producto = partes.slice(3, partes.length - 2).join(" ")

      // Los primeros 3 elementos
      const responsable = partes[0] || ""
      const hotelOrigen = partes[1] || ""
      const hotelDestino = partes[2] || ""

      // Validaciones
      if (!responsable) errores.push("Responsable requerido")
      if (!hotelOrigen) errores.push("Hotel origen requerido")
      if (!hotelDestino) errores.push("Hotel destino requerido")
      if (!producto) errores.push("Producto requerido")
      if (!cantidad) errores.push("Cantidad requerida")
      if (!valor) errores.push("Valor requerido")

      if (hotelOrigen === hotelDestino) {
        errores.push("Hotel origen y destino no pueden ser iguales")
      }

      // Validar valor numérico
      const valorNumerico = Number.parseFloat(valor?.replace(/[^0-9.-]/g, "") || "0")
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        errores.push("Valor debe ser un número mayor a 0")
      }

      const prestamo: PrestamoParseado = {
        linea: index + 1,
        fecha: new Date().toISOString().split("T")[0], // Formato ISO yyyy-MM-dd
        responsable: responsable,
        hotel_origen: hotelOrigen,
        hotel_destino: hotelDestino,
        producto: producto,
        cantidad: cantidad,
        valor: valorNumerico,
        estado: "pendiente",
        valido: errores.length === 0,
        errores,
      }

      prestamosParseados.push(prestamo)
    })

    setPrestamosParseados(prestamosParseados)
  }

  const handleSubmit = async () => {
    if (!conectado || !tablaExiste) {
      toast({
        title: "Error de conexión",
        description: "No se puede conectar a Supabase o la tabla no existe",
        variant: "destructive",
      })
      return
    }

    const prestamosValidos = prestamosParseados.filter((p) => p.valido)

    if (prestamosValidos.length === 0) {
      toast({
        title: "No hay préstamos válidos",
        description: "Corrige los errores antes de continuar",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const resultado = await crearPrestamosMasivos(prestamosValidos)

      if (resultado.exitosos > 0) {
        toast({
          title: "✅ Préstamos creados",
          description: `${resultado.exitosos} préstamos guardados exitosamente`,
        })

        // Limpiar formulario
        setTextoEntrada("")
        setPrestamosParseados([])
        setMostrarVistaPrevia(false)

        onPrestamosCreados?.()
      }

      if (resultado.errores.length > 0) {
        toast({
          title: "Algunos errores",
          description: `${resultado.errores.length} préstamos no se pudieron guardar`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al crear préstamos:", error)
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los préstamos en Supabase",
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
          <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          <span className="text-xs text-red-600">Sin conexión</span>
        </div>
      )
    }

    if (!tablaExiste) {
      return (
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          <span className="text-xs text-orange-600">Tabla no existe</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1">
        <Cloud className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        <span className="text-xs text-green-600">Supabase OK</span>
      </div>
    )
  }

  const prestamosValidos = prestamosParseados.filter((p) => p.valido).length
  const prestamosInvalidos = prestamosParseados.filter((p) => !p.valido).length

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            <span>Ingreso Rápido Masivo</span>
          </div>
          <div className="sm:ml-auto">{estadoConexion()}</div>
        </CardTitle>
        <CardDescription className="text-sm">
          Ingresa múltiples préstamos de una vez separados por espacios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!conectado && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Sin conexión a Supabase. Los préstamos no se pueden guardar en este momento.
            </AlertDescription>
          </Alert>
        )}

        {conectado && !tablaExiste && (
          <Alert variant="destructive">
            <Database className="h-4 w-4" />
            <AlertDescription className="text-sm">
              La tabla 'prestamos' no existe en Supabase. Ejecuta el script 'create-prestamos-table-complete.sql'
              primero.
            </AlertDescription>
          </Alert>
        )}

        {/* Formato de ejemplo - más compacto en móvil */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <h4 className="font-medium text-blue-800 flex items-center gap-2 text-sm sm:text-base">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              Formato requerido (separado por espacios)
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTextoEntrada(ejemploTexto)}
              className="text-xs sm:text-sm h-7 sm:h-8"
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Usar ejemplo
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-blue-700 mb-2">
            <strong>Formato:</strong> Responsable HotelOrigen HotelDestino Producto Cantidad Valor
          </p>
          <p className="text-xs text-blue-600 mb-2">
            <strong>Nota:</strong> Si el producto tiene múltiples palabras, se detectará automáticamente
          </p>
          <div className="bg-white p-2 sm:p-3 rounded border font-mono text-xs overflow-x-auto">
            <div className="whitespace-nowrap sm:whitespace-normal">
              {ejemploTexto.split("\n").map((linea, index) => (
                <div key={index} className="text-gray-600 mb-1 last:mb-0">
                  {linea}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            <strong>Ejemplos con productos de múltiples palabras:</strong>
            <div className="font-mono text-gray-600 mt-1">
              <div>Nacho Monaco Jaguel Repuestos Lavarropas 2 85000</div>
              <div>Juan Argentina Falkner Toallas de Baño 15 12000</div>
            </div>
          </div>
        </div>

        {/* Área de texto */}
        <div className="space-y-2">
          <Label htmlFor="texto-entrada" className="text-sm font-medium">
            Datos de préstamos (una línea por préstamo, separado por espacios)
          </Label>
          <Textarea
            id="texto-entrada"
            placeholder="Ejemplo: Juan Manuel Argentina Falkner Toallas 20 15000"
            value={textoEntrada}
            onChange={(e) => setTextoEntrada(e.target.value)}
            rows={6}
            className="font-mono text-xs sm:text-sm resize-none"
          />
        </div>

        {/* Estadísticas y vista previa */}
        {prestamosParseados.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  {prestamosValidos} válidos
                </Badge>
                {prestamosInvalidos > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {prestamosInvalidos} con errores
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)}
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                {mostrarVistaPrevia ? (
                  <>
                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Vista previa
                  </>
                )}
              </Button>
            </div>

            {/* Vista previa - optimizada para móvil */}
            {mostrarVistaPrevia && (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-2 sm:p-3 bg-gray-50 border-b">
                  <h4 className="font-medium text-sm">Vista previa de préstamos</h4>
                </div>
                <div className="max-h-48 sm:max-h-64 overflow-y-auto">
                  {/* Vista móvil - cards */}
                  <div className="sm:hidden space-y-2 p-2">
                    {prestamosParseados.map((prestamo) => (
                      <div
                        key={prestamo.linea}
                        className={`p-2 rounded border text-xs ${prestamo.valido ? "bg-white" : "bg-red-50 border-red-200"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Línea {prestamo.linea}</span>
                          {prestamo.valido ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                              ✓
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              ✗
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div>
                            <strong>{prestamo.responsable}</strong>
                          </div>
                          <div className="text-blue-600">
                            {prestamo.hotel_origen} → {prestamo.hotel_destino}
                          </div>
                          <div>
                            {prestamo.producto} ({prestamo.cantidad})
                          </div>
                          <div className="font-semibold">{formatearMonto(prestamo.valor)}</div>
                          {!prestamo.valido && (
                            <div className="text-red-600 text-xs mt-1">
                              {prestamo.errores.map((error, i) => (
                                <div key={i}>• {error}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista desktop - tabla */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Línea</TableHead>
                          <TableHead>Responsable</TableHead>
                          <TableHead>Origen → Destino</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prestamosParseados.map((prestamo) => (
                          <TableRow key={prestamo.linea} className={prestamo.valido ? "" : "bg-red-50"}>
                            <TableCell className="font-mono text-xs">{prestamo.linea}</TableCell>
                            <TableCell className="text-sm">{prestamo.responsable}</TableCell>
                            <TableCell className="text-sm">
                              <span className="text-blue-600">{prestamo.hotel_origen}</span>
                              {" → "}
                              <span className="text-green-600">{prestamo.hotel_destino}</span>
                            </TableCell>
                            <TableCell className="text-sm">{prestamo.producto}</TableCell>
                            <TableCell className="text-sm">{prestamo.cantidad}</TableCell>
                            <TableCell className="text-sm font-semibold">{formatearMonto(prestamo.valor)}</TableCell>
                            <TableCell>
                              {prestamo.valido ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  ✓ Válido
                                </Badge>
                              ) : (
                                <div className="space-y-1">
                                  <Badge variant="destructive">✗ Error</Badge>
                                  <div className="text-xs text-red-600">
                                    {prestamo.errores.map((error, i) => (
                                      <div key={i}>• {error}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón de envío */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !conectado || !tablaExiste || prestamosValidos === 0}
            className="w-full h-10 sm:h-11"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando {prestamosValidos} préstamos...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Crear {prestamosValidos} Préstamos
              </>
            )}
          </Button>

          {conectado && tablaExiste && prestamosValidos > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-green-600">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Listo para guardar {prestamosValidos} préstamos en Supabase</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
