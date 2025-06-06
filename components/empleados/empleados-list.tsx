"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee } from "@/lib/employee-types"
import { Loader2, Search, Users, Edit, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EmpleadosList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { getEmployees, deleteEmployee } = useEmployeeDB()
  const { toast } = useToast()

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error("Error al cargar empleados:", error)
      setError("Error al cargar los empleados")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${name}?`)) {
      return
    }

    try {
      const success = await deleteEmployee(id)
      if (success) {
        toast({
          title: "Empleado eliminado",
          description: `${name} ha sido eliminado correctamente`,
        })
        loadEmployees()
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el empleado. Puede tener asignaciones pendientes.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar empleado:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el empleado",
        variant: "destructive",
      })
    }
  }

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando empleados...</span>
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
            <Users className="h-5 w-5" />
            Lista de Empleados ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No se encontraron empleados" : "No hay empleados registrados"}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{employee.name}</h3>
                      <Badge variant={employee.active ? "default" : "secondary"}>
                        {employee.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Rol:</span> {employee.role || "No especificado"}
                      </div>
                      <div>
                        <span className="font-medium">Tarifa diaria:</span> $
                        {employee.daily_rate?.toLocaleString() || "0"}
                      </div>
                      {employee.created_at && (
                        <div>
                          <span className="font-medium">Registrado:</span>{" "}
                          {new Date(employee.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id, employee.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
