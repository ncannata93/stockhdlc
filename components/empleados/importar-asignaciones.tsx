"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEmployeeDB } from "@/lib/employee-db"
import type { EmployeeAssignment } from "@/lib/employee-types"
import { Upload, FileText, CheckCircle, AlertCircle, Download, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImportResult {
  success: number
  errors: string[]
  total: number
}

export default function ImportarAsignaciones() {
  const [csvData, setCsvData] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])

  const { addAssignment, addEmployee } = useEmployeeDB()
  const { toast } = useToast()

  const parseCsvData = (data: string) => {
    const lines = data.trim().split("\n")
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim())
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      return row
    })

    return rows
  }

  const handlePreview = () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa datos CSV para previsualizar",
        variant: "destructive",
      })
      return
    }

    try {
      const parsed = parseCsvData(csvData)
      setPreviewData(parsed.slice(0, 5)) // Mostrar solo las primeras 5 filas
      toast({
        title: "Vista previa generada",
        description: `Se encontraron ${parsed.length} filas de datos`,
      })
    } catch (error) {
      toast({
        title: "Error en vista previa",
        description: "Error al procesar los datos CSV",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa datos CSV para importar",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const rows = parseCsvData(csvData)
      let successCount = 0
      const errors: string[] = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]

        try {
          // Crear empleado si no existe
          if (row.employee_name && row.employee_name.trim()) {
            await addEmployee({
              name: row.employee_name.trim(),
              role: row.employee_role?.trim() || null,
              daily_rate: row.daily_rate ? Number.parseFloat(row.daily_rate) : null,
              active: true,
            })
          }

          // Crear asignación
          const assignmentData: Omit<EmployeeAssignment, "id" | "employee_name"> = {
            employee_id: Number.parseInt(row.employee_id) || 1,
            hotel_name: row.hotel_name?.trim() || "Hotel Sin Nombre",
            assignment_date: row.assignment_date || new Date().toISOString().split("T")[0],
            daily_rate_used: row.daily_rate_used ? Number.parseFloat(row.daily_rate_used) : null,
            notes: row.notes?.trim() || null,
            paid: row.paid === "true" || row.paid === "1" || false,
          }

          const success = await addAssignment(assignmentData)
          if (success) {
            successCount++
          } else {
            errors.push(`Fila ${i + 2}: No se pudo crear la asignación`)
          }
        } catch (error) {
          errors.push(`Fila ${i + 2}: ${error instanceof Error ? error.message : "Error desconocido"}`)
        }
      }

      setResult({
        success: successCount,
        errors: errors,
        total: rows.length,
      })

      if (successCount > 0) {
        toast({
          title: "Importación completada",
          description: `Se importaron ${successCount} de ${rows.length} registros`,
        })
      }
    } catch (error) {
      console.error("Error en importación:", error)
      toast({
        title: "Error de importación",
        description: "Ocurrió un error durante la importación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearData = () => {
    setCsvData("")
    setPreviewData([])
    setResult(null)
  }

  const sampleCsv = `employee_id,employee_name,employee_role,hotel_name,assignment_date,daily_rate_used,notes,paid
1,Juan Pérez,Limpieza,Hotel Plaza,2024-04-01,150.00,Turno matutino,false
2,María García,Mantenimiento,Hotel Central,2024-04-01,180.00,Reparación AC,true
3,Carlos López,Limpieza,Hotel Vista,2024-04-02,150.00,,false`

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
          <div className="space-y-2">
            <label className="text-sm font-medium">Datos CSV</label>
            <Textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Pega aquí tus datos CSV..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handlePreview} variant="outline" disabled={loading}>
              <FileText className="h-4 w-4 mr-2" />
              Vista Previa
            </Button>
            <Button onClick={handleImport} disabled={loading || !csvData.trim()}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {loading ? "Importando..." : "Importar"}
            </Button>
            <Button onClick={clearData} variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ejemplo de formato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Formato CSV Esperado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">El archivo CSV debe tener las siguientes columnas:</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <code className="text-sm">{sampleCsv}</code>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCsvData(sampleCsv)}>
              <Download className="h-4 w-4 mr-2" />
              Usar Ejemplo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa (Primeras 5 filas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <th key={key} className="border border-gray-300 px-2 py-1 text-left">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-2 py-1">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success === result.total ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Resultados de Importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                <div className="text-sm text-gray-600">Exitosos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                <div className="text-sm text-gray-600">Errores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Errores encontrados:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {result.success > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ¡Importación completada! Se procesaron {result.success} registros correctamente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
