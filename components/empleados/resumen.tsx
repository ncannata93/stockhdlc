"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeeAssignment } from "@/lib/employee-types"
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react"

export default function EmpleadosResumen() {
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
        console.error("Error al cargar datos del resumen:", error)
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
  const activeAssignments = assignments.filter((a) => {
    const today = new Date()
    const assignmentDate = new Date(a.assignment_date)
    const diffTime = Math.abs(today.getTime() - assignmentDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 // Asignaciones de la última semana
  }).length

  const totalEarnings = assignments.reduce((sum, assignment) => {
    return sum + (assignment.daily_rate_used || 0)
  }, 0)

  const averageRate =
    employees.length > 0 ? employees.reduce((sum, emp) => sum + (emp.daily_rate || 0), 0) / employees.length : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Resumen General</h2>
        </div>
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resumen General</h2>
        <Badge variant="outline" className="text-sm">
          Actualizado: {new Date().toLocaleDateString()}
        </Badge>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asignaciones Activas</p>
                <p className="text-2xl font-bold">{activeAssignments}</p>
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
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tarifa Promedio</p>
                <p className="text-2xl font-bold">${averageRate.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de empleados */}
      <Card>
        <CardHeader>
          <CardTitle>Empleados Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarifa Diaria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => {
                    const recentAssignments = assignments.filter((a) => a.employee_id === employee.id)
                    const hasRecentWork = recentAssignments.some((a) => {
                      const assignmentDate = new Date(a.assignment_date)
                      const today = new Date()
                      const diffTime = Math.abs(today.getTime() - assignmentDate.getTime())
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                      return diffDays <= 7
                    })

                    return (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${employee.daily_rate?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={hasRecentWork ? "default" : "secondary"}>
                            {hasRecentWork ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza agregando empleados al sistema.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de asignaciones recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Asignaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{assignment.employee_name}</p>
                    <p className="text-sm text-gray-600">{assignment.hotel_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${assignment.daily_rate_used?.toLocaleString() || 0}</p>
                    <p className="text-sm text-gray-600">{new Date(assignment.assignment_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay asignaciones</h3>
              <p className="mt-1 text-sm text-gray-500">Las asignaciones aparecerán aquí una vez que se registren.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
