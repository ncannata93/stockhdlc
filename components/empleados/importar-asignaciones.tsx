"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertCircle, Users, Calendar } from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import { HOTELS } from "@/lib/employee-types"
import { useToast } from "@/hooks/use-toast"

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
}

export default function ImportarAsignaciones({ onSuccess }: ImportarAsignacionesProps) {
  const [textData, setTextData] = useState("")
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { getEmployees, saveEmployee, saveAssignment } = useEmployeeDB()
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
      let errors = 0

      // Agrupar asignaciones por empleado y fecha
      const groupedAssignments = new Map<string, GroupedAssignment>()

      // Procesar solo filas válidas
      const validRows = parsedData.filter((row) => row.valid)

      for (const row of validRows) {
        const key = `${row.empleado.toLowerCase()}-${row.fecha}`

        if (groupedAssignments.has(key)) {
          // Agregar hoteles a la asignación existente
          const existing = groupedAssignments.get(key)!
          existing.hoteles = [...new Set([...existing.hoteles, ...row.hoteles])]
        } else {
          // Crear nueva asignación agrupada
          groupedAssignments.set(key, {
            empleado: row.empleado,
            fecha: row.fecha,
            hoteles: [...row.hoteles],
          })
        }
      }

      console.log("Asignaciones agrupadas:", Array.from(groupedAssignments.values()))

      // Procesar cada asignación agrupada
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

          // Calcular tarifa dividida entre los hoteles
          const dividedRate = employee.daily_rate / assignment.hoteles.length

          console.log(`Empleado: ${employee.name}`)
          console.log(`Fecha: ${assignment.fecha}`)
          console.log(`Tarifa diaria: ${employee.daily_rate}`)
          console.log(`Hoteles: ${assignment.hoteles.join(", ")}`)
          console.log(`Tarifa por hotel: ${dividedRate}`)

          // Crear asignaciones para cada hotel con tarifa dividida
          for (const hotel of assignment.hoteles) {
            const assignmentResult = await saveAssignment({
              employee_id: employee.id,
              hotel_name: hotel,
              assignment_date: assignment.fecha,
              daily_rate_used: dividedRate, // Usar la tarifa dividida
              notes: `Importado masivamente`,
            })

            if (assignmentResult) {
              createdAssignments++
              console.log(`✅ Asignación creada: ${hotel} - $${dividedRate}`)
            } else {
              errors++
              console.log(`❌ Error creando asignación: ${hotel}`)
            }
          }
        } catch (error) {
          console.error("Error procesando asignación agrupada:", error)
          errors++
        }
      }

      toast({
        title: "Importación completada",
        description: `Empleados creados: ${createdEmployees}, Asignaciones creadas: ${createdAssignments}, Errores: ${errors}`,
      })

      if (errors === 0) {
        setTextData("")
        setParsedData([])
        setShowPreview(false)
        onSuccess?.()
      }
    } catch (error) {
      console.error("Error en importación:", error)
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
      existing.hoteles = [...new Set([...existing.hoteles, ...row.hoteles])]
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
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato esperado:</strong> Fecha (DD/MM/YYYY) + TAB + Nombre + TAB + Hoteles (separados por comas)
              <br />
              <strong>Ejemplo:</strong>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">{exampleData}</pre>
              <br />
              <strong>Importante:</strong> Si un empleado trabaja en múltiples hoteles el mismo día, su tarifa se
              dividirá automáticamente.
            </AlertDescription>
          </Alert>

          <div>
            <label className="block text-sm font-medium mb-2">Datos a importar:</label>
            <Textarea
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              placeholder="Pega aquí los datos en el formato especificado..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={parseData} disabled={!textData.trim()}>
              <FileText className="h-4 w-4 mr-2" />
              Analizar Datos
            </Button>

            {showPreview && (
              <Button onClick={processImport} disabled={isProcessing || validRows.length === 0} variant="default">
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
              Vista Previa de Importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Días de trabajo</span>
                </div>
                <div className="text-2xl font-bold text-green-800">{groupedPreview.size}</div>
                <div className="text-sm text-green-600">{totalAssignments} asignaciones totales</div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Con errores</span>
                </div>
                <div className="text-2xl font-bold text-red-800">{invalidRows.length}</div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Empleados únicos</span>
                </div>
                <div className="text-2xl font-bold text-blue-800">
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
                <h4 className="font-medium mb-2">Resumen agrupado (tarifa dividida por día):</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {Array.from(groupedPreview.values())
                    .slice(0, 10)
                    .map((assignment, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{assignment.fecha}</span>
                        <Badge variant="outline">{assignment.empleado}</Badge>
                        <span className="text-gray-500">→</span>
                        <div className="flex gap-1">
                          {assignment.hoteles.map((hotel, hotelIndex) => (
                            <Badge key={hotelIndex} variant="secondary" className="text-xs">
                              {hotel}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-blue-600 ml-auto">
                          Tarifa dividida entre {assignment.hoteles.length} hotel
                          {assignment.hoteles.length !== 1 ? "es" : ""}
                        </span>
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
