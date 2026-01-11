"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getSupabaseClient } from "@/lib/employee-db"
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react"

interface HealthCheck {
  name: string
  description: string
  status: "success" | "warning" | "error" | "checking"
  details?: string
  fixAction?: () => Promise<void>
  fixDescription?: string
}

export default function SystemHealthCheck() {
  const [checks, setChecks] = useState<HealthCheck[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  const runChecks = async () => {
    setIsChecking(true)
    setChecks([])

    const newChecks: HealthCheck[] = []
    const supabase = getSupabaseClient()

    if (!supabase) {
      newChecks.push({
        name: "Conexión a Supabase",
        description: "Verificar conexión con la base de datos",
        status: "error",
        details: "No se pudo crear el cliente de Supabase. Verifique las credenciales.",
      })
      setChecks(newChecks)
      setIsChecking(false)
      return
    }

    // Check 1: Verificar estructura de tablas
    newChecks.push({
      name: "Estructura de tablas",
      description: "Verificar que existan todas las tablas necesarias",
      status: "checking",
    })
    setChecks([...newChecks])

    try {
      const { data: tablesData, error: tablesError } = await supabase.rpc("get_table_names")

      if (tablesError) {
        newChecks[0].status = "error"
        newChecks[0].details = `Error al verificar tablas: ${tablesError.message}`
      } else {
        const tables = tablesData || []
        const requiredTables = ["employees", "employee_assignments", "employee_payments"]
        const missingTables = requiredTables.filter((table) => !tables.includes(table))

        if (missingTables.length > 0) {
          newChecks[0].status = "error"
          newChecks[0].details = `Faltan las siguientes tablas: ${missingTables.join(", ")}`
          newChecks[0].fixAction = async () => {
            await supabase.rpc("create_missing_tables")
          }
          newChecks[0].fixDescription = "Crear tablas faltantes"
        } else {
          newChecks[0].status = "success"
        }
      }
    } catch (err) {
      newChecks[0].status = "error"
      newChecks[0].details = `Error inesperado: ${err instanceof Error ? err.message : String(err)}`
    }

    setChecks([...newChecks])

    // Check 2: Verificar empleados sin tarifa
    newChecks.push({
      name: "Empleados sin tarifa",
      description: "Verificar empleados que no tienen tarifa diaria configurada",
      status: "checking",
    })
    setChecks([...newChecks])

    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("id, name")
        .or("daily_rate.is.null,daily_rate.eq.0")

      if (employeesError) {
        newChecks[1].status = "error"
        newChecks[1].details = `Error al verificar empleados: ${employeesError.message}`
      } else {
        if (employeesData && employeesData.length > 0) {
          newChecks[1].status = "warning"
          newChecks[1].details = `${employeesData.length} empleados sin tarifa diaria configurada`
        } else {
          newChecks[1].status = "success"
        }
      }
    } catch (err) {
      newChecks[1].status = "error"
      newChecks[1].details = `Error inesperado: ${err instanceof Error ? err.message : String(err)}`
    }

    setChecks([...newChecks])

    // Check 3: Verificar asignaciones sin tarifa
    newChecks.push({
      name: "Asignaciones sin tarifa",
      description: "Verificar asignaciones que no tienen tarifa diaria registrada",
      status: "checking",
    })
    setChecks([...newChecks])

    try {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("employee_assignments")
        .select("id, employee_id, hotel_name, assignment_date")
        .or("daily_rate_used.is.null,daily_rate_used.eq.0")

      if (assignmentsError) {
        newChecks[2].status = "error"
        newChecks[2].details = `Error al verificar asignaciones: ${assignmentsError.message}`
      } else {
        if (assignmentsData && assignmentsData.length > 0) {
          newChecks[2].status = "warning"
          newChecks[2].details = `${assignmentsData.length} asignaciones sin tarifa diaria registrada`
          newChecks[2].fixAction = async () => {
            await supabase.rpc("fix_assignments_without_rate")
          }
          newChecks[2].fixDescription = "Corregir asignaciones sin tarifa"
        } else {
          newChecks[2].status = "success"
        }
      }
    } catch (err) {
      newChecks[2].status = "error"
      newChecks[2].details = `Error inesperado: ${err instanceof Error ? err.message : String(err)}`
    }

    setChecks([...newChecks])

    // Check 4: Verificar registros huérfanos
    newChecks.push({
      name: "Registros huérfanos",
      description: "Verificar registros que hacen referencia a empleados que ya no existen",
      status: "checking",
    })
    setChecks([...newChecks])

    try {
      const { data: orphansData, error: orphansError } = await supabase.rpc("check_orphan_records")

      if (orphansError) {
        newChecks[3].status = "error"
        newChecks[3].details = `Error al verificar registros huérfanos: ${orphansError.message}`
      } else {
        const orphans = orphansData || { assignments: 0, payments: 0 }
        const totalOrphans = orphans.assignments + orphans.payments

        if (totalOrphans > 0) {
          newChecks[3].status = "warning"
          newChecks[3].details = `${orphans.assignments} asignaciones y ${orphans.payments} pagos huérfanos`
          newChecks[3].fixAction = async () => {
            await supabase.rpc("delete_orphan_records")
          }
          newChecks[3].fixDescription = "Eliminar registros huérfanos"
        } else {
          newChecks[3].status = "success"
        }
      }
    } catch (err) {
      newChecks[3].status = "error"
      newChecks[3].details = `Error inesperado: ${err instanceof Error ? err.message : String(err)}`
    }

    setChecks([...newChecks])

    setIsChecking(false)
  }

  const fixIssue = async (index: number) => {
    if (!checks[index].fixAction) return

    setIsFixing(true)
    const updatedChecks = [...checks]
    updatedChecks[index].status = "checking"
    setChecks(updatedChecks)

    try {
      await checks[index].fixAction!()
      updatedChecks[index].status = "success"
      updatedChecks[index].details = "Problema corregido correctamente"
      delete updatedChecks[index].fixAction
      delete updatedChecks[index].fixDescription
    } catch (err) {
      updatedChecks[index].status = "error"
      updatedChecks[index].details = `Error al corregir: ${err instanceof Error ? err.message : String(err)}`
    }

    setChecks(updatedChecks)
    setIsFixing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "checking":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      default:
        return null
    }
  }

  const getOverallStatus = () => {
    if (checks.length === 0) return "none"
    if (checks.some((check) => check.status === "error")) return "error"
    if (checks.some((check) => check.status === "warning")) return "warning"
    if (checks.some((check) => check.status === "checking")) return "checking"
    return "success"
  }

  const overallStatus = getOverallStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificación del Sistema</CardTitle>
        <CardDescription>Diagnóstico y corrección de problemas comunes</CardDescription>
      </CardHeader>
      <CardContent>
        {overallStatus === "none" ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Ejecute la verificación para diagnosticar el sistema</p>
            <Button onClick={runChecks} disabled={isChecking}>
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                </>
              ) : (
                "Iniciar Verificación"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert
              variant={
                overallStatus === "success"
                  ? "default"
                  : overallStatus === "warning"
                    ? "default"
                    : overallStatus === "error"
                      ? "destructive"
                      : "default"
              }
            >
              {getStatusIcon(overallStatus)}
              <AlertTitle>
                {overallStatus === "success"
                  ? "Sistema en buen estado"
                  : overallStatus === "warning"
                    ? "Problemas menores detectados"
                    : overallStatus === "error"
                      ? "Problemas críticos detectados"
                      : "Verificando..."}
              </AlertTitle>
              <AlertDescription>
                {overallStatus === "success"
                  ? "Todas las verificaciones pasaron correctamente"
                  : overallStatus === "warning"
                    ? "Se encontraron problemas que pueden afectar el funcionamiento"
                    : overallStatus === "error"
                      ? "Se encontraron problemas que impiden el funcionamiento correcto"
                      : "Ejecutando verificaciones..."}
              </AlertDescription>
            </Alert>

            <Accordion type="single" collapsible className="w-full">
              {checks.map((check, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="flex items-center">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(check.status)}
                      <span>{check.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-7">
                      <p className="text-sm text-muted-foreground">{check.description}</p>
                      {check.details && (
                        <p
                          className={`text-sm p-2 rounded ${
                            check.status === "error"
                              ? "bg-red-50 text-red-700"
                              : check.status === "warning"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-green-50 text-green-700"
                          }`}
                        >
                          {check.details}
                        </p>
                      )}
                      {check.fixAction && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fixIssue(index)}
                          disabled={isFixing || check.status === "checking"}
                        >
                          {isFixing && check.status === "checking" ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Corrigiendo...
                            </>
                          ) : (
                            check.fixDescription || "Corregir problema"
                          )}
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runChecks} disabled={isChecking || isFixing} variant="outline" className="ml-auto">
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
            </>
          ) : (
            "Verificar Nuevamente"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
