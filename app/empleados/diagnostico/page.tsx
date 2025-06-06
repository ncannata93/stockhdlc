"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DatabaseDiagnosis } from "@/components/database-diagnosis"
import { createClient } from "@supabase/supabase-js"
import { AlertCircle, ArrowLeft, Database, Home } from "lucide-react"
import Link from "next/link"

export default function DiagnosticoPage() {
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Intentar inicializar el cliente Supabase
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
        setIsInitialized(true)
      }
    } catch (error) {
      console.error("Error al inicializar Supabase:", error)
    }
  }, [])

  return (
    <div className="container py-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Database className="h-8 w-8" />
          Diagnóstico del Sistema
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/empleados">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Link>
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Herramienta de diagnóstico</AlertTitle>
        <AlertDescription>
          Esta página le ayudará a diagnosticar y resolver problemas con la base de datos y la conexión a Supabase.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="diagnosis" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="diagnosis">Diagnóstico</TabsTrigger>
          <TabsTrigger value="scripts">Scripts de reparación</TabsTrigger>
          <TabsTrigger value="setup">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis">
          <DatabaseDiagnosis />
        </TabsContent>

        <TabsContent value="scripts">
          <Card>
            <CardHeader>
              <CardTitle>Scripts de Reparación</CardTitle>
              <CardDescription>
                Utilice estos scripts para corregir problemas comunes en la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Crear o Reparar Tablas de Empleados</h3>
                  <p className="text-sm text-muted-foreground">
                    Ejecute este script para crear o reparar las tablas principales del sistema de empleados.
                  </p>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                    {`-- Crear tabla de empleados si no existe
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
);`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Agregar Columna para Tarifas Históricas</h3>
                  <p className="text-sm text-muted-foreground">
                    Ejecute este script para agregar la columna de tarifas históricas y actualizar los registros
                    existentes.
                  </p>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                    {`-- Agregar columna daily_rate_used si no existe
ALTER TABLE employee_assignments 
ADD COLUMN IF NOT EXISTS daily_rate_used NUMERIC DEFAULT 0;

-- Actualizar los registros existentes con la tarifa actual del empleado
UPDATE employee_assignments a
SET daily_rate_used = e.daily_rate
FROM employees e
WHERE a.employee_id = e.id AND a.daily_rate_used = 0;`}
                  </pre>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Para ejecutar estos scripts, use la consola SQL de Supabase o una herramienta como psql.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Supabase</CardTitle>
              <CardDescription>
                Información sobre la configuración actual y cómo actualizar las credenciales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Estado actual</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="font-medium">URL de Supabase: </span>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        {process.env.NEXT_PUBLIC_SUPABASE_URL ||
                          (typeof window !== "undefined" ? localStorage.getItem("supabaseUrl") : null) ||
                          "No configurado"}
                      </code>
                    </li>
                    <li>
                      <span className="font-medium">API Key: </span>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                        (typeof window !== "undefined" ? localStorage.getItem("supabaseKey") : null)
                          ? "Configurado (oculto)"
                          : "No configurado"}
                      </code>
                    </li>
                    <li>
                      <span className="font-medium">Estado: </span>
                      {isInitialized ? (
                        <span className="text-green-600 font-medium">Inicializado</span>
                      ) : (
                        <span className="text-red-600 font-medium">No inicializado</span>
                      )}
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Actualización de Credenciales</h3>
                  <p className="text-sm">
                    Para actualizar las credenciales de Supabase, use la herramienta de diagnóstico en la pestaña
                    "Diagnóstico".
                  </p>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nota importante</AlertTitle>
                    <AlertDescription>
                      Las credenciales se almacenan en localStorage. Para una solución más segura, configure las
                      variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en su entorno de
                      producción.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
