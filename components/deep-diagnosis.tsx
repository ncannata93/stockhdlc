"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@supabase/supabase-js"
import { Loader2, AlertCircle, CheckCircle, XCircle, Database, Code, Save, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LogEntry {
  timestamp: Date
  type: "info" | "error" | "success" | "warning"
  message: string
  details?: string
}

export function DeepDiagnosis() {
  const { toast } = useToast()
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeTab, setActiveTab] = useState("connection")
  const [showCredentials, setShowCredentials] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [offlineMode, setOfflineMode] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Cargar credenciales guardadas
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("supabaseUrl") || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const savedKey = localStorage.getItem("supabaseKey") || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      setSupabaseUrl(savedUrl)
      setSupabaseKey(savedKey)

      // Verificar si el modo offline está activado
      const offline = localStorage.getItem("offlineMode") === "true"
      setOfflineMode(offline)

      if (offline) {
        addLog(
          "info",
          "Modo offline activado",
          "El sistema está funcionando en modo offline. Los datos se guardan localmente.",
        )
      }
    }
  }, [])

  // Función para agregar un log
  const addLog = (type: LogEntry["type"], message: string, details?: string) => {
    setLogs((prev) => [...prev, { timestamp: new Date(), type, message, details }])
    // Scroll al final de los logs
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  // Guardar credenciales
  const saveCredentials = () => {
    setLoading(true)
    try {
      localStorage.setItem("supabaseUrl", supabaseUrl)
      localStorage.setItem("supabaseKey", supabaseKey)
      addLog("success", "Credenciales guardadas", `URL: ${supabaseUrl.substring(0, 15)}...`)
      toast({
        title: "Credenciales guardadas",
        description: "Las credenciales de Supabase han sido guardadas correctamente.",
      })
      runDiagnostics()
    } catch (err) {
      addLog("error", "Error al guardar credenciales", err instanceof Error ? err.message : String(err))
      toast({
        title: "Error",
        description: "No se pudieron guardar las credenciales.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar diagnóstico completo
  const runDiagnostics = async () => {
    setLoading(true)
    setTestResults({})
    addLog("info", "Iniciando diagnóstico completo", "Verificando conexión y estructura de la base de datos...")

    try {
      if (!supabaseUrl || !supabaseKey) {
        addLog("error", "Faltan credenciales", "Se requieren URL y API Key de Supabase")
        return
      }

      // Crear cliente de Supabase
      const supabase = createClient(supabaseUrl, supabaseKey)
      addLog("info", "Cliente Supabase creado", "Intentando conectar...")

      // Test 1: Verificar conexión básica
      try {
        const { data, error } = await supabase.from("employees").select("count", { count: "exact", head: true })

        if (error) {
          addLog("error", "Error de conexión", error.message)
          setTestResults((prev) => ({ ...prev, connection: false }))
        } else {
          addLog("success", "Conexión exitosa", "Se pudo conectar a Supabase correctamente")
          setTestResults((prev) => ({ ...prev, connection: true }))
        }
      } catch (err) {
        addLog("error", "Error inesperado de conexión", err instanceof Error ? err.message : String(err))
        setTestResults((prev) => ({ ...prev, connection: false }))
      }

      // Test 2: Verificar tabla de empleados
      try {
        const { data, error } = await supabase.from("employees").select("id, name").limit(1)

        if (error) {
          addLog("error", "Error al acceder a tabla employees", error.message)
          setTestResults((prev) => ({ ...prev, employees: false }))
        } else {
          addLog("success", "Tabla employees accesible", `Registros recuperados: ${data?.length || 0}`)
          setTestResults((prev) => ({ ...prev, employees: true }))
        }
      } catch (err) {
        addLog("error", "Error inesperado con tabla employees", err instanceof Error ? err.message : String(err))
        setTestResults((prev) => ({ ...prev, employees: false }))
      }

      // Test 3: Verificar tabla de asignaciones
      try {
        const { data, error } = await supabase.from("employee_assignments").select("id, employee_id").limit(1)

        if (error) {
          addLog("error", "Error al acceder a tabla employee_assignments", error.message)
          setTestResults((prev) => ({ ...prev, assignments: false }))
        } else {
          addLog("success", "Tabla employee_assignments accesible", `Registros recuperados: ${data?.length || 0}`)
          setTestResults((prev) => ({ ...prev, assignments: true }))
        }
      } catch (err) {
        addLog(
          "error",
          "Error inesperado con tabla employee_assignments",
          err instanceof Error ? err.message : String(err),
        )
        setTestResults((prev) => ({ ...prev, assignments: false }))
      }

      // Test 4: Verificar columna daily_rate_used
      try {
        const { data, error } = await supabase.from("employee_assignments").select("daily_rate_used").limit(1)

        if (error && error.message.includes("daily_rate_used")) {
          addLog("error", "Columna daily_rate_used no existe", error.message)
          setTestResults((prev) => ({ ...prev, dailyRateColumn: false }))
        } else {
          addLog("success", "Columna daily_rate_used existe", "La columna está disponible")
          setTestResults((prev) => ({ ...prev, dailyRateColumn: true }))
        }
      } catch (err) {
        addLog("error", "Error al verificar columna daily_rate_used", err instanceof Error ? err.message : String(err))
        setTestResults((prev) => ({ ...prev, dailyRateColumn: false }))
      }

      // Test 5: Intentar insertar un empleado de prueba
      try {
        const testEmployee = {
          name: `Test Employee ${new Date().getTime()}`,
          role: "Test",
          daily_rate: 10000,
        }

        addLog("info", "Intentando insertar empleado de prueba", JSON.stringify(testEmployee))

        const { data, error } = await supabase.from("employees").insert(testEmployee).select()

        if (error) {
          addLog("error", "Error al insertar empleado de prueba", error.message)
          setTestResults((prev) => ({ ...prev, writePermission: false }))
        } else {
          addLog("success", "Empleado de prueba insertado correctamente", `ID: ${data?.[0]?.id}`)
          setTestResults((prev) => ({ ...prev, writePermission: true }))

          // Eliminar el empleado de prueba
          if (data?.[0]?.id) {
            const { error: deleteError } = await supabase.from("employees").delete().eq("id", data[0].id)
            if (deleteError) {
              addLog("warning", "No se pudo eliminar el empleado de prueba", deleteError.message)
            } else {
              addLog("info", "Empleado de prueba eliminado correctamente", `ID: ${data[0].id}`)
            }
          }
        }
      } catch (err) {
        addLog("error", "Error inesperado al insertar empleado", err instanceof Error ? err.message : String(err))
        setTestResults((prev) => ({ ...prev, writePermission: false }))
      }

      // Diagnóstico completo
      addLog("info", "Diagnóstico completo", "Revise los resultados para identificar problemas")
    } catch (err) {
      addLog("error", "Error general en diagnóstico", err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // Activar/desactivar modo offline
  const toggleOfflineMode = () => {
    const newMode = !offlineMode
    setOfflineMode(newMode)
    localStorage.setItem("offlineMode", newMode.toString())

    if (newMode) {
      addLog("warning", "Modo offline activado", "Los datos se guardarán localmente hasta que se restaure la conexión")
      toast({
        title: "Modo offline activado",
        description: "Los datos se guardarán localmente. Recuerde sincronizar cuando la conexión se restaure.",
      })
    } else {
      addLog("info", "Modo offline desactivado", "El sistema intentará usar la base de datos remota")
      toast({
        title: "Modo offline desactivado",
        description: "El sistema intentará conectarse a la base de datos remota.",
      })
    }
  }

  // Ejecutar script SQL
  const runSqlScript = async () => {
    setLoading(true)
    addLog("info", "Ejecutando script SQL", "Creando tablas y estructura necesaria...")

    try {
      if (!supabaseUrl || !supabaseKey) {
        addLog("error", "Faltan credenciales", "Se requieren URL y API Key de Supabase")
        return
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      // Script SQL completo
      const sqlScript = `
-- Crear tabla de empleados si no existe
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  daily_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de asignaciones si no existe
CREATE TABLE IF NOT EXISTS employee_assignments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  hotel_name TEXT,
  assignment_date DATE,
  daily_rate_used NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT
);

-- Crear tabla de pagos si no existe
CREATE TABLE IF NOT EXISTS employee_payments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  amount NUMERIC DEFAULT 0,
  payment_date DATE,
  week_start DATE,
  week_end DATE,
  status TEXT DEFAULT 'pendiente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT
);

-- Agregar columna daily_rate_used si no existe
ALTER TABLE employee_assignments 
ADD COLUMN IF NOT EXISTS daily_rate_used NUMERIC DEFAULT 0;

-- Actualizar los registros existentes con la tarifa actual del empleado
UPDATE employee_assignments a
SET daily_rate_used = e.daily_rate
FROM employees e
WHERE a.employee_id = e.id AND (a.daily_rate_used IS NULL OR a.daily_rate_used = 0);
      `

      // Ejecutar el script SQL usando la API REST de Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ sql_query: sqlScript }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        addLog("error", "Error al ejecutar SQL", `Status: ${response.status}, Error: ${errorText}`)
      } else {
        addLog("success", "Script SQL ejecutado correctamente", "Las tablas han sido creadas o actualizadas")

        // Verificar si la función exec_sql existe
        if (response.status === 404) {
          addLog("warning", "La función exec_sql no existe", "Es posible que necesite crear esta función en Supabase")
        }

        // Ejecutar diagnóstico para verificar los cambios
        setTimeout(() => {
          runDiagnostics()
        }, 1000)
      }
    } catch (err) {
      addLog("error", "Error al ejecutar script SQL", err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // Restaurar datos de ejemplo
  const restoreExampleData = async () => {
    setLoading(true)
    addLog("info", "Restaurando datos de ejemplo", "Agregando empleados de ejemplo...")

    try {
      if (!supabaseUrl || !supabaseKey) {
        addLog("error", "Faltan credenciales", "Se requieren URL y API Key de Supabase")
        return
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      // Verificar si ya hay empleados
      const { count, error: countError } = await supabase.from("employees").select("*", { count: "exact", head: true })

      if (countError) {
        addLog("error", "Error al verificar empleados existentes", countError.message)
        return
      }

      if (count && count > 0) {
        addLog(
          "warning",
          "Ya existen empleados",
          `Se encontraron ${count} empleados. No se agregarán datos de ejemplo.`,
        )
        return
      }

      // Insertar empleados de ejemplo
      const exampleEmployees = [
        { name: "Juan Pérez", role: "Mantenimiento", daily_rate: 50000 },
        { name: "María López", role: "Limpieza", daily_rate: 45000 },
        { name: "Carlos Rodríguez", role: "Mantenimiento", daily_rate: 52000 },
        { name: "Ana Martínez", role: "Recepción", daily_rate: 48000 },
        { name: "Roberto Sánchez", role: "Mantenimiento", daily_rate: 51000 },
      ]

      const { data, error } = await supabase.from("employees").insert(exampleEmployees).select()

      if (error) {
        addLog("error", "Error al insertar empleados de ejemplo", error.message)
      } else {
        addLog("success", "Empleados de ejemplo insertados correctamente", `Se agregaron ${data.length} empleados`)
      }
    } catch (err) {
      addLog("error", "Error al restaurar datos de ejemplo", err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // Limpiar logs
  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Diagnóstico Profundo de Base de Datos
          </CardTitle>
          <CardDescription>Herramienta avanzada para diagnosticar y solucionar problemas de conexión</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="connection">Conexión</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnóstico</TabsTrigger>
              <TabsTrigger value="solutions">Soluciones</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supabase-url">URL de Supabase</Label>
                  <Input
                    id="supabase-url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supabase-key">API Key (anon/public)</Label>
                  <Input
                    id="supabase-key"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    type={showCredentials ? "text" : "password"}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                  />
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
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Credenciales
                </Button>
                <Button variant="outline" onClick={runDiagnostics} disabled={loading || !supabaseUrl || !supabaseKey}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Probar Conexión
                </Button>
              </div>

              <Alert variant={offlineMode ? "warning" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Modo Offline</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>
                    {offlineMode
                      ? "El sistema está funcionando en modo offline. Los datos se guardan localmente."
                      : "El sistema está intentando usar la base de datos remota."}
                  </p>
                  <Button variant="outline" size="sm" onClick={toggleOfflineMode}>
                    {offlineMode ? "Desactivar modo offline" : "Activar modo offline"}
                  </Button>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="diagnostics" className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button onClick={runDiagnostics} disabled={loading || !supabaseUrl || !supabaseKey}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Ejecutar Diagnóstico Completo
                </Button>
                <Button variant="outline" onClick={clearLogs} disabled={loading}>
                  Limpiar Logs
                </Button>
              </div>

              <div className="border rounded-md">
                <div className="bg-muted px-4 py-2 border-b font-medium flex justify-between items-center">
                  <div>Logs de Diagnóstico</div>
                  <div className="text-xs text-muted-foreground">{logs.length} entradas</div>
                </div>
                <ScrollArea className="h-[300px] p-4">
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className={`text-sm p-2 rounded ${
                          log.type === "error"
                            ? "bg-red-50 border border-red-200 text-red-800"
                            : log.type === "success"
                              ? "bg-green-50 border border-green-200 text-green-800"
                              : log.type === "warning"
                                ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                                : "bg-blue-50 border border-blue-200 text-blue-800"
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{log.message}</span>
                          <span className="text-xs opacity-70">{log.timestamp.toLocaleTimeString()}</span>
                        </div>
                        {log.details && (
                          <div className="mt-1 text-xs font-mono bg-white/50 p-1 rounded overflow-x-auto">
                            {log.details}
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {Object.keys(testResults).length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Resultados del Diagnóstico:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(testResults).map(([test, result]) => (
                      <div
                        key={test}
                        className={`flex items-center gap-2 p-2 rounded ${
                          result ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                        }`}
                      >
                        {result ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>
                          {test === "connection"
                            ? "Conexión a Supabase"
                            : test === "employees"
                              ? "Tabla de empleados"
                              : test === "assignments"
                                ? "Tabla de asignaciones"
                                : test === "dailyRateColumn"
                                  ? "Columna daily_rate_used"
                                  : test === "writePermission"
                                    ? "Permisos de escritura"
                                    : test}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="solutions" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Soluciones Disponibles</AlertTitle>
                <AlertDescription>
                  Seleccione una de las siguientes opciones para intentar solucionar los problemas detectados.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Crear Estructura de Base de Datos</CardTitle>
                    <CardDescription>Ejecuta un script SQL para crear todas las tablas necesarias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Este script creará las tablas si no existen y agregará la columna daily_rate_used.
                    </p>
                    <Button onClick={runSqlScript} disabled={loading || !supabaseUrl || !supabaseKey}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Code className="mr-2 h-4 w-4" />}
                      Ejecutar Script SQL
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Restaurar Datos de Ejemplo</CardTitle>
                    <CardDescription>Agrega empleados de ejemplo a la base de datos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esto agregará 5 empleados de ejemplo si la tabla está vacía.
                    </p>
                    <Button onClick={restoreExampleData} disabled={loading || !supabaseUrl || !supabaseKey}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Database className="mr-2 h-4 w-4" />
                      )}
                      Restaurar Datos de Ejemplo
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Modo Offline</CardTitle>
                  <CardDescription>Trabaje sin conexión a la base de datos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Si no puede solucionar los problemas de conexión, active el modo offline para seguir trabajando. Los
                    datos se guardarán localmente en el navegador.
                  </p>
                  <Button variant={offlineMode ? "default" : "outline"} onClick={toggleOfflineMode}>
                    {offlineMode ? "Desactivar Modo Offline" : "Activar Modo Offline"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Esta herramienta avanzada ayuda a diagnosticar y solucionar problemas de conexión con la base de datos.
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
