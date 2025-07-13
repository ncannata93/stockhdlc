"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Upload,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Cloud,
  WifiOff,
  Database,
  FileText,
  Copy,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  crearPrestamosMasivos,
  obtenerHoteles,
  obtenerResponsables,
  verificarConexion,
  verificarTablaPrestamons,
  formatearMonto,
  type PrestamoInput,
} from "@/lib/prestamos-supabase"

interface IngresoRapidoProps {
  onPrestamoCreado?: () => void
}

interface PrestamoParseado {
  linea: number
  datos: PrestamoInput
  valido: boolean
  errores: string[]
}

export function IngresoRapido({ onPrestamoCreado }: IngresoRapidoProps) {
  const { toast } = useToast()
  const [textoMasivo, setTextoMasivo] = useState("")
  const [prestamosParseados, setPrestamosParseados] = useState<PrestamoParseado[]>([])
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [tablaExiste, setTablaExiste] = useState(false)
  const [hoteles, setHoteles] = useState<string[]>([])
  const [responsables, setResponsables] = useState<string[]>([])

  // Ejemplo de formato
  const ejemploTexto = `Nicolas Cannata, Jaguel, Monaco, Efectivo, 1, 50000
Juan Manuel, Argentina, Falkner, Toallas, 20, 15000
Nacho, Stromboli, San Miguel, Sábanas, 10, 25000`

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [conexion, tabla] = await Promise.all([verificarConexion(), verificarTablaPrestamons()])
        setConectado(conexion.conectado)
        setTablaExiste(tabla.existe)

        if (conexion.conectado && tabla.existe) {
          const [hotelesData, responsablesData] = await Promise.all([obtenerHoteles(), obtenerResponsables()])
          setHoteles(hotelesData)
          setResponsables(responsablesData)
        } else {
          // Usar datos predefinidos si no hay conexión
          setHoteles([
            "Jaguel",
            "Monaco",
            "Mallak",
            "Argentina",
            "Falkner",
            "Stromboli",
            "San Miguel",
            "Colores",
            "Puntarenas",
            "Tupe",
            "Munich",
            "Tiburones",
            "Barlovento",
            "Carama",
          ])
          setResponsables(["Nicolas Cannata", "Juan Manuel", "Nacho", "Diego", "Administrador", "Gerente"])
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setConectado(false)
        setTablaExiste(false)
      }
    }
    cargarDatos()
  }, [])

  // Parsear texto cuando cambie
  useEffect(() => {
    if (textoMasivo.trim()) {
      parsearTexto(textoMasivo)
    } else {
      setPrestamosParseados([])
    }
  }, [textoMasivo, hoteles, responsables])

  const parsearTexto = (texto: string) => {
    const lineas = texto
      .split("\n")
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0)

    const prestamosParseados: PrestamoParseado[] = lineas.map((linea, index) => {
      const numeroLinea = index + 1
      const partes = linea.split(",").map((parte) => parte.trim())

      const errores: string[] = []
      let valido = true

      // Validar número de campos
      if (partes.length < 6) {
        errores.push(`Se esperan 6 campos, se encontraron ${partes.length}`)
        valido = false
      }

      const [responsable, hotelOrigen, hotelDestino, producto, cantidad, valorStr] = partes

      // Validar responsable
      if (!responsable) {
        errores.push("Responsable requerido")
        valido = false
      }

      // Validar hoteles
      if (!hotelOrigen) {
        errores.push("Hotel origen requerido")
        valido = false
      }
      if (!hotelDestino) {
        errores.push("Hotel destino requerido")
        valido = false
      }
      if (hotelOrigen === hotelDestino) {
        errores.push("Hotel origen y destino no pueden ser iguales")
        valido = false
      }

      // Validar producto
      if (!producto) {
        errores.push("Producto requerido")
        valido = false
      }

      // Validar valor
      const valor = Number.parseFloat(valorStr)
      if (isNaN(valor) || valor <= 0) {
        errores.push("Valor debe ser un número mayor a 0")
        valido = false
      }

      const datos: PrestamoInput = {
        responsable: responsable || "",
        hotel_origen: hotelOrigen || "",
        hotel_destino: hotelDestino || "",
        producto: producto || "",
        cantidad: cantidad || "",
        valor: valor || 0,
        estado: "pendiente",
      }

      return {
        linea: numeroLinea,
        datos,
        valido,
        errores,
      }
    })

    setPrestamosParseados(prestamosParseados)
  }

  const procesarPrestamos = async () => {
    if (!conectado || !tablaExiste) {
      toast({
        title: "Error de conexión",
        description: "No hay conexión a Supabase o la tabla no existe",
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
      const resultado = await crearPrestamosMasivos(prestamosValidos.map((p) => p.datos))

      if (resultado.exitosos > 0) {
        toast({
          title: "✅ Préstamos creados",
          description: `${resultado.exitosos} préstamos creados exitosamente`,
        })

        // Limpiar formulario
        setTextoMasivo("")
        setPrestamosParseados([])
        setMostrarVistaPrevia(false)

        onPrestamoCreado?.()
      }

      if (resultado.errores.length > 0) {
        toast({
          title: "Algunos errores",
          description: `${resultado.errores.length} errores encontrados`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al crear préstamos:", error)
      toast({
        title: "Error al crear préstamos",
        description: "No se pudieron crear los préstamos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copiarEjemplo = () => {
    setTextoMasivo(ejemploTexto)
    toast({
      title: "Ejemplo copiado",
      description: "Se ha copiado el ejemplo al área de texto",
    })
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
        <CardDescription>
          Ingresa múltiples préstamos de una vez usando formato de texto separado por comas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!conectado && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Sin conexión a Supabase. No se pueden crear préstamos.</AlertDescription>
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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-800 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Formato requerido
            </h4>
            <Button variant="outline" size="sm" onClick={copiarEjemplo}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar ejemplo
            </Button>
          </div>
          <p className="text-sm text-blue-700 mb-2">
            <strong>Formato:</strong> Responsable, Hotel que retira, Hotel que recibe, Producto, Cantidad, Valor
          </p>
          <div className="bg-white p-3 rounded border font-mono text-sm">
            <div className="text-gray-600">Nicolas Cannata, Jaguel, Monaco, Efectivo, 1, 50000</div>
            <div className="text-gray-600">Juan Manuel, Argentina, Falkner, Toallas, 20, 15000</div>
            <div className="text-gray-600">Nacho, Stromboli, San Miguel, Sábanas, 10, 25000</div>
          </div>
        </div>

        {/* Área de texto */}
        <div className="space-y-2">
          <Label htmlFor="texto-masivo">Datos de préstamos (una línea por préstamo)</Label>
          <Textarea
            id="texto-masivo"
            placeholder="Pega aquí los datos de los préstamos, uno por línea..."
            value={textoMasivo}
            onChange={(e) => setTextoMasivo(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
          <div className="text-xs text-gray-500">
            Formato: Responsable, Hotel origen, Hotel destino, Producto, Cantidad, Valor
          </div>
        </div>

        {/* Estadísticas de parsing */}
        {prestamosParseados.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                <strong>{prestamosValidos}</strong> válidos
              </span>
            </div>
            {prestamosInvalidos > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">
                  <strong>{prestamosInvalidos}</strong> con errores
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)}
              className="ml-auto"
            >
              {mostrarVistaPrevia ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {mostrarVistaPrevia ? "Ocultar" : "Vista previa"}
            </Button>
          </div>
        )}

        {/* Vista previa */}
        {mostrarVistaPrevia && prestamosParseados.length > 0 && (
          <div className="border rounded-lg">
            <div className="p-3 bg-gray-50 border-b">
              <h4 className="font-medium">Vista previa de préstamos</h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
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
                      <TableCell className="text-sm">{prestamo.datos.responsable}</TableCell>
                      <TableCell className="text-sm">
                        <span className="text-blue-600">{prestamo.datos.hotel_origen}</span>
                        <span className="mx-1">→</span>
                        <span className="text-green-600">{prestamo.datos.hotel_destino}</span>
                      </TableCell>
                      <TableCell className="text-sm">{prestamo.datos.producto}</TableCell>
                      <TableCell className="text-sm">{prestamo.datos.cantidad || "-"}</TableCell>
                      <TableCell className="text-sm font-medium">{formatearMonto(prestamo.datos.valor)}</TableCell>
                      <TableCell>
                        {prestamo.valido ? (
                          <Badge variant="default" className="text-xs">
                            Válido
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                            <div className="text-xs text-red-600">
                              {prestamo.errores.map((error, index) => (
                                <div key={index}>• {error}</div>
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

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            onClick={procesarPrestamos}
            disabled={isLoading || prestamosValidos === 0 || !conectado || !tablaExiste}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Crear {prestamosValidos} préstamos
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTextoMasivo("")
              setPrestamosParseados([])
              setMostrarVistaPrevia(false)
            }}
            disabled={isLoading}
          >
            Limpiar
          </Button>
        </div>

        {/* Ayuda */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Consejos:</strong>
            <ul className="mt-1 text-sm space-y-1">
              <li>• Cada línea representa un préstamo</li>
              <li>• Separa los campos con comas</li>
              <li>• El valor debe ser un número sin símbolos</li>
              <li>• Usa la vista previa para verificar antes de crear</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
