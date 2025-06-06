"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEmployeeDB } from "@/lib/employee-db"
import { Loader2, CheckCircle, AlertCircle, Users, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDateForDisplay } from "@/lib/date-utils"

export default function VerificarImportacion() {
  const { getAssignments, getEmployees } = useEmployeeDB()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<{
    totalAsignaciones: number
    empleados: string[]
    fechaInicio: string
    fechaFin: string
    hoteles: string[]
    totalMonto: number
  } | null>(null)

  const verificarImportacion = async () => {
    setLoading(true)
    try {
      // Obtener todas las asignaciones del período
      const asignaciones = await getAssignments({
        start_date: "2025-04-01",
        end_date: "2025-05-09",
      })

      const empleados = await getEmployees()

      if (asignaciones.length === 0) {
        toast({
          title: "Sin datos",
          description: "No se encontraron asignaciones en el período especificado",
          variant: "destructive",
        })
        return
      }

      // Calcular estadísticas
      const empleadosUnicos = [...new Set(asignaciones.map((a) => a.employee_name).filter(Boolean))]
      const hotelesUnicos = [...new Set(asignaciones.map((a) => a.hotel_name))]
      const fechas = asignaciones.map((a) => a.assignment_date).sort()
      const totalMonto = asignaciones.reduce((sum, a) => sum + (a.daily_rate_used || 0), 0)

      setStats({
        totalAsignaciones: asignaciones.length,
        empleados: empleadosUnicos,
        fechaInicio: fechas[0] || "",
        fechaFin: fechas[fechas.length - 1] || "",
        hoteles: hotelesUnicos,
        totalMonto,
      })

      toast({
        title: "Verificación completada",
        description: `Se encontraron ${asignaciones.length} asignaciones importadas`,
      })
    } catch (error) {
      console.error("Error al verificar importación:", error)
      toast({
        title: "Error",
        description: "No se pudo verificar la importación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Verificar Importación de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Verifica que todas las asignaciones del período abril-mayo 2025 se hayan importado correctamente.
            </p>
            <Button onClick={verificarImportacion} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verificar Importación
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Resumen de Importación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total de asignaciones:</span>
                  <span className="font-bold text-lg">{stats.totalAsignaciones}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Empleados involucrados:</span>
                  <span className="font-bold">{stats.empleados.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Hoteles diferentes:</span>
                  <span className="font-bold">{stats.hoteles.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Período:</span>
                  <span className="font-bold">
                    {formatDateForDisplay(stats.fechaInicio)} - {formatDateForDisplay(stats.fechaFin)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monto total:</span>
                  <span className="font-bold text-green-600">${stats.totalMonto.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Detalles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Empleados:</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.empleados.map((emp) => (
                      <span key={emp} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                        {emp}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Hoteles más frecuentes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.hoteles.slice(0, 8).map((hotel) => (
                      <span key={hotel} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
                        {hotel}
                      </span>
                    ))}
                    {stats.hoteles.length > 8 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm">
                        +{stats.hoteles.length - 8} más
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Instrucciones de Importación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p>Para importar los datos correctamente:</p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>
                <strong>Ejecuta los scripts SQL</strong> en orden:
                <ul className="list-disc pl-4 mt-1">
                  <li>
                    <code>insertar-asignaciones-abril-mayo.sql</code>
                  </li>
                  <li>
                    <code>insertar-asignaciones-abril-mayo-parte2.sql</code>
                  </li>
                  <li>
                    <code>insertar-asignaciones-abril-mayo-parte3.sql</code>
                  </li>
                </ul>
              </li>
              <li>
                <strong>Verifica que los empleados existan</strong> antes de ejecutar los scripts
              </li>
              <li>
                <strong>Los scripts calculan automáticamente</strong> las tarifas divididas cuando un empleado trabaja
                en múltiples hoteles el mismo día
              </li>
              <li>
                <strong>Usa este componente</strong> para verificar que todo se importó correctamente
              </li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium">💡 Nota importante:</p>
              <p className="text-sm text-blue-700 mt-1">
                Los scripts están diseñados para manejar automáticamente la división de tarifas cuando un empleado
                trabaja en múltiples hoteles el mismo día, tal como funciona en el formulario de agregar asignaciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
