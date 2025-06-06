"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@supabase/supabase-js"
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DatabaseDiagnosis() {
  const { toast } = useToast()
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "error">("unknown")
  const [tableStatus, setTableStatus] = useState<Record<string, boolean>>({})
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  // const [activeTab, setActiveTab] = useState("connection")
  // const [connectionMessage, setConnectionMessage] = useState("")
  // const [connectionError, setConnectionError] = useState("")
  // const [checkResults, setCheckResults] = useState<Record<string, DbCheckResult>>({})
  // const [isSetupOpen, setIsSetupOpen] = useState(false)
  // const [isSaving, setIsSaving] = useState(false)

  // Cargar credenciales guardadas
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("supabaseUrl") || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const savedKey = localStorage.getItem("supabaseKey") || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      setSupabaseUrl(savedUrl)
      setSupabaseKey(savedKey)

      // Si hay credenciales guardadas, probar la conexión automáticamente
      if (savedUrl && savedKey) {
        testConnection(savedUrl, savedKey)
      }
    }
  }, [])

  // Función para probar la conexión
  const testConnection = async (url: string, key: string) => {
    setTestingConnection(true)
    setConnectionStatus("unknown")
    setTableStatus({})
    setErrorDetails(null)

    try {
      const supabase = createClient(url, key)

      // Probar la conexión básica
      const { data: connectionTest, error: connectionError } = await supabase.from("employees").select("count()", {
        count: "exact",
        head: true,
      })

      if (connectionError) {
        console.error("Error de conexión:", connectionError)
        setConnectionStatus("error")
        setErrorDetails(`Error de conexión: ${connectionError.message}`)
        return
      }

      setConnectionStatus("success")

      // Verificar tablas específicas
      const tables = ["employees", "employee_assignments", "employee_payments"]
      const tableResults: Record<string, boolean> = {}

      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select("count(*)", { count: "exact", head: true })
          tableResults[table] = !error
        } catch (err) {
          tableResults[table] = false
        }
      }

      setTableStatus(tableResults)

      // Verificar columnas específicas
      try {
        const { error } = await supabase.from("employee_assignments").select("daily_rate_used").limit(1).maybeSingle()

        if (error && error.message.includes("daily_rate_used")) {
          setErrorDetails(
            "La columna 'daily_rate_used' no existe en la tabla 'employee_assignments'. Ejecute el script de actualización.",
          )
        }
      } catch (err) {
        console.error("Error al verificar columnas:", err)
      }

      // Contar registros para diagnóstico
      try {
        const { count: employeeCount, error: empError } = await supabase
          .from("employees")
          .select("*", { count: "exact", head: true })

        if (!empError && employeeCount === 0) {
          setErrorDetails(
            (prev) =>
              `${prev ? prev + "\n\n" : ""}No hay empleados en la base de datos. Puede ser necesario restaurar los datos.`,
          )
        }
      } catch (err) {
        console.error("Error al contar empleados:", err)
      }
    } catch (err) {
      console.error("Error inesperado:", err)
      setConnectionStatus("error")
      setErrorDetails(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setTestingConnection(false)
    }
  }

  // Guardar credenciales
  const saveCredentials = () => {
    setLoading(true)
    try {
      localStorage.setItem("supabaseUrl", supabaseUrl)
      localStorage.setItem("supabaseKey", supabaseKey)
      toast({
        title: "Credenciales guardadas",
        description: "Las credenciales de Supabase han sido guardadas correctamente.",
      })
      testConnection(supabaseUrl, supabaseKey)
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las credenciales.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Restaurar datos de ejemplo
  const restoreExampleData = async () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({
        title: "Error",
        description: "Configure las credenciales de Supabase primero.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Verificar si ya hay datos
      const { count: employeeCount, error: countError } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })

      if (countError) {
        throw new Error(`Error al verificar empleados: ${countError.message}`)
      }

      // Solo restaurar si no hay empleados
      if (employeeCount === 0) {
        // Insertar empleados de ejemplo
        const { error: insertError } = await supabase.from("employees").insert([
          { name: "Juan Pérez", role: "Mantenimiento", daily_rate: 50000 },
          { name: "María López", role: "Limpieza", daily_rate: 45000 },
          { name: "Carlos Rodríguez", role: "Mantenimiento", daily_rate: 52000 },
        ])

        if (insertError) {
          throw new Error(`Error al insertar empleados: ${insertError.message}`)
        }

        toast({
          title: "Datos restaurados",
          description: "Se han agregado empleados de ejemplo a la base de datos.",
        })
      } else {
        toast({
          title: "Información",
          description: "Ya existen empleados en la base de datos. No se han agregado datos de ejemplo.",
        })
      }

      // Actualizar estado
      testConnection(supabaseUrl, supabaseKey)
    } catch (err) {
      console.error("Error al restaurar datos:", err)
      toast({
        title: "Error",
        description: `No se pudieron restaurar los datos: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Diagnóstico de Base de Datos
          </CardTitle>
          <CardDescription>Verifique la conexión a Supabase y el estado de las tablas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">URL de Supabase</Label>
                <div className="flex gap-2">
                  <Input
                    id="supabase-url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supabase-key">API Key (anon/public)</Label>
                <div className="flex gap-2">
                  <Input
                    id="supabase-key"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    type={showCredentials ? "text" : "password"}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-credentials"
                checked={showCredentials}
                onChange={() => setShowCredentials(!showCredentials)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="show-credentials" className="text-sm cursor-pointer">
                Mostrar credenciales
              </Label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={saveCredentials} disabled={loading || !supabaseUrl || !supabaseKey}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar y Probar Conexión
              </Button>
              <Button
                variant="outline"
                onClick={() => testConnection(supabaseUrl, supabaseKey)}
                disabled={testingConnection || !supabaseUrl || !supabaseKey}
              >
                {testingConnection ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Probar Conexión
              </Button>
              <Button
                variant="secondary"
                onClick={restoreExampleData}
                disabled={loading || connectionStatus !== "success"}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Restaurar Datos de Ejemplo
              </Button>
            </div>

            {/* Estado de la conexión */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="font-medium">Estado de la conexión:</div>
                {connectionStatus === "unknown" ? (
                  <span className="text-gray-500">No probado</span>
                ) : connectionStatus === "success" ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Conectado
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Error de conexión
                  </span>
                )}
              </div>

              {/* Estado de las tablas */}
              {connectionStatus === "success" && (
                <div>
                  <div className="font-medium mb-2">Estado de las tablas:</div>
                  <ul className="space-y-1">
                    {Object.entries(tableStatus).map(([table, exists]) => (
                      <li key={table} className="flex items-center gap-2">
                        {exists ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-mono text-sm">{table}</span>
                        {!exists && (
                          <span className="text-red-600 text-xs">
                            (No encontrada - Ejecute el script de creación de tablas)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detalles de error */}
              {errorDetails && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Problemas detectados</AlertTitle>
                  <AlertDescription className="whitespace-pre-line">{errorDetails}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Las credenciales se guardan en localStorage para facilitar las pruebas.
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solución de Problemas Comunes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">1. No se pueden ver los empleados</h3>
              <p className="text-sm text-muted-foreground">
                Si los empleados no aparecen, puede ser que la tabla esté vacía o haya problemas de permisos. Use el
                botón "Restaurar Datos de Ejemplo" para agregar empleados de prueba.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1">2. Las asignaciones no se guardan</h3>
              <p className="text-sm text-muted-foreground">
                Verifique que la tabla employee_assignments exista y tenga la estructura correcta. Ejecute el script de
                creación de tablas si es necesario.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1">3. Error con tarifas históricas</h3>
              <p className="text-sm text-muted-foreground">
                Si hay errores relacionados con "daily_rate_used", ejecute el script para agregar esta columna a la
                tabla de asignaciones.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1">4. Problemas de permisos</h3>
              <p className="text-sm text-muted-foreground">
                Asegúrese de que la API Key tenga permisos para leer y escribir en las tablas. Verifique las políticas
                de RLS en Supabase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
