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
  originalLine: string
  lineNumber: number
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

  const exampleData = `01/04/2025  Tucu  San Miguel, Colores
01/04/2025  Diego  San Miguel, Colores
02/04/2025  Tucu  Monaco
02/04/2025  Diego  Jaguel, Argentina`

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

      const hasDoubleSpace = trimmedLine.includes("  ")
      let parts: string[]

      if (hasDoubleSpace) {
        const sections = trimmedLine.split("  ").filter((part) => part.trim())
        parts = sections
      } else {
        parts = trimmedLine.split(" ").filter((part) => part.trim())
      }

      const row: ParsedRow = {
        fecha: "",
        empleado: "",
        hoteles: [],
        valid: true,
        errors: [],
        originalLine: line,
        lineNumber: index + 1,
      }

      if (parts.length < 3) {
        row.valid = false
        row.errors.push(`Formato incorrecto. Debe tener: Fecha Empleado Hoteles`)
      } else {
        const fechaPart = parts[0]
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaPart)) {
          row.valid = false
          row.errors.push(`Fecha debe estar en formato DD/MM/YYYY`)
        } else {
          const [dia, mes, año] = fechaPart.split("/")
          row.fecha = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
        }

        row.empleado = parts[1]
        if (!row.empleado) {
          row.valid = false
          row.errors.push(`Nombre del empleado es requerido`)
        }

        let hotelesStr: string

        if (hasDoubleSpace) {
          hotelesStr = parts.slice(2).join("  ")
        } else {
          hotelesStr = parts.slice(2).join(" ")
        }

        if (hotelesStr.includes(",")) {
          row.hoteles = hotelesStr
            .split(",")
            .map((h) => h.trim())
            .filter((h) => h)
        } else {
          const remainingParts = hotelesStr.split(/\s+/).filter((p) => p.trim())
          const possibleHotels: string[] = []

          let currentHotel = ""
          for (const part of remainingParts) {
            if (currentHotel) {
              currentHotel += " " + part
            } else {
              currentHotel = part
            }

            if (HOTELS.includes(currentHotel)) {
              possibleHotels.push(currentHotel)
              currentHotel = ""
            }
          }

          if (currentHotel) {
            possibleHotels.push(currentHotel)
          }

          row.hoteles = possibleHotels.filter((h) => h)
        }

        if (row.hoteles.length === 0) {
          row.valid = false
          row.errors.push(`Al menos un hotel es requerido`)
        }

        row.hoteles.forEach((hotel) => {
          if (!HOTELS.includes(hotel)) {
            row.valid = false
            row.errors.push(`Hotel "${hotel}" no es válido`)
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
      const existingEmployees = await getEmployees()
      const employeeMap = new Map(existingEmployees.map((emp) => [emp.name.toLowerCase(), emp]))

      let createdEmployees = 0
      let createdAssignments = 0
      let createdPayments = 0
      let errors = 0

      const groupedAssignments = new Map<string, GroupedAssignment>()

      const validRows = parsedData.filter((row) => row.valid)

      for (const row of validRows) {
        const key = `${row.empleado.toLowerCase()}-${row.fecha}`

        if (groupedAssignments.has(key)) {
          const existing = groupedAssignments.get(key)!
          const allHotels = [...existing.hoteles, ...row.hoteles]
          existing.hoteles = [...new Set(allHotels)]
        } else {
          groupedAssignments.set(key, {
            empleado: row.empleado,
            fecha: row.fecha,
            hoteles: [...row.hoteles],
          })
        }
      }

      for (const assignment of groupedAssignments.values()) {
        try {
          let employee = employeeMap.get(assignment.empleado.toLowerCase())

          if (!employee) {
            const newEmployee = await saveEmployee({
              name: assignment.empleado,
              role: "Mantenimiento",
              daily_rate: 15000,
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

          assignment.employeeId = employee.id
          assignment.dailyRate = employee.daily_rate

          const dividedRate = assignment.dailyRate! / assignment.hoteles.length

          for (const hotel of assignment.hoteles) {
            const assignmentResult = await saveAssignment({
              employee_id: employee.id,
              hotel_name: hotel,
              assignment_date: assignment.fecha,
              daily_rate_used: dividedRate,
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

        group.totalAmount += employee.daily_rate
        group.assignmentDates.push(assignment.fecha)
      }

      for (const group of paymentGroups.values()) {
        try {
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
                  <strong>Formatos aceptados:</strong>
                  <div className="mt-2 space-y-2">
                    <div className="text-sm">
                      <strong className="text-blue-600">Opción 1 (Recomendado):</strong> Fecha + DOBLE ESPACIO + Nombre
                      + DOBLE ESPACIO + Hoteles
                    </div>
                    <div className="text-sm">
                      <strong>Opción 2:</strong> Fecha + ESPACIO + Nombre + ESPACIO + Hoteles
                    </div>
                  </div>
                </div>
                <div>
                  <strong>Ejemplo con doble espacio:</strong>
                  <div className="mt-2 text-xs bg-gray-100 p-3 rounded-lg space-y-1 font-mono">
                    <div className="break-all">01/04/2025··Tucu··San Miguel, Colores</div>
                    <div className="break-all">01/04/2025··Diego··San Miguel, Colores</div>
                    <div className="break-all">02/04/2025··Tucu··Monaco</div>
                    <div className="break-all">02/04/2025··Diego··Jaguel, Argentina</div>
                    <div className="text-xs text-gray-500 mt-2">(·· representa doble espacio)</div>
                  </div>
                </div>
                <div className="text-sm text-blue-600">
                  <strong>💡 Tip:</strong> El doble espacio es más confiable para nombres con espacios. Los hoteles
                  pueden estar separados por comas o espacios.
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div>
            <label className="block text-sm font-medium mb-2">Datos a importar:</label>
            <Textarea
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              placeholder="Pega aquí los datos en el formato especificado...&#10;Ejemplo con doble espacio:&#10;01/04/2025  Tucu  San Miguel, Colores&#10;01/04/2025  Diego  Monaco&#10;02/04/2025  Nacho  Jaguel, Argentina"
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
        <>
          {invalidRows.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  Líneas con Errores ({invalidRows.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Las siguientes líneas contienen errores. Por favor corrígelas antes de importar.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {invalidRows.map((row, index) => (
                    <div key={index} className="border-2 border-red-300 bg-red-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <Badge variant="destructive" className="shrink-0">
                          Línea {row.lineNumber}
                        </Badge>
                        <div className="flex-1 space-y-2">
                          <div className="font-mono text-sm bg-white p-2 rounded border border-red-200 break-all">
                            {row.originalLine}
                          </div>
                          <div className="space-y-1">
                            {row.errors.map((error, errorIndex) => (
                              <div key={errorIndex} className="flex items-start gap-2 text-sm text-red-700">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {groupedPreview.size > 0 && (
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

                {groupedPreview.size > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-green-600" />✅ Resumen - Se crearán asignaciones Y se
                      marcarán semanas como pagadas:
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
                        <div className="text-sm text-gray-500 text-center">
                          ... y {groupedPreview.size - 10} días más
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
