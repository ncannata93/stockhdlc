"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Upload, CheckCircle, AlertCircle, FileText, Users, Loader2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface AsignacionData {
  fecha: string
  empleado: string
  hotel: string
  fechaFormateada: string
  tarifa: number
  nota: string
}

interface ResultadoImportacion {
  exitosas: number
  errores: number
  empleadosCreados: string[]
  detalles: string[]
}

export default function ImportarAsignaciones() {
  const [datosTexto, setDatosTexto] = useState("")
  const [datosProcesados, setDatosProcesados] = useState<AsignacionData[]>([])
  const [errores, setErrores] = useState<string[]>([])
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const { toast } = useToast()

  const procesarDatos = () => {
    const lineas = datosTexto
      .trim()
      .split("\n")
      .filter((linea) => linea.trim())
    const procesados: AsignacionData[] = []
    const erroresEncontrados: string[] = []

    // Agrupar por empleado y fecha para calcular tarifas divididas
    const agrupados: { [key: string]: { empleado: string; fecha: string; hoteles: string[] } } = {}

    lineas.forEach((linea, index) => {
      const partes = linea
        .split(/\t+|\s{2,}/)
        .map((p) => p.trim())
        .filter((p) => p)

      if (partes.length < 3) {
        erroresEncontrados.push(
          `Línea ${index + 1}: Formato incorrecto. Debe tener 3 columnas: Fecha, Empleado, Hotel.`,
        )
        return
      }

      const [fecha, empleado, hotel] = partes

      // Validar formato de fecha DD/MM/YYYY
      const fechaRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      if (!fechaRegex.test(fecha)) {
        erroresEncontrados.push(`Línea ${index + 1}: Formato de fecha incorrecto. Use DD/MM/YYYY`)
        return
      }

      const clave = `${empleado}-${fecha}`
      if (!agrupados[clave]) {
        agrupados[clave] = { empleado, fecha, hoteles: [] }
      }
      agrupados[clave].hoteles.push(hotel)
    })

    // Procesar datos agrupados
    Object.values(agrupados).forEach((grupo) => {
      const [dia, mes, año] = grupo.fecha.split("/")
      const fechaFormateada = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
      const cantidadHoteles = grupo.hoteles.length
      const tarifaBase = 50000
      const tarifaPorHotel = tarifaBase / cantidadHoteles

      grupo.hoteles.forEach((hotel) => {
        procesados.push({
          fecha: grupo.fecha,
          empleado: grupo.empleado,
          hotel: hotel,
          fechaFormateada: fechaFormateada,
          tarifa: tarifaPorHotel,
          nota:
            cantidadHoteles > 1
              ? `Tarifa dividida entre ${cantidadHoteles} hoteles (${tarifaBase.toLocaleString()} ÷ ${cantidadHoteles})`
              : `Tarifa completa para ${hotel}`,
        })
      })
    })

    setDatosProcesados(procesados)
    setErrores(erroresEncontrados)

    if (procesados.length > 0) {
      toast({
        title: "Datos procesados",
        description: `${procesados.length} asignaciones listas para importar`,
      })
    }
  }

  const importarAsignaciones = async () => {
    if (datosProcesados.length === 0) return

    const supabase = getSupabaseClient()
    if (!supabase) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar a la base de datos",
        variant: "destructive",
      })
      return
    }

    setImportando(true)
    const empleadosCreados: string[] = []
    const detalles: string[] = []
    let exitosas = 0
    let errores = 0

    try {
      // 1. Verificar y crear empleados si no existen
      const empleadosUnicos = [...new Set(datosProcesados.map((d) => d.empleado))]

      for (const nombreEmpleado of empleadosUnicos) {
        try {
          const { data: empleadoExistente } = await supabase
            .from("employees")
            .select("id")
            .eq("name", nombreEmpleado)
            .single()

          if (!empleadoExistente) {
            const { error } = await supabase.from("employees").insert({
              name: nombreEmpleado,
              daily_rate: 50000,
              active: true,
              created_at: new Date().toISOString(),
            })

            if (!error) {
              empleadosCreados.push(nombreEmpleado)
              detalles.push(`✅ Empleado creado: ${nombreEmpleado}`)
            } else {
              detalles.push(`❌ Error creando empleado ${nombreEmpleado}: ${error.message}`)
            }
          }
        } catch (error) {
          detalles.push(`❌ Error verificando empleado ${nombreEmpleado}: ${error}`)
        }
      }

      // 2. Insertar asignaciones
      for (const asignacion of datosProcesados) {
        try {
          // Obtener ID del empleado
          const { data: empleado } = await supabase
            .from("employees")
            .select("id")
            .eq("name", asignacion.empleado)
            .single()

          if (!empleado) {
            errores++
            detalles.push(`❌ No se encontró empleado: ${asignacion.empleado}`)
            continue
          }

          // Verificar si ya existe la asignación
          const { data: existente } = await supabase
            .from("employee_assignments")
            .select("id")
            .eq("employee_id", empleado.id)
            .eq("date", asignacion.fechaFormateada)
            .eq("hotel", asignacion.hotel)
            .single()

          if (existente) {
            detalles.push(`⚠️ Ya existe: ${asignacion.empleado} - ${asignacion.hotel} - ${asignacion.fecha}`)
            continue
          }

          // Insertar asignación
          const { error } = await supabase.from("employee_assignments").insert({
            employee_id: empleado.id,
            date: asignacion.fechaFormateada,
            hotel: asignacion.hotel,
            daily_rate: asignacion.tarifa,
            notes: asignacion.nota,
            paid: false,
            created_at: new Date().toISOString(),
          })

          if (error) {
            errores++
            detalles.push(
              `❌ Error: ${asignacion.empleado} - ${asignacion.hotel} - ${asignacion.fecha}: ${error.message}`,
            )
          } else {
            exitosas++
            detalles.push(`✅ Creada: ${asignacion.empleado} - ${asignacion.hotel} - ${asignacion.fecha}`)
          }
        } catch (error) {
          errores++
          detalles.push(
            `❌ Error procesando: ${asignacion.empleado} - ${asignacion.hotel} - ${asignacion.fecha}: ${error}`,
          )
        }
      }

      setResultado({
        exitosas,
        errores,
        empleadosCreados,
        detalles,
      })

      if (exitosas > 0) {
        toast({
          title: "Importación completada",
          description: `${exitosas} asignaciones creadas, ${errores} errores`,
        })
      } else {
        toast({
          title: "Importación sin cambios",
          description: "No se crearon nuevas asignaciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error en la importación",
        description: `Ocurrió un error durante la importación: ${error}`,
        variant: "destructive",
      })
    } finally {
      setImportando(false)
    }
  }

  const limpiarDatos = () => {
    setDatosTexto("")
    setDatosProcesados([])
    setErrores([])
    setResultado(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Upload className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Importación Masiva de Asignaciones</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pegar Datos
          </CardTitle>
          <CardDescription>
            Pega los datos en formato: <code>DD/MM/YYYY [TAB] Empleado [TAB] Hotel</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📋 Ejemplo de formato:</h4>
            <pre className="text-sm text-blue-800 font-mono whitespace-pre-wrap">
              {`01/04/2025	Tucu	San Miguel
01/04/2025	Diego	San Miguel
01/04/2025	Tucu	Colores`}
            </pre>
            <p className="text-sm text-blue-700 mt-2">✅ Separa las columnas con TAB o múltiples espacios</p>
          </div>

          <Textarea
            placeholder="Pega aquí los datos a importar..."
            value={datosTexto}
            onChange={(e) => setDatosTexto(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />

          <div className="flex gap-2">
            <Button onClick={procesarDatos} disabled={!datosTexto.trim()}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Procesar Datos
            </Button>
            <Button variant="outline" onClick={limpiarDatos}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {errores.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Errores encontrados:</div>
            <ul className="list-disc list-inside space-y-1">
              {errores.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {datosProcesados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vista Previa ({datosProcesados.length} asignaciones)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto">
              {datosProcesados.slice(0, 10).map((asignacion, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{asignacion.fecha}</Badge>
                    <span className="font-medium">{asignacion.empleado}</span>
                    <span className="text-gray-600">{asignacion.hotel}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">${asignacion.tarifa.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{asignacion.nota}</div>
                  </div>
                </div>
              ))}
              {datosProcesados.length > 10 && (
                <div className="text-center text-gray-500 text-sm">... y {datosProcesados.length - 10} más</div>
              )}
            </div>

            <div className="border-b border-gray-200 my-4" />

            <Button onClick={importarAsignaciones} disabled={importando} className="w-full" size="lg">
              {importando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {datosProcesados.length} Asignaciones
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultado de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{resultado.exitosas}</div>
                <div className="text-sm text-green-700">Exitosas</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">{resultado.errores}</div>
                <div className="text-sm text-red-700">Errores</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{resultado.empleadosCreados.length}</div>
                <div className="text-sm text-blue-700">Empleados Creados</div>
              </div>
            </div>

            {resultado.empleadosCreados.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Empleados Creados:</h4>
                <div className="flex flex-wrap gap-2">
                  {resultado.empleadosCreados.map((empleado) => (
                    <Badge key={empleado} variant="secondary">
                      {empleado}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-40 overflow-y-auto">
              <h4 className="font-semibold mb-2">Detalles:</h4>
              <div className="space-y-1 text-sm">
                {resultado.detalles.map((detalle, index) => (
                  <div key={index} className="font-mono">
                    {detalle}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
