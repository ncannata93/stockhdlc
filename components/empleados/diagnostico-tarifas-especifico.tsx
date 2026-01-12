"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useEmployeeDB } from "@/lib/employee-db"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle, CheckCircle, RefreshCw, Search } from "lucide-react"
import type { Employee, EmployeeAssignment } from "@/lib/employee-types"

interface AssignmentIssue {
  date: string
  employee: Employee
  assignments: EmployeeAssignment[]
  expectedRate: number
  actualRates: number[]
  needsCorrection: boolean
}

export default function DiagnosticoTarifasEspecifico() {
  const { getEmployees, getAssignments, saveAssignment } = useEmployeeDB()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [correcting, setCorrecting] = useState(false)
  const [issues, setIssues] = useState<AssignmentIssue[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  const analyzeAssignments = async () => {
    setLoading(true)
    try {
      console.log("🔍 Iniciando análisis de tarifas...")

      // Cargar empleados
      const employeesData = await getEmployees()
      setEmployees(employeesData)
      console.log("👥 Empleados cargados:", employeesData.length)

      // Cargar todas las asignaciones de junio 2025
      const allAssignments = await getAssignments({
        start_date: "2025-06-01",
        end_date: "2025-06-30",
      })
      console.log("📋 Asignaciones de junio cargadas:", allAssignments.length)

      // Buscar específicamente la semana del 02/06/2025
      const weekStart = "2025-06-02" // Lunes
      const weekEnd = "2025-06-08" // Domingo

      const weekAssignments = allAssignments.filter(
        (a) => a.assignment_date >= weekStart && a.assignment_date <= weekEnd,
      )
      console.log(`📅 Asignaciones semana ${weekStart} - ${weekEnd}:`, weekAssignments.length)

      // Buscar específicamente a Tucu
      const tucu = employeesData.find(
        (emp) => emp.name.toLowerCase().includes("tucu") || emp.name.toLowerCase().includes("tucú"),
      )

      if (tucu) {
        console.log("👤 Tucu encontrado:", tucu.name, "- Tarifa:", tucu.daily_rate)

        const tucuAssignments = weekAssignments.filter((a) => a.employee_id === tucu.id)
        console.log("📋 Asignaciones de Tucu en esa semana:", tucuAssignments.length)

        tucuAssignments.forEach((assignment) => {
          console.log(`📅 ${assignment.assignment_date}: ${assignment.hotel_name} - $${assignment.daily_rate_used}`)
        })
      }

      // Agrupar asignaciones por empleado y fecha
      const assignmentsByEmployeeAndDate = allAssignments.reduce(
        (acc, assignment) => {
          const key = `${assignment.employee_id}-${assignment.assignment_date}`
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(assignment)
          return acc
        },
        {} as Record<string, EmployeeAssignment[]>,
      )

      console.log("🔍 Grupos de asignaciones por empleado-fecha:", Object.keys(assignmentsByEmployeeAndDate).length)

      // Analizar cada grupo para encontrar problemas
      const foundIssues: AssignmentIssue[] = []

      for (const [key, assignments] of Object.entries(assignmentsByEmployeeAndDate)) {
        if (assignments.length > 1) {
          // Múltiples asignaciones el mismo día - verificar división de tarifas
          const employee = employeesData.find((emp) => emp.id === assignments[0].employee_id)
          if (!employee) continue

          const expectedRate = Math.round(employee.daily_rate / assignments.length)
          const actualRates = assignments.map((a) => a.daily_rate_used)

          // Verificar si las tarifas están correctamente divididas
          const needsCorrection = actualRates.some((rate) => Math.abs(rate - expectedRate) > 1)

          if (needsCorrection) {
            foundIssues.push({
              date: assignments[0].assignment_date,
              employee,
              assignments,
              expectedRate,
              actualRates,
              needsCorrection: true,
            })

            console.log(`❌ PROBLEMA ENCONTRADO:`)
            console.log(`👤 Empleado: ${employee.name}`)
            console.log(`📅 Fecha: ${assignments[0].assignment_date}`)
            console.log(`🏨 Hoteles: ${assignments.map((a) => a.hotel_name).join(", ")}`)
            console.log(`💰 Tarifa esperada por hotel: $${expectedRate}`)
            console.log(`💰 Tarifas actuales: $${actualRates.join(", $")}`)
          }
        }
      }

      setIssues(foundIssues)
      console.log("🔍 Problemas encontrados:", foundIssues.length)

      if (foundIssues.length === 0) {
        toast({
          title: "✅ Análisis Completo",
          description: "No se encontraron problemas de división de tarifas.",
        })
      } else {
        toast({
          title: "⚠️ Problemas Encontrados",
          description: `Se encontraron ${foundIssues.length} problema(s) de división de tarifas.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error en análisis:", error)
      toast({
        title: "Error",
        description: "No se pudo completar el análisis.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const correctIssue = async (issue: AssignmentIssue) => {
    setCorrecting(true)
    try {
      console.log(`🔧 Corrigiendo problema para ${issue.employee.name} el ${issue.date}`)

      // Actualizar cada asignación con la tarifa correcta
      for (const assignment of issue.assignments) {
        await saveAssignment({
          id: assignment.id,
          employee_id: assignment.employee_id,
          hotel_name: assignment.hotel_name,
          assignment_date: assignment.assignment_date,
          daily_rate_used: issue.expectedRate,
          notes: assignment.notes
            ? `${assignment.notes} | Tarifa corregida automáticamente`
            : "Tarifa corregida automáticamente",
        })

        console.log(
          `✅ Corregida asignación en ${assignment.hotel_name}: $${assignment.daily_rate_used} → $${issue.expectedRate}`,
        )
      }

      toast({
        title: "✅ Corrección Exitosa",
        description: `Se corrigieron las tarifas de ${issue.employee.name} para el ${issue.date}`,
      })

      // Reanalizar después de la corrección
      await analyzeAssignments()
    } catch (error) {
      console.error("❌ Error en corrección:", error)
      toast({
        title: "Error",
        description: "No se pudo corregir el problema.",
        variant: "destructive",
      })
    } finally {
      setCorrecting(false)
    }
  }

  const correctAllIssues = async () => {
    setCorrecting(true)
    try {
      console.log(`🔧 Corrigiendo todos los problemas (${issues.length})`)

      for (const issue of issues) {
        await correctIssue(issue)
      }

      toast({
        title: "✅ Todas las Correcciones Completadas",
        description: `Se corrigieron ${issues.length} problema(s) de tarifas.`,
      })
    } catch (error) {
      console.error("❌ Error en corrección masiva:", error)
      toast({
        title: "Error",
        description: "No se pudieron corregir todos los problemas.",
        variant: "destructive",
      })
    } finally {
      setCorrecting(false)
    }
  }

  useEffect(() => {
    // Ejecutar análisis automáticamente al cargar
    analyzeAssignments()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6" />🔍 Diagnóstico de Tarifas - Semana 02/06/2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={analyzeAssignments} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reanalizar
                </>
              )}
            </Button>

            {issues.length > 0 && (
              <Button onClick={correctAllIssues} disabled={correcting} className="bg-green-600">
                {correcting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Corrigiendo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Corregir Todos
                  </>
                )}
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : issues.length === 0 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">✅ Todo Correcto</AlertTitle>
              <AlertDescription className="text-green-700">
                No se encontraron problemas de división de tarifas en el período analizado.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">⚠️ Problemas Encontrados</AlertTitle>
                <AlertDescription className="text-red-700">
                  Se encontraron {issues.length} problema(s) de división de tarifas que necesitan corrección.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {issues.map((issue, index) => (
                  <Card key={index} className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-orange-800">
                            👤 {issue.employee.name} - 📅 {issue.date}
                          </h3>
                          <p className="text-sm text-orange-700">
                            💰 Tarifa diaria: ${issue.employee.daily_rate.toLocaleString()} • 🏨{" "}
                            {issue.assignments.length} hoteles
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => correctIssue(issue)}
                          disabled={correcting}
                          className="bg-green-600"
                        >
                          {correcting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Corregir
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>🏨 Hotel</TableHead>
                              <TableHead>💰 Tarifa Actual</TableHead>
                              <TableHead>💰 Tarifa Esperada</TableHead>
                              <TableHead>📝 Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {issue.assignments.map((assignment, idx) => (
                              <TableRow key={assignment.id}>
                                <TableCell className="font-medium">🏨 {assignment.hotel_name}</TableCell>
                                <TableCell>
                                  <Badge variant="destructive">${assignment.daily_rate_used.toLocaleString()}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    ${issue.expectedRate.toLocaleString()}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {Math.abs(assignment.daily_rate_used - issue.expectedRate) <= 1 ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      ✅ Correcto
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">❌ Incorrecto</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="mt-4 p-3 bg-white rounded border">
                        <div className="text-sm">
                          <div className="font-medium mb-2">📊 Resumen del problema:</div>
                          <div>
                            💰 Total actual: ${issue.actualRates.reduce((sum, rate) => sum + rate, 0).toLocaleString()}
                          </div>
                          <div>
                            💰 Total esperado: ${(issue.expectedRate * issue.assignments.length).toLocaleString()}
                          </div>
                          <div>
                            🔄 Diferencia: $
                            {Math.abs(
                              issue.actualRates.reduce((sum, rate) => sum + rate, 0) -
                                issue.expectedRate * issue.assignments.length,
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
