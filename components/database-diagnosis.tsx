"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, CheckCircle, XCircle, Database, RefreshCw, ServerCrash, ChevronDown } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface DbCheckResult {
  success: boolean
  message: string
  error?: string
  data?: any
}

export function DatabaseDiagnosis() {
  const [loading, setLoading] = useState(true)
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [activeTab, setActiveTab] = useState("connection")
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "error">("unknown")
  const [connectionMessage, setConnectionMessage] = useState("")
  const [connectionError, setConnectionError] = useState("")
  const [checkResults, setCheckResults] = useState<Record<string, DbCheckResult>>({})
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Cargar credenciales guardadas
  useEffect(() => {
    const savedUrl = localStorage.getItem("supabaseUrl") || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const savedKey = localStorage.getItem("supabaseKey") || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    setSupabaseUrl(savedUrl)
    setSupabaseKey(savedKey)
    setLoading(false)

    // Si hay credenciales, verificar conexión automáticamente
    if (savedUrl && savedKey) {
      checkConnection(savedUrl, savedKey)
    }
  }, [])

  // Función para guardar credenciales
  const saveCredentials = () => {
    setIsSaving(true)
    try {
      localStorage.setItem("supabaseUrl", supabaseUrl)
      localStorage.setItem("supabaseKey", supabaseKey)

      // Verificar conexión con las nuevas credenciales
      checkConnection(supabaseUrl, supabaseKey)
    } catch (error) {
      console.error("Error al guardar credenciales:", error)
      setConnectionStatus("error")
      setConnectionMessage("Error al guardar credenciales")
      setConnectionError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSaving(false)
    }
  }

  // Verificar conexión a Supabase
  const checkConnection = async (url = supabaseUrl, key = supabaseKey) => {
    setLoading(true)
    setConnectionStatus("unknown")
    setConnectionMessage("Verificando conexión...")
    setConnectionError("")
    setCheckResults({})

    try {
      if (!url || !key) {
        setConnectionStatus("error")
        setConnectionMessage("Se requieren credenciales de Supabase")
        return
      }

      // Crear cliente de Supabase
      const supabase = createClient(url, key)

      // Verificar conexión básica
      const { data, error } = await supabase.from("employees").select("count", { count: "exact", head: true })

      if (error) {
        console.error("Error de conexión:", error)
        setConnectionStatus("error")
        setConnectionMessage("Error al conectar con Supabase")
        setConnectionError(error.message)
        return
      }

      setConnectionStatus("success")
      setConnectionMessage("Conexión establecida correctamente")

      // Una vez conectado, realizar verificaciones adicionales
      performDatabaseChecks(supabase)
    } catch (error) {
      console.error("Error inesperado:", error)
      setConnectionStatus("error")
      setConnectionMessage("Error inesperado")
      setConnectionError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  // Realizar verificaciones en la base de datos
  const performDatabaseChecks = async (supabase: ReturnType<typeof createClient>) => {
    const results: Record<string, DbCheckResult> = {}

    // 1. Verificar tabla de empleados
    try {
      const { data, error } = await supabase.from("employees").select("id, name").limit(1)

      results.employees = {
        success: !error,
        message: !error
          ? `Tabla "employees" accesible. ${data?.length || 0} registros recuperados.`
          : "Error al acceder a la tabla 'employees'",
        error: error?.message,
        data: data,
      }
    } catch (error) {
      results.employees = {
        success: false,
        message: "Error al verificar tabla 'employees'",
        error: error instanceof Error ? error.message : String(error),
      }
    }

    // 2. Verificar tabla de asignaciones
    try {
      const { data, error } = await supabase.from("employee_assignments").select("id, employee_id, hotel_name").limit(1)

      results.assignments = {
        success: !error,
        message: !error
          ? `Tabla "employee_assignments" accesible. ${data?.length || 0} registros recuperados.`
          : "Error al acceder a la tabla 'employee_assignments'",
        error: error?.message,
        data: data,
      }
    } catch (error) {
      results.assignments = {
        success: false,
        message: "Error al verificar tabla 'employee_assignments'",
        error: error instanceof Error ? error.message : String(error),
      }
    }

    // 3. Verificar tabla de pagos
    try {
      const { data, error } = await supabase.from("employee_payments").select("id, employee_id, status").limit(1)

      results.payments = {
        success: !error,
        message: !error
          ? `Tabla "employee_payments" accesible. ${data?.length || 0} registros recuperados.`
          : "Error al acceder a la tabla 'employee_payments'",
        error: error?.message,
        data: data,
      }
    } catch (error) {
      results.payments = {
        success: false,
        message: "Error al verificar tabla 'employee_payments'",
        error: error instanceof Error ? error.message : String(error),
      }
    }

    // 4. Verificar columna daily_rate_used
    try {
      const { data, error } = await supabase.from("employee_assignments").select("daily_rate_used").limit(1)

      results.dailyRateColumn = {
        success: !error,
        message: !error
          ? "Columna 'daily_rate_used' existe en la tabla 'employee_assignments'"
          : "La columna 'daily_rate_used' no existe en la tabla 'employee_assignments'",
        error: error?.message,
      }
    } catch (error) {
      results.dailyRateColumn = {
        success: false,
        message: "Error al verificar columna 'daily_rate_used'",
        error: error instanceof Error ? error.message : String(error),
      }
    }

    setCheckResults(results)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Diagnóstico de Base de Datos
        </CardTitle>
        <CardDescription>Verifique la conexión y el estado de la base de datos</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="connection">Conexión</TabsTrigger>
            <TabsTrigger value="tables">Tablas y Estructura</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <Alert
              variant={
                connectionStatus === "unknown" ? "default" : connectionStatus === "success" ? "default" : "destructive"
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : connectionStatus === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : connectionStatus === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <AlertTitle>
                {loading
                  ? "Verificando conexión..."
                  : connectionStatus === "success"
                    ? "Conexión exitosa"
                    : connectionStatus === "error"
                      ? "Error de conexión"
                      : "Estado de conexión desconocido"}
              </AlertTitle>
              <AlertDescription>
                {connectionMessage}
                {connectionError && (
                  <div className="mt-2 text-sm font-mono bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                    {connectionError}
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <Collapsible open={isSetupOpen} onOpenChange={setIsSetupOpen} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full flex justify-between">
                  <span>Configuración de Supabase</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isSetupOpen ? "transform rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
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
                  <Label htmlFor="supabase-key">API Key de Supabase</Label>
                  <Input
                    id="supabase-key"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    type="password"
                    placeholder="eyJh..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Debe ser la clave anónima o de servicio con permisos a las tablas necesarias
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button onClick={saveCredentials} disabled={isSaving || !supabaseUrl || !supabaseKey}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Guardar y conectar
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => checkConnection()}
                disabled={loading || !supabaseUrl || !supabaseKey}
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Verificar conexión
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            {connectionStatus !== "success" ? (
              <Alert>
                <ServerCrash className="h-4 w-4" />
                <AlertTitle>Se requiere conexión</AlertTitle>
                <AlertDescription>
                  Establezca una conexión exitosa para verificar las tablas de la base de datos
                </AlertDescription>
              </Alert>
            ) : Object.keys(checkResults).length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Resultados para tabla de empleados */}
                  <Alert variant={checkResults.employees?.success ? "default" : "destructive"}>
                    {checkResults.employees?.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>Tabla de Empleados</AlertTitle>
                    <AlertDescription>
                      {checkResults.employees?.message}
                      {checkResults.employees?.error && (
                        <div className="mt-2 text-sm font-mono bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                          {checkResults.employees.error}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>

                  {/* Resultados para tabla de asignaciones */}
                  <Alert variant={checkResults.assignments?.success ? "default" : "destructive"}>
                    {checkResults.assignments?.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>Tabla de Asignaciones</AlertTitle>
                    <AlertDescription>
                      {checkResults.assignments?.message}
                      {checkResults.assignments?.error && (
                        <div className="mt-2 text-sm font-mono bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                          {checkResults.assignments.error}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>

                  {/* Resultados para tabla de pagos */}
                  <Alert variant={checkResults.payments?.success ? "default" : "destructive"}>
                    {checkResults.payments?.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>Tabla de Pagos</AlertTitle>
                    <AlertDescription>
                      {checkResults.payments?.message}
                      {checkResults.payments?.error && (
                        <div className="mt-2 text-sm font-mono bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                          {checkResults.payments.error}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>

                  {/* Resultados para columna daily_rate_used */}
                  <Alert variant={checkResults.dailyRateColumn?.success ? "default" : "destructive"}>
                    {checkResults.dailyRateColumn?.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>Columna Tarifa Diaria Histórica</AlertTitle>
                    <AlertDescription>
                      {checkResults.dailyRateColumn?.message}
                      {checkResults.dailyRateColumn?.error && (
                        <div className="mt-2 text-sm font-mono bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                          {checkResults.dailyRateColumn.error}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Script para arreglar la estructura si faltan tablas */}
                {(!checkResults.employees?.success ||
                  !checkResults.assignments?.success ||
                  !checkResults.payments?.success) && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Estructura de base de datos incompleta</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      <p className="mb-2">Faltan tablas necesarias o hay problemas de acceso. Para crear las tablas:</p>
                      <pre className="bg-amber-100 p-2 rounded text-xs overflow-x-auto">
                        {`
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  daily_rate NUMERIC DEFAULT 0
);

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
                        `.trim()}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Script para agregar columna daily_rate_used si falta */}
                {!checkResults.dailyRateColumn?.success && checkResults.assignments?.success && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Falta columna para tarifas históricas</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      <p className="mb-2">Ejecute este SQL para agregar la columna de tarifa diaria histórica:</p>
                      <pre className="bg-amber-100 p-2 rounded text-xs overflow-x-auto">
                        {`
ALTER TABLE employee_assignments ADD COLUMN IF NOT EXISTS daily_rate_used NUMERIC DEFAULT 0;

-- Actualiza los registros existentes con la tarifa actual del empleado
UPDATE employee_assignments a
SET daily_rate_used = e.daily_rate
FROM employees e
WHERE a.employee_id = e.id AND a.daily_rate_used = 0;
                        `.trim()}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => checkConnection()} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Actualizar verificación
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Esta herramienta ayuda a diagnosticar problemas de conexión y estructura de la base de datos
        </p>
      </CardFooter>
    </Card>
  )
}
