"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, RefreshCw, Database } from "lucide-react"
import { getSupabaseClient } from "@/lib/employee-db"

interface TestResult {
  name: string
  status: "success" | "error" | "checking"
  message: string
  details?: string
}

export function ConnectionCheck() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    const results: TestResult[] = []

    // Test 1: Verificar cliente Supabase
    results.push({ name: "Cliente Supabase", status: "checking", message: "Verificando..." })
    setTests([...results])

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        results[0] = {
          name: "Cliente Supabase",
          status: "error",
          message: "No se pudo crear el cliente",
          details: "Verifique las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY",
        }
      } else {
        results[0] = { name: "Cliente Supabase", status: "success", message: "Cliente creado correctamente" }
      }
    } catch (err) {
      results[0] = {
        name: "Cliente Supabase",
        status: "error",
        message: "Error al crear cliente",
        details: err instanceof Error ? err.message : String(err),
      }
    }
    setTests([...results])

    if (results[0].status === "error") {
      setIsRunning(false)
      return
    }

    const supabase = getSupabaseClient()!

    // Test 2: Verificar tabla employees
    results.push({ name: "Tabla employees", status: "checking", message: "Verificando..." })
    setTests([...results])

    try {
      const { data, error } = await supabase.from("employees").select("count", { count: "exact", head: true })
      if (error) {
        results[1] = {
          name: "Tabla employees",
          status: "error",
          message: "Error al acceder a la tabla",
          details: error.message,
        }
      } else {
        results[1] = {
          name: "Tabla employees",
          status: "success",
          message: `Tabla accesible (${data?.length || 0} registros)`,
        }
      }
    } catch (err) {
      results[1] = {
        name: "Tabla employees",
        status: "error",
        message: "Error inesperado",
        details: err instanceof Error ? err.message : String(err),
      }
    }
    setTests([...results])

    // Test 3: Verificar tabla employee_assignments
    results.push({ name: "Tabla employee_assignments", status: "checking", message: "Verificando..." })
    setTests([...results])

    try {
      const { data, error } = await supabase
        .from("employee_assignments")
        .select("count", { count: "exact", head: true })
      if (error) {
        results[2] = {
          name: "Tabla employee_assignments",
          status: "error",
          message: "Error al acceder a la tabla",
          details: error.message,
        }
      } else {
        results[2] = {
          name: "Tabla employee_assignments",
          status: "success",
          message: `Tabla accesible (${data?.length || 0} registros)`,
        }
      }
    } catch (err) {
      results[2] = {
        name: "Tabla employee_assignments",
        status: "error",
        message: "Error inesperado",
        details: err instanceof Error ? err.message : String(err),
      }
    }
    setTests([...results])

    // Test 4: Verificar tabla employee_payments
    results.push({ name: "Tabla employee_payments", status: "checking", message: "Verificando..." })
    setTests([...results])

    try {
      const { data, error } = await supabase.from("employee_payments").select("count", { count: "exact", head: true })
      if (error) {
        results[3] = {
          name: "Tabla employee_payments",
          status: "error",
          message: "Error al acceder a la tabla",
          details: error.message,
        }
      } else {
        results[3] = {
          name: "Tabla employee_payments",
          status: "success",
          message: `Tabla accesible (${data?.length || 0} registros)`,
        }
      }
    } catch (err) {
      results[3] = {
        name: "Tabla employee_payments",
        status: "error",
        message: "Error inesperado",
        details: err instanceof Error ? err.message : String(err),
      }
    }
    setTests([...results])

    // Test 5: Verificar permisos de escritura
    results.push({ name: "Permisos de escritura", status: "checking", message: "Verificando..." })
    setTests([...results])

    try {
      // Intentar crear un empleado de prueba
      const { data, error } = await supabase
        .from("employees")
        .insert({
          name: "Test Employee - DELETE ME",
          role: "Test",
          daily_rate: 0,
        })
        .select()
        .single()

      if (error) {
        results[4] = {
          name: "Permisos de escritura",
          status: "error",
          message: "No se puede escribir en la base de datos",
          details: error.message,
        }
      } else {
        // Si se creó correctamente, intentar eliminarlo
        await supabase.from("employees").delete().eq("id", data.id)
        results[4] = {
          name: "Permisos de escritura",
          status: "success",
          message: "Permisos de escritura funcionando correctamente",
        }
      }
    } catch (err) {
      results[4] = {
        name: "Permisos de escritura",
        status: "error",
        message: "Error al probar escritura",
        details: err instanceof Error ? err.message : String(err),
      }
    }
    setTests([...results])

    setIsRunning(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getIcon = (status: string) => {
    switch (status) {
      case "checking":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const successCount = tests.filter((t) => t.status === "success").length
  const errorCount = tests.filter((t) => t.status === "error").length
  const overallStatus = errorCount > 0 ? "error" : successCount === tests.length ? "success" : "checking"

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado de la Conexión con Supabase
          </CardTitle>
          <CardDescription>Verificación completa del sistema de base de datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant={overallStatus === "error" ? "destructive" : "default"}>
              {getIcon(overallStatus)}
              <AlertTitle>
                {overallStatus === "checking"
                  ? "Verificando..."
                  : overallStatus === "success"
                    ? "Sistema Funcionando Correctamente"
                    : "Problemas Detectados"}
              </AlertTitle>
              <AlertDescription>
                {overallStatus === "checking"
                  ? "Ejecutando pruebas de conectividad..."
                  : overallStatus === "success"
                    ? `Todas las pruebas (${successCount}/${tests.length}) pasaron correctamente.`
                    : `${errorCount} de ${tests.length} pruebas fallaron. Revise los detalles abajo.`}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {tests.map((test, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getIcon(test.status)}
                  <div className="flex-1">
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-muted-foreground">{test.message}</div>
                    {test.details && (
                      <div className="text-xs text-red-600 mt-1 font-mono bg-red-50 p-2 rounded">{test.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={runTests} disabled={isRunning} className="w-full">
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ejecutar Pruebas Nuevamente
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información de configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">URL de Supabase: </span>
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_URL
                  ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + "..."
                  : "No configurado"}
              </code>
            </div>
            <div>
              <span className="font-medium">API Key: </span>
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurado (oculto por seguridad)" : "No configurado"}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
