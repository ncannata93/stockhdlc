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

      for (const row of parsedData) {
        if (!row.valid) {
          errors++
          continue
        }

        try {
          // Buscar o crear empleado
          let employee = employeeMap.get(row.empleado.toLowerCase())

          if (!employee) {
            // Crear nuevo empleado
            const newEmployee = await saveEmployee({
              name: row.empleado,
              role: "Mantenimiento",
              daily_rate: 15000, // Tarifa por defecto
            })

            if (newEmployee) {
              employee = newEmployee
              employeeMap.set(row.empleado.toLowerCase(), employee)
              createdEmployees++
            } else {
              errors++
              continue
            }
          }

          // Crear asignaciones para cada hotel
          for (const hotel of row.hoteles) {
            const assignment = await saveAssignment({
              employee_id: employee.id,
              hotel_name: hotel,
              assignment_date: row.fecha,
              daily_rate_used: employee.daily_rate,
              notes: `Importado masivamente`,
            })

            if (assignment) {
              createdAssignments++
            } else {
              errors++
            }
          }
        } catch (error) {
          console.error("Error procesando fila:", error)
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
                  <span className="font-medium">Válidas</span>
                </div>
                <div className="text-2xl font-bold text-green-800">{validRows.length}</div>
                <div className="text-sm text-green-600">{totalAssignments} asignaciones</div>
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

            {validRows.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Resumen de datos válidos:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {validRows.slice(0, 10).map((row, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{row.fecha}</span>
                      <Badge variant="outline">{row.empleado}</Badge>
                      <span className="text-gray-500">→</span>
                      <div className="flex gap-1">
                        {row.hoteles.map((hotel, hotelIndex) => (
                          <Badge key={hotelIndex} variant="secondary" className="text-xs">
                            {hotel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {validRows.length > 10 && (
                    <div className="text-sm text-gray-500 text-center">... y {validRows.length - 10} filas más</div>
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
