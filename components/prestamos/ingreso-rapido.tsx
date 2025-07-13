"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Zap, Upload, AlertCircle, CheckCircle, Cloud, WifiOff, Database, Eye, EyeOff } from "lucide-react"
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

  // Ejemplo de formato
  const ejemploTexto = `Nicolas Cannata, Jaguel, Monaco, Efectivo, 1, 50000
Juan Manuel, Argentina, Falkner, Toallas, 20, 15000
Nacho, Stromboli, San Miguel, Sábanas, 10, 25000`

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
      const partes = linea.split(",").map((parte) => parte.trim())
      const errores: string[] = []

      // Validar que tenga al menos 6 partes (responsable, origen, destino, producto, cantidad, valor)
      if (partes.length < 6) {
        errores.push(`Faltan datos. Formato: Responsable, Hotel origen, Hotel destino, Producto, Cantidad, Valor`)
      }

      const [responsable, hotelOrigen, hotelDestino, producto, cantidad, valorTexto] = partes

      // Validaciones
      if (!responsable) errores.push("Responsable requerido")
      if (!hotelOrigen) errores.push("Hotel origen requerido")
      if (!hotelDestino) errores.push("Hotel destino requerido")
      if (!producto) errores.push("Producto requerido")
      if (!valorTexto) errores.push("Valor requerido")

      if (hotelOrigen === hotelDestino) {
        errores.push("Hotel origen y destino no pueden ser iguales")
      }

      // Validar valor numérico
      const valor = Number.parseFloat(valorTexto?.replace(/[^0-9.-]/g, "") || "0")
      if (isNaN(valor) || valor <= 0) {
        errores.push("Valor debe ser un número mayor a 0")
      }

      const prestamo: PrestamoParseado = {
        linea: index + 1,
        fecha: new Date().toLocaleDateString("es-AR"),
        responsable: responsable || "",
        hotel_origen: hotelOrigen || "",
        hotel_destino: hotelDestino || "",
        producto: producto || "",
        cantidad: cantidad || "",
        valor: valor,
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

  const prestamosValidos = prestamosParseados.filter((p) => p.valido).length
  const prestamosInvalidos = prestamosParseados.filter((p) => !p.valido).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          Ingreso Rápido Masivo
          <div className="ml-auto">{estadoConexion()}</div>
        </CardTitle>
        <CardDescription>Ingresa múltiples préstamos de una vez usando formato CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!conectado && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sin conexión a Supabase. Los préstamos no se pueden guardar en este momento.
            </AlertDescription>
          </Alert>
        )}

        {conectado && !tablaExiste && (
          <Alert variant="destructive">
            <Database className="h-4 w-4" />
            <AlertDescription>
              La tabla 'prestamos' no existe en Supabase. Ejecuta el script 'create-prestamos-table-complete.sql'
              primero.
            </AlertDescription>
          </Alert>
        )}

        {/* Formato de ejemplo */}
        <div className="space-y-2">
          <Label>Formato requerido (una línea por préstamo):</Label>
          <div className="bg-gray-50 p-3 rounded-md text-sm font-mono">
            <div className="text-gray-600 mb-2">
              Responsable, Hotel que retira, Hotel que recibe, Producto, Cantidad, Valor
            </div>
            <div className="text-gray-800">{ejemploTexto}</div>
          </div>
        </div>

        {/* Área de texto */}
        <div className="space-y-2">
          <Label htmlFor="texto-entrada">Datos de préstamos:</Label>
          <Textarea
            id="texto-entrada"
            placeholder="Pega aquí los datos de los préstamos..."
            value={textoEntrada}
            onChange={(e) => setTextoEntrada(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        {/* Botón para mostrar/ocultar vista previa */}
        {prestamosParseados.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                {prestamosValidos} válidos
              </Badge>
              {prestamosInvalidos > 0 && <Badge variant="destructive">{prestamosInvalidos} con errores</Badge>}
            </div>
            <Button type="button" variant="outline" onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)}>
              {mostrarVistaPrevia ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Ocultar Vista Previa
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mostrar Vista Previa
                </>
              )}
            </Button>
          </div>
        )}

        {/* Vista previa */}
        {mostrarVistaPrevia && prestamosParseados.length > 0 && (
          <div className="space-y-2">
            <Label>Vista previa de préstamos:</Label>
            <div className="border rounded-md max-h-64 overflow-y-auto">
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
        )}

        {/* Botón de envío */}
        <div className="flex flex-col gap-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !conectado || !tablaExiste || prestamosValidos === 0}
            className="w-full"
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
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Listo para guardar {prestamosValidos} préstamos en Supabase</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
