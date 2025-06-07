"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeeAssignment } from "@/lib/employee-types"
import { Users, Calendar, DollarSign, TrendingUp, Plus, Upload } from "lucide-react"

export default function EmpleadosInicio() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const { getEmployees, getAssignments } = useEmployeeDB()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [employeesData, assignmentsData] = await Promise.all([getEmployees(), getAssignments()])

        setEmployees(employeesData || [])
        setAssignments(assignmentsData || [])
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setEmployees([])
        setAssignments([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Calcular estadísticas
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((emp) => emp.active).length
  const totalAssignments = assignments.length
  const totalEarnings = assignments.reduce((sum, assignment) => sum + (assignment.daily_rate_used || 0), 0)

  // Asignaciones recientes (últimos 7 días)
  const recentAssignments = assignments.filter((assignment) => {
    const assignmentDate = new Date(assignment.assignment_date)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - assignmentDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-600">Gestión de empleados y asignaciones</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {new Date().toLocaleDateString()}
        </Badge>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
                <p className="text-xs text-gray-500">{activeEmployees} activos</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asignaciones</p>
                <p className="text-2xl font-bold">{totalAssignments}</p>
                <p className="text-xs text-gray-500">{recentAssignments.length} esta semana</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold">${totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Todas las asignaciones</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio por Día</p>
                <p className="text-2xl font-bold">
                  ${totalAssignments > 0 ? Math.round(totalEarnings / totalAssignments).toLocaleString() : "0"}
                </p>
                <p className="text-xs text-gray-500">Por asignación</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2">
              <Plus className="h-6 w-6" />
              <span>Agregar Empleado</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Calendar className="h-6 w-6" />
              <span>Nueva Asignación</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Upload className="h-6 w-6" />
              <span>Importar Datos</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Asignaciones recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAssignments.length > 0 ? (
            <div className="space-y-3">
              {recentAssignments.slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{assignment.employee_name || `Empleado #${assignment.employee_id}`}</p>
                    <p className="text-sm text-gray-600">{assignment.hotel_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${assignment.daily_rate_used?.toLocaleString() || "0"}</p>
                    <p className="text-sm text-gray-600">{new Date(assignment.assignment_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay actividad reciente</h3>
              <p className="mt-1 text-sm text-gray-500">Las asignaciones de la última semana aparecerán aquí.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empleados destacados */}
      <Card>
        <CardHeader>
          <CardTitle>Empleados Activos</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.slice(0, 6).map((employee) => {
                const employeeAssignments = assignments.filter((a) => a.employee_id === employee.id)
                const totalEarned = employeeAssignments.reduce((sum, a) => sum + (a.daily_rate_used || 0), 0)

                return (
                  <div key={employee.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{employee.name}</h4>
                      <Badge variant={employee.active ? "default" : "secondary"}>
                        {employee.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{employee.role || "Sin rol asignado"}</p>
                    <div className="mt-2 text-sm">
                      <p>Asignaciones: {employeeAssignments.length}</p>
                      <p>Total ganado: ${totalEarned.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados registrados</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza agregando empleados al sistema.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
