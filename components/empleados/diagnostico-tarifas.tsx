"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, CheckCircle, RefreshCw, Calculator } from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import { useToast } from "@/hooks/use-toast"

interface DiagnosticData {
  empleado: string
  fecha: string
  hoteles: Array<{
    hotel: string
    tarifa: number
    assignmentId: number
  }>
  tarifaEmpleado: number
  totalCobrado: number
  estado: "CORRECTO" | "INCORRECTO"
  diferencia: number
}

export default function DiagnosticoTarifas() {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const { getAssignments, getEmployees, saveAssignment } = useEmployeeDB()
  const { toast } = useToast()

  const runDiagnostic = async () => {
    setIsLoading(true)
    try {
      const [assignments, employees] = await Promise.all([getAssignments(), getEmployees()])

      // Crear mapa de empleados
      const employeeMap = new Map(employees.map((emp) => [emp.id, emp]))

      // Agrupar asignaciones por empleado y fecha
      const groupedAssignments = new Map<
        string,
        {
          empleado: string
          fecha: string
          hoteles: Array<{ hotel: string; tarifa: number; assignmentId: number }>
          tarifaEmpleado: number
        }
      >()

      assignments.forEach((assignment) => {
        const employee = employeeMap.get(assignment.employee_id)
        if (!employee) return

        const key = `${assignment.employee_id}-${assignment.assignment_date}`

        if (!groupedAssignments.has(key)) {
          groupedAssignments.set(key, {
            empleado: employee.name,
            fecha: assignment.assignment_date,
            hoteles: [],
            tarifaEmpleado: employee.daily_rate,
          })
        }

        const group = groupedAssignments.get(key)!
        group.hoteles.push({
          hotel: assignment.hotel_name,
          tarifa: assignment.daily_rate_used,
          assignmentId: assignment.id,
        })
      })

      // Analizar cada grupo
      const diagnostic: DiagnosticData[] = []

      groupedAssignments.forEach((group) => {
        const totalCobrado = group.hoteles.reduce((sum, h) => sum + h.tarifa, 0)
        const diferencia = Math.abs(totalCobrado - group.tarifaEmpleado)

        diagnostic.push({
          empleado: group.empleado,
          fecha: group.fecha,
          hoteles: group.hoteles,
          tarifaEmpleado: group.tarifaEmpleado,
          totalCobrado,
          estado: diferencia <= 1 ? "CORRECTO" : "INCORRECTO",
          diferencia,
        })
      })

      // Ordenar por fecha y empleado
      diagnostic.sort((a, b) => {
        const dateCompare = new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        if (dateCompare !== 0) return dateCompare
        return a.empleado.localeCompare(b.empleado)
      })

      setDiagnosticData(diagnostic)
    } catch (error) {
      console.error("Error en diagnóstico:", error)
      toast({
        title: "Error",
        description: "Error al ejecutar diagnóstico",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fixIncorrectRates = async () => {
    setIsFixing(true)
    try {
      const incorrectCases = diagnosticData.filter((d) => d.estado === "INCORRECTO")
      let fixed = 0
      let errors = 0

      for (const case_ of incorrectCases) {
        try {
          const numberOfHotels = case_.hoteles.length
          const correctRatePerHotel = Math.round(case_.tarifaEmpleado / numberOfHotels)

          console.log(`🔧 Corrigiendo ${case_.empleado} - ${case_.fecha}:`)
          console.log(`   Tarifa empleado: $${case_.tarifaEmpleado}`)
          console.log(`   Número hoteles: ${numberOfHotels}`)
          console.log(`   Tarifa correcta por hotel: $${correctRatePerHotel}`)

          // Actualizar cada asignación
          for (const hotel of case_.hoteles) {
            const result = await saveAssignment({
              id: hotel.assignmentId,
              daily_rate_used: correctRatePerHotel,
              notes: `Tarifa corregida automáticamente - ${new Date().toLocaleDateString()}`,
            })

            if (result) {
              console.log(`   ✅ ${hotel.hotel}: $${hotel.tarifa} → $${correctRatePerHotel}`)
            } else {
              console.log(`   ❌ Error corrigiendo ${hotel.hotel}`)
              errors++
            }
          }
          fixed++
        } catch (error) {
          console.error(`Error corrigiendo caso ${case_.empleado} - ${case_.fecha}:`, error)
          errors++
        }
      }

      toast({
        title: "Corrección completada",
        description: `Casos corregidos: ${fixed}, Errores: ${errors}`,
      })

      // Volver a ejecutar diagnóstico
      await runDiagnostic()
    } catch (error) {
      console.error("Error en corrección:", error)
      toast({
        title: "Error",
        description: "Error durante la corrección",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const incorrectCases = diagnosticData.filter((d) => d.estado === "INCORRECTO")
  const correctCases = diagnosticData.filter((d) => d.estado === "CORRECTO")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Diagnóstico de Tarifas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Correctos</span>
              </div>
              <div className="text-2xl font-bold text-green-800">{correctCases.length}</div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Incorrectos</span>
              </div>
              <div className="text-2xl font-bold text-red-800">{incorrectCases.length}</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <RefreshCw className="h-5 w-5" />
                <span className="font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">{diagnosticData.length}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={runDiagnostic} disabled={isLoading}>
              {isLoading ? "Analizando..." : "Actualizar Diagnóstico"}
              <RefreshCw className="h-4 w-4 ml-2" />
            </Button>

            {incorrectCases.length > 0 && (
              <Button onClick={fixIncorrectRates} disabled={isFixing} variant="destructive">
                {isFixing ? "Corrigiendo..." : `Corregir ${incorrectCases.length} casos`}
                <Calculator className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {incorrectCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Casos Incorrectos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hoteles</TableHead>
                  <TableHead>Tarifa Empleado</TableHead>
                  <TableHead>Total Cobrado</TableHead>
                  <TableHead>Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incorrectCases.slice(0, 10).map((case_, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{case_.empleado}</TableCell>
                    <TableCell>{case_.fecha}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {case_.hoteles.map((hotel, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Badge variant="outline">{hotel.hotel}</Badge>
                            <span className="text-sm">${hotel.tarifa}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${case_.tarifaEmpleado}</TableCell>
                    <TableCell className="text-red-600 font-medium">${case_.totalCobrado}</TableCell>
                    <TableCell className="text-red-600">${case_.diferencia}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {correctCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Casos Correctos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 mb-2">Mostrando primeros 5 casos correctos:</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hoteles</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {correctCases.slice(0, 5).map((case_, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{case_.empleado}</TableCell>
                    <TableCell>{case_.fecha}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {case_.hoteles.map((hotel, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {hotel.hotel}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">${case_.totalCobrado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
