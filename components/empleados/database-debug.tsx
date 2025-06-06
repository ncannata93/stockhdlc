"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { getSupabaseClient } from "@/lib/employee-db"

export default function DatabaseDebug() {
  const [status, setStatus] = useState<{
    loading: boolean
    connected: boolean
    error: string | null
    tables: string[]
    credentials: {
      hasUrl: boolean
      hasKey: boolean
      urlPreview: string
      keyPreview: string
    }
  }>({
    loading: true,
    connected: false,
    error: null,
    tables: [],
    credentials: {
      hasUrl: false,
      hasKey: false,
      urlPreview: "",
      keyPreview: "",
    },
  })

  const checkConnection = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: null }))

    try {
      // Verificar credenciales
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localStorage.getItem("supabaseUrl") || ""
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localStorage.getItem("supabaseKey") || ""

      const credentials = {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "No configurada",
        keyPreview: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : "No configurada",
      }

      if (!supabaseUrl || !supabaseKey) {
        setStatus({
          loading: false,
          connected: false,
          error: "Credenciales de Supabase no configuradas",
          tables: [],
          credentials,
        })
        return
      }

      // Intentar conexión
      const supabase = getSupabaseClient()
      if (!supabase) {
        setStatus({
          loading: false,
          connected: false,
          error: "No se pudo crear el cliente de Supabase",
          tables: [],
          credentials,
        })
        return
      }

      // Probar conexión con una consulta simple
      console.log("Probando conexión a Supabase...")
      const { data: healthCheck, error: healthError } = await supabase
        .from("employees")
        .select("count", { count: "exact", head: true })

      if (healthError) {
        console.error("Error de conexión:", healthError)
        setStatus({
          loading: false,
          connected: false,
          error: `Error de conexión: ${healthError.message}`,
          tables: [],
          credentials,
        })
        return
      }

      // Verificar qué tablas existen
      const tables = []

      // Probar tabla employees
      try {
        const { error: empError } = await supabase.from("employees").select("*").limit(1)
        if (!empError) tables.push("employees")
      } catch (e) {
        console.log("Tabla employees no disponible")
      }

      // Probar tabla employee_assignments
      try {
        const { error: assError } = await supabase.from("employee_assignments").select("*").limit(1)
        if (!assError) tables.push("employee_assignments")
      } catch (e) {
        console.log("Tabla employee_assignments no disponible")
      }

      // Probar tabla employee_payments
      try {
        const { error: payError } = await supabase.from("employee_payments").select("*").limit(1)
        if (!payError) tables.push("employee_payments")
      } catch (e) {
        console.log("Tabla employee_payments no disponible")
      }

      setStatus({
        loading: false,
        connected: true,
        error: null,
        tables,
        credentials,
      })
    } catch (error) {
      console.error("Error inesperado:", error)
      setStatus((prev) => ({
        ...prev,
        loading: false,
        connected: false,
        error: `Error inesperado: ${error instanceof Error ? error.message : String(error)}`,
      }))
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Diagnóstico de Base de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Estado de conexión:</span>
            {status.loading ? (
              <Badge variant="secondary">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Verificando...
              </Badge>
            ) : status.connected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Desconectado
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">URL de Supabase:</span>
              <div className="text-sm text-muted-foreground">{status.credentials.urlPreview}</div>
              <Badge variant={status.credentials.hasUrl ? "default" : "destructive"} className="mt-1">
                {status.credentials.hasUrl ? "Configurada" : "No configurada"}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Clave de Supabase:</span>
              <div className="text-sm text-muted-foreground">{status.credentials.keyPreview}</div>
              <Badge variant={status.credentials.hasKey ? "default" : "destructive"} className="mt-1">
                {status.credentials.hasKey ? "Configurada" : "No configurada"}
              </Badge>
            </div>
          </div>

          {status.tables.length > 0 && (
            <div>
              <span className="text-sm font-medium">Tablas disponibles:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {status.tables.map((table) => (
                  <Badge key={table} variant="outline">
                    {table}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={checkConnection} disabled={status.loading} className="w-full">
            <RefreshCw className={`h-4 w-4 mr-2 ${status.loading ? "animate-spin" : ""}`} />
            Verificar Conexión
          </Button>
        </CardContent>
      </Card>

      {!status.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Soluciones Posibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">1. Verificar credenciales</h4>
                <p className="text-sm text-muted-foreground">
                  Asegúrate de que las credenciales de Supabase estén configuradas correctamente en las variables de
                  entorno o localStorage.
                </p>
              </div>
              <div>
                <h4 className="font-medium">2. Crear tablas</h4>
                <p className="text-sm text-muted-foreground">
                  Si las credenciales están bien pero faltan tablas, ejecuta los scripts SQL para crear las tablas de
                  empleados.
                </p>
              </div>
              <div>
                <h4 className="font-medium">3. Verificar permisos</h4>
                <p className="text-sm text-muted-foreground">
                  Asegúrate de que la clave anónima tenga permisos para leer y escribir en las tablas de empleados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
