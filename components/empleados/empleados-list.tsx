"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee } from "@/lib/employee-types"
import { Loader2, Pencil, Plus, Trash2, Search, UserCog } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EmpleadosList() {
  const { getEmployees, saveEmployee, deleteEmployee } = useEmployeeDB()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para el formulario de edición
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({
    name: "",
    role: "Mantenimiento",
    daily_rate: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar empleados
  const loadEmployees = async () => {
    setLoading(true)
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  // Filtrar empleados por búsqueda
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Manejar edición de empleado
  const handleEditEmployee = (employee: Employee) => {
    setCurrentEmployee({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      daily_rate: employee.daily_rate,
    })
    setIsDialogOpen(true)
  }

  // Manejar creación de nuevo empleado
  const handleNewEmployee = () => {
    setCurrentEmployee({
      name: "",
      role: "Mantenimiento",
      daily_rate: 0,
    })
    setIsDialogOpen(true)
  }

  // Guardar empleado (nuevo o editado)
  const handleSaveEmployee = async () => {
    if (!currentEmployee.name) {
      toast({
        title: "Error",
        description: "El nombre del empleado es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await saveEmployee(currentEmployee)
      if (result) {
        toast({
          title: "Éxito",
          description: `Empleado ${currentEmployee.id ? "actualizado" : "creado"} correctamente`,
        })
        setIsDialogOpen(false)
        loadEmployees()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el empleado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Eliminar empleado
  const handleDeleteEmployee = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
      return
    }

    try {
      const success = await deleteEmployee(id)
      if (success) {
        toast({
          title: "Éxito",
          description: "Empleado eliminado correctamente",
        })
        loadEmployees()
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el empleado. Puede tener asignaciones asociadas.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el empleado",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gestión de Empleados
          </CardTitle>
          <Button onClick={handleNewEmployee}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Empleado
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <Input
            placeholder="Buscar empleados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No se encontraron empleados con ese criterio" : "No hay empleados registrados"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Tarifa Diaria</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell className="text-right">${employee.daily_rate.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditEmployee(employee)}>
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Diálogo para editar/crear empleado */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentEmployee.id ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={currentEmployee.name}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, name: e.target.value })}
                  placeholder="Nombre del empleado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={currentEmployee.role}
                  onValueChange={(value) => setCurrentEmployee({ ...currentEmployee, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Limpieza">Limpieza</SelectItem>
                    <SelectItem value="Administración">Administración</SelectItem>
                    <SelectItem value="Recepción">Recepción</SelectItem>
                    <SelectItem value="Seguridad">Seguridad</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="daily_rate">Tarifa Diaria ($)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={currentEmployee.daily_rate}
                  onChange={(e) =>
                    setCurrentEmployee({
                      ...currentEmployee,
                      daily_rate: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEmployee} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
