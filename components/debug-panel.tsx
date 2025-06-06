"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@supabase/supabase-js"
import { Bug, RefreshCw, Loader2, Database, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export function DebugPanel() {
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    employees: 0,
    assignments: 0,
    payments: 0,
  })
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Inicializar cliente Supabase
    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        (typeof window !== "undefined" ? localStorage.getItem("supabaseUrl") : null) ||
        ""
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        (typeof window !== "undefined" ? localStorage.getItem("supabaseKey") : null) ||
        ""

      if (supabaseUrl && supabaseKey) {
        const client = createClient(supabaseUrl, supabaseKey)
        setSupabaseClient(client)
        loadStats(client)
      } else {
        setError("No se encontraron credenciales de Supabase")
        setLoading(false)
      }
    } catch (err) {
      console.error("Error al inicializar Supabase:", err)
      setError(`Error al inicializar Supabase: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }, [])

  const loadStats = async (client: ReturnType<typeof createClient>) => {
    setLoading(true)
    setError(null)

    try {
      // Cargar estadísticas de empleados
      const { count: employeeCount, error: empError } = await client
        .from("employees")
        .select("*", { count: "exact", head: true })

      if (empError) {
        throw new Error(`Error al contar empleados: ${empError.message}`)
      }

      // Cargar estadísticas de asignaciones
      const { count: assignmentCount, error: assignError } = await client
        .from("employee_assignments")
        .select("*", { count: "exact", head: true })

      if (assignError) {
        throw new Error(`Error al contar asignaciones: ${assignError.message}`)
      }

      // Cargar estadísticas de pagos
      const { count: paymentCount, error: payError } = await client
        .from("employee_payments")
        .select("*", { count: "exact", head: true })

      if (payError) {
        throw new Error(`Error al contar pagos: ${payError.message}`)
      }

      setStats({
        employees: employeeCount || 0,
        assignments: assignmentCount || 0,
        payments: paymentCount || 0,
      })
    } catch (err) {
      console.error("Error al cargar estadísticas:", err)
      setError(`Error al cargar estadísticas: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => {
    if (supabaseClient) {
      loadStats(supabaseClient)
    }
  }

  // Si hay un error, mostrar un panel de alerta
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error de base de datos</AlertTitle>
        <AlertDescription>
          <div className="mb-2">{error}</div>
          <Button asChild size="sm" variant="outline">
            <Link href="/empleados/diagnostico">
              <Bug className="mr-2 h-4 w-4" />
              Ir a Diagnóstico
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Si no hay error y no está expandido, mostrar un botón pequeño
  if (!expanded) {
    return (
      <div className="mb-6 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
          <Database className="mr-2 h-4 w-4" />
          Mostrar Estado DB
        </Button>
      </div>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado de la Base de Datos
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            Ocultar
          </Button>
        </div>
        <CardDescription>Información sobre el estado actual de las tablas</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{stats.employees}</div>
              <div className="text-sm text-muted-foreground">Empleados</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{stats.assignments}</div>
              <div className="text-sm text-muted-foreground">Asignaciones</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{stats.payments}</div>
              <div className="text-sm text-muted-foreground">Pagos</div>
            </div>
          </div>
        )}

        {stats.employees === 0 && !loading && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No hay empleados</AlertTitle>
            <AlertDescription>
              <div className="mb-2">
                No se encontraron empleados en la base de datos. Esto puede causar problemas al intentar agregar
                asignaciones.
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/empleados/diagnostico">
                  <Bug className="mr-2 h-4 w-4" />
                  Ir a Diagnóstico
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-muted-foreground">Última actualización: {new Date().toLocaleTimeString()}</div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualizar
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
