"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Calculator, RefreshCw } from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import { useToast } from "@/hooks/use-toast"

interface TarifaIncorrecta {
  empleado: string
  fecha: string
  hoteles: number
  tarifaActual: number
  tarifaCorrecta: number
  totalActual: number
  totalCorrecto: number
  assignmentIds: number[]
}

export default function CorregirTarifas() {
  const [tarifasIncorrectas, setTarifasIncorrectas] = useState<TarifaIncorrecta[]>([])
  const [loading, setLoading] = useState(false)
  const [correcting, setCorrecting] = useState(false)
  const { getAssignments, updateAssignment } = useEmployeeDB()
  const { toast } = useToast()

  const diagnosticarTarifas = async () => {
    setLoading(true)
    try {
      const assignments = await getAssignments()

      // Agrupar por empleado y fecha
      const grouped = new Map<string, any[]>()

      assignments.forEach((assignment) => {
        if (assignment.notes?.includes("Importado masivamente")) {
          const key = `${assignment.employee_id}-${assignment.assignment_date}`
          if (!grouped.has(key)) {
            grouped.set(key, [])
          }
          grouped.get(key)!.push(assignment)
        }
      })

      // Identificar problemas
      const problemas: TarifaIncorrecta[] = []

      grouped.forEach((assignmentsGroup) => {
        if (assignmentsGroup.length > 1) {
          const first = assignmentsGroup[0]
          const tarifaActual = first.daily_rate_used || 0
          const hoteles = assignmentsGroup.length
          const tarifaCorrecta = tarifaActual / hoteles
          const totalActual = tarifaActual * hoteles
          const totalCorrecto = tarifaActual

          // Solo agregar si hay diferencia significativa
          if (Math.abs(totalActual - totalCorrecto) > 1) {
            problemas.push({
              empleado: first.employee_name || `Empleado ${first.employee_id}`,
              fecha: first.assignment_date,
              hoteles,
              tarifaActual,
              tarifaCorrecta,
              totalActual,
              totalCorrecto,
              assignmentIds: assignmentsGroup.map((a) => a.id),
            })
          }
        }
      })

      setTarifasIncorrectas(problemas)

      toast({
        title: "Diagnóstico completado",
        description: `Se encontraron ${problemas.length} días con tarifas incorrectas`,
        variant: problemas.length > 0 ? "destructive" : "default",
      })
    } catch (error) {
      console.error("Error en diagnóstico:", error)
      toast({
        title: "Error",
        description: "Error al diagnosticar tarifas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const corregirTarifas = async () => {
    setCorrecting(true)
    try {
      let corregidas = 0
      let errores = 0

      for (const problema of tarifasIncorrectas) {
        try {
          // Actualizar cada asignación con la tarifa correcta
          for (const assignmentId of problema.assignmentIds) {
            const success = await updateAssignment(assignmentId, {
              daily_rate_used: problema.tarifaCorrecta,
            })

            if (success) {
              corregidas++
            } else {
              errores++
            }
          }
        } catch (error) {
          console.error(`Error corrigiendo asignación:`, error)
          errores++
        }
      }

      toast({
        title: "Corrección completada",
        description: `${corregidas} asignaciones corregidas, ${errores} errores`,
      })

      // Limpiar la lista después de corregir
      if (errores === 0) {
        setTarifasIncorrectas([])
      }
    } catch (error) {
      console.error("Error en corrección:", error)
      toast({
        title: "Error",
        description: "Error al corregir tarifas",
        variant: "destructive",
      })
    } finally {
      setCorrecting(false)
    }
  }

  const totalProblemas = tarifasIncorrectas.reduce((sum, p) => sum + (p.totalActual - p.totalCorrecto), 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Diagnóstico y Corrección de Tarifas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta herramienta identifica y corrige empleados que tienen tarifas duplicadas cuando trabajan en múltiples
              hoteles el mismo día.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={diagnosticarTarifas} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
              {loading ? "Diagnosticando..." : "Diagnosticar Tarifas"}
            </Button>

            {tarifasIncorrectas.length > 0 && (
              <Button onClick={corregirTarifas} disabled={correcting} variant="destructive">
                {correcting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {correcting ? "Corrigiendo..." : "Corregir Todas"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {tarifasIncorrectas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Tarifas Incorrectas Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-800">{tarifasIncorrectas.length}</div>
                <div className="text-sm text-red-600">Días con problemas</div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-800">${totalProblemas.toLocaleString()}</div>
                <div className="text-sm text-orange-600">Sobrepago total</div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">
                  {tarifasIncorrectas.reduce((sum, p) => sum + p.assignmentIds.length, 0)}
                </div>
                <div className="text-sm text-blue-600">Asignaciones afectadas</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Detalle de problemas:</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {tarifasIncorrectas.map((problema, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm bg-red-50 p-3 rounded">
                    <Badge variant="outline">{problema.empleado}</Badge>
                    <span className="font-medium">{problema.fecha}</span>
                    <Badge variant="secondary">{problema.hoteles} hoteles</Badge>
                    <span className="text-red-600">
                      ${problema.totalActual.toLocaleString()} → ${problema.totalCorrecto.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      Ahorro: ${(problema.totalActual - problema.totalCorrecto).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tarifasIncorrectas.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">¡Tarifas Correctas!</h3>
            <p className="text-green-600">No se encontraron problemas en las tarifas de empleados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
