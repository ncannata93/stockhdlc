"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEmployeeDB } from "@/lib/employee-db"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function DailyRateCheck() {
  const { getEmployees, getAssignments } = useEmployeeDB()
  const [checking, setChecking] = useState(false)
  const [results, setResults] = useState<{
    employeesWithoutRate: any[]
    assignmentsWithoutRate: any[]
    status: "success" | "warning" | "error"
  } | null>(null)

  const checkDailyRates = async () => {
    setChecking(true)
    try {
      // Verificar empleados sin tarifa diaria
      const employees = await getEmployees()
      const employeesWithoutRate = employees.filter((emp) => !emp.daily_rate || emp.daily_rate === 0)

      // Verificar asignaciones sin tarifa
      const assignments = await getAssignments()
      const assignmentsWithoutRate = assignments.filter(
        (assignment: any) => !assignment.daily_rate_used || assignment.daily_rate_used === 0,
      )

      const status =
        employeesWithoutRate.length === 0 && assignmentsWithoutRate.length === 0
          ? "success"
          : assignmentsWithoutRate.length > 0
            ? "error"
            : "warning"

      setResults({
        employeesWithoutRate,
        assignmentsWithoutRate,
        status,
      })
    } catch (error) {
      console.error("Error al verificar tarifas:", error)
      setResults({
        employeesWithoutRate: [],
        assignmentsWithoutRate: [],
        status: "error",
      })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkDailyRates()
  }, [])

  if (checking) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Verificando tarifas diarias...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!results) return null

  return (
    <Card
      className={`mb-4 ${
        results.status === "success"
          ? "border-green-200"
          : results.status === "warning"
            ? "border-yellow-200"
            : "border-red-200"
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center">
          {results.status === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
          )}
          Verificación de Tarifas Diarias
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.status === "success" ? (
          <p className="text-green-700">✅ Todas las tarifas diarias están configuradas correctamente.</p>
        ) : (
          <div className="space-y-3">
            {results.employeesWithoutRate.length > 0 && (
              <div>
                <p className="text-yellow-700 font-medium">
                  ⚠️ Empleados sin tarifa diaria configurada ({results.employeesWithoutRate.length}):
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                  {results.employeesWithoutRate.map((emp: any) => (
                    <li key={emp.id}>
                      {emp.name} - Tarifa: ${emp.daily_rate || 0}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.assignmentsWithoutRate.length > 0 && (
              <div>
                <p className="text-red-700 font-medium">
                  ❌ Asignaciones con problemas de tarifa ({results.assignmentsWithoutRate.length}):
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                  {results.assignmentsWithoutRate.slice(0, 5).map((assignment: any) => (
                    <li key={assignment.id}>
                      {assignment.employee_name} - {assignment.hotel_name} - {assignment.assignment_date}
                    </li>
                  ))}
                  {results.assignmentsWithoutRate.length > 5 && (
                    <li>... y {results.assignmentsWithoutRate.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <Button onClick={checkDailyRates} variant="outline" size="sm" className="mt-3">
          Verificar Nuevamente
        </Button>
      </CardContent>
    </Card>
  )
}
