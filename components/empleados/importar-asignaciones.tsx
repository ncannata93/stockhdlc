"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertCircle, Users, Calendar, Calculator } from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import { HOTELS } from "@/lib/employee-types"
import { useToast } from "@/hooks/use-toast"
import type { Employee } from "@/lib/employee-types"

interface ImportarAsignacionesProps {
  onSuccess?: () => void
}

interface ParsedRow {
  fecha: string
  empleado: string
  hoteles: string[]
  valid: boolean
  errors: string[]
}

interface GroupedAssignment {
  empleado: string
  fecha: string
  hoteles: string[]
  employeeId?: number
  dailyRate?: number
}

export default function ImportarAsignaciones({ onSuccess }: ImportarAsignacionesProps) {
  const [textData, setTextData] = useState("")
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { getEmployees, saveEmployee, saveAssignment, getPaidWeeks, markWeekAsPaid } = useEmployeeDB()
  const { toast } = useToast()

  // Ejemplo de formato
  const exampleData = `01/04/2025	Tucu	San Miguel, Colores
01/04/2025	Diego	San Miguel, Colores
02/04/2025	Tucu	Monaco
02/04/2025	Diego	Jaguel, Argentina`

  const parseData = () => {
    if (!textData.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa los datos a importar",
        variant: "destructive",
      })
      return
    }

    const lines = textData.trim().split("\n")
    const parsed: ParsedRow[] = []

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      // Separar por tabulación o múltiples espacios
      const parts = trimmedLine.split(/\t+|\s{2,}/).map((p) => p.trim())

      const row: ParsedRow = {
        fecha: "",
        empleado: "",
        hoteles: [],
        valid: true,
        errors: [],
      }

      // Validar que tenga al menos 3 partes
      if (parts.length < 3) {
        row.valid = false
        row.errors.push(`Línea ${index + 1}: Formato incorrecto. Debe tener: Fecha, Empleado, Hoteles`)
      } else {
        // Fecha
        const fechaPart = parts[0]
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaPart)) {
          row.valid = false
          row.errors.push(`Línea ${index + 1}: Fecha debe estar en formato DD/MM/YYYY`)
        } else {
          // Convertir a formato ISO (YYYY-MM-DD)
          const [dia, mes, año] = fechaPart.split("/")
          row.fecha = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
        }

        // Empleado
        row.empleado = parts[1]
        if (!row.empleado) {
          row.valid = false
          row.errors.push(`Línea ${index + 1}: Nombre del empleado es requerido`)
        }

        // Hoteles
        const hotelesStr = parts.slice(2).join(" ")
        row.hoteles = hotelesStr
          .split(",")
          .map((h) => h.trim())
          .filter((h) => h)

        if (row.hoteles.length === 0) {
          row.valid = false
          row.errors.push(`Línea ${index + 1}: Al menos un hotel es requerido`)
        }

        // Validar que los hoteles existan
        row.hoteles.forEach((hotel) => {
          if (!HOTELS.includes(hotel)) {
            row.valid = false
            row.errors.push(`Línea ${index + 1}: Hotel "${hotel}" no es válido`)
          }
        })
      }

      parsed.push(row)
    })

    setParsedData(parsed)
    setShowPreview(true)
  }

  const processImport = async () => {
    setIsProcessing(true)

    try {
      // Obtener empleados existentes
      const existingEmployees = await getEmployees()
      const employeeMap = new Map(existingEmployees.map((emp) => [emp.name.toLowerCase(), emp]))

      let createdEmployees = 0
      let createdAssignments = 0
      let createdPayments = 0
      let errors = 0

      // PASO 1: Agrupar asignaciones por empleado y fecha
      const groupedAssignments = new Map<string, GroupedAssignment>()

      // Procesar solo filas válidas
      const validRows = parsedData.filter((row) => row.valid)

      for (const row of validRows) {
        const key = `${row.empleado.toLowerCase()}-${row.fecha}`

        if (groupedAssignments.has(key)) {
          // Agregar hoteles a la asignación existente (sin duplicados)
          const existing = groupedAssignments.get(key)!
          const allHotels = [...existing.hoteles, ...row.hoteles]
          existing.hoteles = [...new Set(allHotels)] // Eliminar duplicados
        } else {
          // Crear nueva asignación agrupada
          groupedAssignments.set(key, {
            empleado: row.empleado,
            fecha: row.fecha,
            hoteles: [...row.hoteles],
          })
        }
      }

      // PASO 2: Procesar cada asignación agrupada
      for (const assignment of groupedAssignments.values()) {
        try {
          // Buscar o crear empleado
          let employee = employeeMap.get(assignment.empleado.toLowerCase())

          if (!employee) {
            // Crear nuevo empleado
            const newEmployee = await saveEmployee({
              name: assignment.empleado,
              role: "Mantenimiento",
              daily_rate: 15000, // Tarifa por defecto
            })

            if (newEmployee) {
              employee = newEmployee
              employeeMap.set(assignment.empleado.toLowerCase(), employee)
              createdEmployees++
            } else {
              errors++
              continue
            }
          }

          // Guardar el ID del empleado para crear pagos después
          assignment.employeeId = employee.id
          assignment.dailyRate = employee.daily_rate

          // PASO 3: Crear asignaciones individuales con tarifa dividida
          // Calcular tarifa dividida por la cantidad de hoteles ese día
          const dividedRate = assignment.dailyRate! / assignment.hoteles.length

          for (const hotel of assignment.hoteles) {
            const assignmentResult = await saveAssignment({
              employee_id: employee.id,
              hotel_name: hotel,
              assignment_date: assignment.fecha,
              daily_rate_used: dividedRate, // Usar tarifa dividida
              notes: `Importado masivamente el ${new Date().toISOString().split("T")[0]} - Tarifa dividida entre ${assignment.hoteles.length} hotel(es): $${dividedRate.toLocaleString()}`,
            })

            if (assignmentResult) {
              createdAssignments++
            } else {
              errors++
            }
          }
        } catch (error) {
          errors++
        }
      }

      // PASO 4: Marcar semanas como pagadas usando el sistema simplificado
      const paymentGroups = new Map<
        string,
        {
          employee: Employee
          weekStart: string
          weekEnd: string
          totalAmount: number
          assignmentDates: string[]
        }
      >()

      for (const assignment of groupedAssignments.values()) {
        if (!assignment.employeeId || !assignment.dailyRate) continue

        const employee = employeeMap.get(assignment.empleado.toLowerCase())
        if (!employee) continue

        // Calcular inicio y fin de semana (lunes a domingo)
        const assignmentDate = new Date(assignment.fecha)
        const dayOfWeek = assignmentDate.getDay()
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

        const weekStart = new Date(assignmentDate)
        weekStart.setDate(assignmentDate.getDate() + mondayOffset)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        const weekStartStr = weekStart.toISOString().split("T")[0]
        const weekEndStr = weekEnd.toISOString().split("T")[0]

        const key = `${employee.id}-${weekStartStr}`

        if (!paymentGroups.has(key)) {
          paymentGroups.set(key, {
            employee,
            weekStart: weekStartStr,
            weekEnd: weekEndStr,
            totalAmount: 0,
            assignmentDates: [],
          })
        }

        const group = paymentGroups.get(key)!

        // Calcular el total para este día (tarifa completa del empleado)
        group.totalAmount += employee.daily_rate
        group.assignmentDates.push(assignment.fecha)
      }

      // Marcar semanas como pagadas usando el sistema simplificado
      for (const group of paymentGroups.values()) {
        try {
          // Verificar si ya existe una semana pagada
          const existingPaidWeeks = await getPaidWeeks({
            employee_id: group.employee.id,
            start_date: group.weekStart,
            end_date: group.weekEnd,
          })

          if (!existingPaidWeeks || existingPaidWeeks.length === 0) {
            const success = await markWeekAsPaid(
              group.employee.id,
              group.weekStart,
              group.weekEnd,
              group.totalAmount,
              `Pago generado automáticamente por importación masiva - Fechas: ${group.assignmentDates.join(", ")}`,
            )

            if (success) {
              createdPayments++
            } else {
              errors++
            }
          }
        } catch (error) {
          errors++
        }
      }

      toast({
        title: "✅ Importación completada",
        description: `Empleados: ${createdEmployees}, Asignaciones: ${createdAssignments}, Semanas pagadas: ${createdPayments}, Errores: ${errors}`,
      })

      if (errors === 0) {
        setTextData("")
        setParsedData([])
        setShowPreview(false)
        onSuccess?.()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error durante la importación",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const validRows = parsedData.filter((row) => row.valid)
  const invalidRows = parsedData.filter((row) => !row.valid)
  const totalAssignments = validRows.reduce((sum, row) => sum + row.hoteles.length, 0)

  // Calcular vista previa con agrupación
  const groupedPreview = new Map<string, GroupedAssignment>()
  for (const row of validRows) {
    const key = `${row.empleado.toLowerCase()}-${row.fecha}`

    if (groupedPreview.has(key)) {
      const existing = groupedPreview.get(key)!
      const allHotels = [...existing.hoteles, ...row.hoteles]
      existing.hoteles = [...new Set(allHotels)]
    } else {
      groupedPreview.set(key, {
        empleado: row.empleado,
        fecha: row.fecha,
        hoteles: [...row.hoteles],
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Asignaciones Masivamente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <Calculator className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Importación Completa:</strong> Ahora crea automáticamente asignaciones Y marca las semanas como
              pagadas.
              <br />
              <strong>Ejemplo:</strong> Diego trabaja 3 días → Se marcan las semanas correspondientes como pagadas.
            </AlertDescription>
          </Alert>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <strong>Formato esperado:</strong> Fecha (DD/MM/YYYY) + TAB + Nombre + TAB + Hoteles (separados por
                  comas)
                </div>
                <div>
                  <strong>Ejemplo:</strong>
                  <div className="mt-2 text-xs bg-gray-100 p-3 rounded-lg space-y-1 font-mono">
                    <div className="break-all">01/04/2025 → Tucu → San Miguel, Colores</div>
                    <div className="break-all">01/04/2025 → Diego → San Miguel, Colores</div>
                    <div className="break-all">02/04/2025 → Tucu → Monaco</div>
                    <div className="break-all">02/04/2025 → Diego → Jaguel, Argentina</div>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div>
            <label className="block text-sm font-medium mb-2">Datos a importar:</label>
            <Textarea
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              placeholder="Pega aquí los datos en el formato especificado..."
              rows={8}
              className="font-mono text-sm resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={parseData} disabled={!textData.trim()} className="w-full sm:w-auto">
              <FileText className="h-4 w-4 mr-2" />
              Analizar Datos
            </Button>

            {showPreview && (
              <Button
                onClick={processImport}
                disabled={isProcessing || validRows.length === 0}
                variant="default"
                className="w-full sm:w-auto"
              >
                {isProcessing ? "Procesando..." : "Importar"}
                <Upload className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Vista Previa - Importación Completa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium text-sm">Días de trabajo</span>
                </div>
                <div className="text-xl font-bold text-green-800">{groupedPreview.size}</div>
                <div className="text-xs text-green-600">{totalAssignments} asignaciones totales</div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium text-sm">Con errores</span>
                </div>
                <div className="text-xl font-bold text-red-800">{invalidRows.length}</div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-sm">Empleados únicos</span>
                </div>
                <div className="text-xl font-bold text-blue-800">
                  {new Set(validRows.map((row) => row.empleado.toLowerCase())).size}
                </div>
              </div>
            </div>

            {invalidRows.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errores encontrados:</strong>
                  <ul className="mt-2 space-y-1">
                    {invalidRows.slice(0, 5).map((row, index) => (
                      <li key={index} className="text-sm">
                        {row.errors.join(", ")}
                      </li>
                    ))}
                    {invalidRows.length > 5 && <li className="text-sm">... y {invalidRows.length - 5} errores más</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {groupedPreview.size > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-green-600" />✅ Resumen - Se crearán asignaciones Y se marcarán
                  semanas como pagadas:
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {Array.from(groupedPreview.values())
                    .slice(0, 10)
                    .map((assignment, index) => (
                      <div key={index} className="bg-green-50 p-3 rounded border border-green-200 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{assignment.fecha}</span>
                          <Badge variant="outline" className="border-green-300 text-xs">
                            {assignment.empleado}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {assignment.hoteles.map((hotel, hotelIndex) => (
                            <Badge key={hotelIndex} variant="secondary" className="text-xs">
                              {hotel}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          ✅ Asignaciones + Semana pagada
                          {assignment.hoteles.length > 1 && (
                            <div className="text-xs text-blue-600">
                              Tarifa dividida: ${(15000 / assignment.hoteles.length).toLocaleString()} c/u
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  {groupedPreview.size > 10 && (
                    <div className="text-sm text-gray-500 text-center">... y {groupedPreview.size - 10} días más</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
