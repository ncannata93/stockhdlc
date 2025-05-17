"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, Trash2, Edit } from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import type { EmployeeAssignment } from "@/lib/employee-types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

export default function EmpleadosHistorial() {
  const { getAssignments, getEmployees, deleteAssignment, saveAssignment } = useEmployeeDB()
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [employeeFilter, setEmployeeFilter] = useState<string>("todos")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [editingAssignment, setEditingAssignment] = useState<EmployeeAssignment | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const employeesData = await getEmployees()
        setEmployees(employeesData.map((e) => ({ id: e.id, name: e.name })))

        const assignmentsData = await getAssignments()
        setAssignments(assignmentsData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [getAssignments, getEmployees])

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta asignación?")) {
      setLoading(true)
      try {
        const success = await deleteAssignment(id)
        if (success) {
          setAssignments(assignments.filter((a) => a.id !== id))
          toast({
            title: "Asignación eliminada",
            description: "La asignación ha sido eliminada correctamente",
          })
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
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAssignment) return

    setLoading(true)
    try {
      const updated = await saveAssignment(editingAssignment)
      if (updated) {
        setAssignments(assignments.map((a) => (a.id === updated.id ? updated : a)))
        setEditingAssignment(null)
        toast({
          title: "Asignación actualizada",
          description: "La asignación ha sido actualizada correctamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar la asignación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al actualizar asignación:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar la asignación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    // Filtro por empleado
    if (employeeFilter !== "todos" && assignment.employee_id !== Number.parseInt(employeeFilter)) {
      return false
    }

    // Filtro por fecha
    if (dateFilter && assignment.assignment_date !== dateFilter) {
      return false
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        assignment.employee_name?.toLowerCase().includes(searchLower) ||
        assignment.hotel_name.toLowerCase().includes(searchLower) ||
        assignment.notes?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Asignaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por empleado, hotel o notas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-1/4">
            <Label htmlFor="employee-filter">Filtrar por Empleado</Label>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger id="employee-filter">
                <SelectValue placeholder="Todos los empleados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los empleados</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/4">
            <Label htmlFor="date-filter">Filtrar por Fecha</Label>
            <Input id="date-filter" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron asignaciones con los filtros seleccionados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Creado por</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{format(new Date(assignment.assignment_date), "dd/MM/yyyy", { locale: es })}</TableCell>
                    <TableCell>{assignment.employee_name}</TableCell>
                    <TableCell>{assignment.hotel_name}</TableCell>
                    <TableCell>{assignment.notes || "-"}</TableCell>
                    <TableCell>{assignment.created_by || "Sistema"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setEditingAssignment(assignment)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Asignación</DialogTitle>
                            </DialogHeader>
                            {editingAssignment && (
                              <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-date">Fecha</Label>
                                    <Input
                                      id="edit-date"
                                      type="date"
                                      value={editingAssignment.assignment_date}
                                      onChange={(e) =>
                                        setEditingAssignment({
                                          ...editingAssignment,
                                          assignment_date: e.target.value,
                                        })
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-hotel">Hotel</Label>
                                    <Select
                                      value={editingAssignment.hotel_name}
                                      onValueChange={(value) =>
                                        setEditingAssignment({
                                          ...editingAssignment,
                                          hotel_name: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger id="edit-hotel">
                                        <SelectValue placeholder="Seleccionar hotel" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[
                                          "Jaguel",
                                          "Monaco",
                                          "Mallak",
                                          "Argentina",
                                          "Falkner",
                                          "Stromboli",
                                          "San Miguel",
                                          "Colores",
                                          "Puntarenas",
                                          "Tupe",
                                          "Munich",
                                          "Tiburones",
                                          "Barlovento",
                                          "Carama",
                                        ].map((hotel) => (
                                          <SelectItem key={hotel} value={hotel}>
                                            {hotel}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-notes">Notas</Label>
                                  <Textarea
                                    id="edit-notes"
                                    placeholder="Notas adicionales..."
                                    value={editingAssignment.notes || ""}
                                    onChange={(e) =>
                                      setEditingAssignment({
                                        ...editingAssignment,
                                        notes: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                      Cancelar
                                    </Button>
                                  </DialogClose>
                                  <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar
                                  </Button>
                                </div>
                              </form>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(assignment.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
