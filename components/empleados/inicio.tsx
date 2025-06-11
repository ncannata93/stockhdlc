"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEmployeeDB } from "@/lib/employee-db"
import { useState, useEffect } from "react"
import { UserPlus, Calendar, BarChart3, ListChecks } from "lucide-react"

interface InicioProps {
  onTabChange?: (tab: string) => void
}

export default function Inicio({ onTabChange }: InicioProps) {
  const { getEmployees, getAssignments } = useEmployeeDB()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeAssignments: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        // Cargar empleados
        const employees = await getEmployees()

        // Cargar asignaciones del mes actual
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

        const assignments = await getAssignments({
          start_date: firstDay.toISOString().split("T")[0],
          end_date: lastDay.toISOString().split("T")[0],
        })

        // Calcular estadísticas
        setStats({
          totalEmployees: employees.length,
          activeAssignments: assignments.length,
          pendingPayments: 0, // Esto requeriría otra consulta
        })
      } catch (error) {
        console.error("Error al cargar estadísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [getEmployees, getAssignments])

  const handleQuickAction = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona empleados y asignaciones</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Button className="h-20 flex-col gap-2" variant="outline" onClick={() => handleQuickAction("empleados")}>
            <ListChecks className="h-6 w-6" />
            <span>Gestionar Empleados</span>
          </Button>

          <Button className="h-20 flex-col gap-2" variant="outline" onClick={() => handleQuickAction("agregar")}>
            <UserPlus className="h-6 w-6" />
            <span>Nueva Asignación</span>
          </Button>

          <Button className="h-20 flex-col gap-2" variant="outline" onClick={() => handleQuickAction("resumen")}>
            <BarChart3 className="h-6 w-6" />
            <span>Resumen de Pagos</span>
          </Button>

          <Button className="h-20 flex-col gap-2" variant="outline" onClick={() => handleQuickAction("calendario")}>
            <Calendar className="h-6 w-6" />
            <span>Ver Calendario</span>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estadísticas</CardTitle>
          <CardDescription>Resumen del sistema</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-sm font-medium">Total de Empleados</div>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalEmployees}</div>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-sm font-medium">Asignaciones Activas</div>
            <div className="text-2xl font-bold">{loading ? "..." : stats.activeAssignments}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Pagos Pendientes</div>
            <div className="text-2xl font-bold">{loading ? "..." : stats.pendingPayments}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
          <CardDescription>Cómo usar el sistema</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <ol className="list-decimal pl-4 space-y-2">
            <li>
              <strong>Gestionar Empleados:</strong> Agrega, edita o elimina empleados del sistema.
            </li>
            <li>
              <strong>Agregar Asignaciones:</strong> Asigna empleados a hoteles en fechas específicas.
            </li>
            <li>
              <strong>Ver Calendario:</strong> Visualiza todas las asignaciones en formato calendario.
            </li>
            <li>
              <strong>Resumen de Pagos:</strong> Gestiona los pagos semanales a empleados.
            </li>
            <li>
              <strong>Historial:</strong> Consulta el historial completo de asignaciones.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
