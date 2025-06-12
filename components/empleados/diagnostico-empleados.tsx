"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEmployeeDB } from "@/lib/employee-db"
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"

export default function DiagnosticoEmpleados() {
  const { getEmployees } = useEmployeeDB()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [diagnostico, setDiagnostico] = useState<any>(null)

  const ejecutarDiagnostico = async () => {
    setLoading(true)
    const resultado: any = {
      timestamp: new Date().toISOString(),
      supabase: { conectado: false, error: null, credenciales: false },
      empleados: { total: 0, datos: [], error: null },
      tablas: { employees: false, employee_assignments: false },
    }

    try {
      // Verificar credenciales de Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        resultado.supabase.error = "Credenciales de Supabase no configuradas"
        resultado.supabase.credenciales = false
      } else {
        resultado.supabase.credenciales = true

        // Crear cliente de Supabase
        const supabase = createClient(supabaseUrl, supabaseKey)
        resultado.supabase.conectado = true

        // Verificar tabla employees
        try {
          const { data: employeesData, error: employeesError } = await supabase.from("employees").select("*").limit(5)

          if (employeesError) {
            resultado.empleados.error = employeesError.message
            console.error("Error al consultar employees:", employeesError)
          } else {
            resultado.tablas.employees = true
            resultado.empleados.total = employeesData?.length || 0
            resultado.empleados.datos = employeesData || []
          }
        } catch (err: any) {
          resultado.empleados.error = err.message
          console.error("Error en consulta employees:", err)
        }

        // Verificar tabla employee_assignments
        try {
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from("employee_assignments")
            .select("*")
            .limit(1)

          if (!assignmentsError) {
            resultado.tablas.employee_assignments = true
          } else {
            console.error("Error al consultar employee_assignments:", assignmentsError)
          }
        } catch (err) {
          console.error("Error en consulta employee_assignments:", err)
        }
      }

      // Probar función getEmployees
      try {
        console.log("Probando función getEmployees...")
        const empleados = await getEmployees()
        console.log("Empleados obtenidos:", empleados)

        resultado.empleados.funcionGetEmployees = {
          exito: true,
          total: empleados.length,
          empleados: empleados.slice(0, 3), // Solo los primeros 3 para no saturar
        }
      } catch (err: any) {
        console.error("Error en getEmployees:", err)
        resultado.empleados.funcionGetEmployees = {
          exito: false,
          error: err.message,
        }
      }
    } catch (err: any) {
      console.error("Error general en diagnóstico:", err)
      resultado.supabase.error = err.message
    }

    console.log("Resultado del diagnóstico:", resultado)
    setDiagnostico(resultado)
    setLoading(false)
  }

  useEffect(() => {
    ejecutarDiagnostico()
  }, [])

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Diagnóstico de Empleados</CardTitle>
          <Button onClick={ejecutarDiagnostico} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : diagnostico ? (
          <div className="space-y-4">
            {/* Estado de Credenciales */}
            <div className="border rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(diagnostico.supabase.credenciales)}
                <h3 className="font-semibold">Credenciales Supabase</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Estado: {diagnostico.supabase.credenciales ? "Configuradas" : "Faltantes"}
              </p>
              {!diagnostico.supabase.credenciales && (
                <p className="text-sm text-red-500 mt-1">
                  Verifica que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén configuradas
                </p>
              )}
            </div>

            {/* Estado de Conexión */}
            <div className="border rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(diagnostico.supabase.conectado)}
                <h3 className="font-semibold">Conexión Supabase</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Estado: {diagnostico.supabase.conectado ? "Conectado" : "Desconectado"}
              </p>
              {diagnostico.supabase.error && (
                <p className="text-sm text-red-500 mt-1">Error: {diagnostico.supabase.error}</p>
              )}
            </div>

            {/* Estado de Tablas */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Estado de Tablas</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostico.tablas.employees)}
                  <span className="text-sm">Tabla 'employees'</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostico.tablas.employee_assignments)}
                  <span className="text-sm">Tabla 'employee_assignments'</span>
                </div>
              </div>
            </div>

            {/* Estado de Empleados */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Datos de Empleados</h3>
              <p className="text-sm text-muted-foreground mb-2">Total encontrado: {diagnostico.empleados.total}</p>

              {diagnostico.empleados.error && (
                <p className="text-sm text-red-500 mb-2">Error: {diagnostico.empleados.error}</p>
              )}

              {diagnostico.empleados.funcionGetEmployees && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(diagnostico.empleados.funcionGetEmployees.exito)}
                    <span className="text-sm font-medium">Función getEmployees()</span>
                  </div>
                  {diagnostico.empleados.funcionGetEmployees.exito ? (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Empleados obtenidos: {diagnostico.empleados.funcionGetEmployees.total}
                      </p>
                      {diagnostico.empleados.funcionGetEmployees.empleados.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Muestra:</p>
                          {diagnostico.empleados.funcionGetEmployees.empleados.map((emp: any) => (
                            <p key={emp.id} className="text-xs text-muted-foreground ml-2">
                              • {emp.name} - {emp.role} - ${emp.daily_rate?.toLocaleString()}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">Error: {diagnostico.empleados.funcionGetEmployees.error}</p>
                  )}
                </div>
              )}

              {diagnostico.empleados.datos.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Datos directos de BD:</p>
                  {diagnostico.empleados.datos.map((emp: any) => (
                    <p key={emp.id} className="text-xs text-muted-foreground ml-2">
                      • {emp.name} - {emp.role} - ${emp.daily_rate?.toLocaleString()}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Última actualización: {new Date(diagnostico.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Ejecuta el diagnóstico para ver el estado</p>
        )}
      </CardContent>
    </Card>
  )
}
