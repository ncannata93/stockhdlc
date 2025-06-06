"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEmployeeDB } from "@/lib/employee-db"
import type { EmployeeAssignment, Employee } from "@/lib/employee-types"
import { formatDateForDisplay } from "@/lib/date-utils"
import { Loader2, History, Search, Filter, Calendar, MapPin, DollarSign, AlertCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EmpleadosHistorial() {
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [selectedHotel, setSelectedHotel] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  const { getAssignments, getEmployees, deleteAssignment } = useEmployeeDB()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [assignmentsData, employeesData] = await Promise.all([getAssignments(), getEmployees()])
      setAssignments(assignmentsData)
      setEmployees(employeesData)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setError("Error al cargar los datos del historial")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, employeeName: string, hotelName: string, date: string) => {
    if (!confirm(`¿Eliminar la asignación de ${employeeName} en ${hotelName} del ${formatDateForDisplay(date)}?`)) {
      return
    }

    try {
      const success = await deleteAssignment(id)
      if (success) {
        toast({
          title: "Asignación eliminada",
          description: "La asignación ha sido eliminada correctamente",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar la asignación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar asignación:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la asignación",
        variant: "destructive",
      })
    }
  }

  // Obtener lista única de hoteles
  const uniqueHotels = [...new Set(assignments.map((a) => a.hotel_name))].sort()

  // Filtrar asignaciones
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEmployee = selectedEmployee === "all" || assignment.employee_id.toString() === selectedEmployee

    const matchesHotel = selectedHotel === "all" || assignment.hotel_name === selectedHotel

    return matchesSearch && matchesEmployee && matchesHotel
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando historial...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Asignaciones ({assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los empleados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedHotel} onValueChange={setSelectedHotel}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los hoteles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los hoteles</SelectItem>
                {uniqueHotels.map((hotel) => (
                  <SelectItem key={hotel} value={hotel}>
                    {hotel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={loadData}>
              <Filter className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {/* Resultados */}
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedEmployee !== "all" || selectedHotel !== "all"
                ? "No se encontraron asignaciones con los filtros aplicados"
                : "No hay asignaciones registradas"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {assignment.employee_name || `Empleado #${assignment.employee_id}`}
                          </h3>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {assignment.hotel_name}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDateForDisplay(assignment.assignment_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>${assignment.daily_rate_used?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={assignment.paid ? "default" : "secondary"}>
                              {assignment.paid ? "Pagado" : "Pendiente"}
                            </Badge>
                          </div>
                        </div>

                        {assignment.notes && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Notas:</strong> {assignment.notes}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDelete(
                            assignment.id,
                            assignment.employee_name || `Empleado #${assignment.employee_id}`,
                            assignment.hotel_name,
                            assignment.assignment_date,
                          )
                        }
                        className="text-red-600 hover:text-red-700 ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Estadísticas rápidas */}
          {filteredAssignments.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredAssignments.length}</div>
                  <div className="text-sm text-blue-700">Total Asignaciones</div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${filteredAssignments.reduce((sum, a) => sum + (a.daily_rate_used || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">Total Monto</div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {[...new Set(filteredAssignments.map((a) => a.employee_id))].length}
                  </div>
                  <div className="text-sm text-purple-700">Empleados Únicos</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
