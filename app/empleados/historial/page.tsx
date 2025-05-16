import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Datos de ejemplo actualizados con los empleados y hoteles proporcionados
const historialRegistros = [
  { id: 1, fecha: "2025-05-10", empleado: "Diego", hotel: "Jaguel", accion: "Registro de trabajo" },
  { id: 2, fecha: "2025-05-09", empleado: "Tucu", hotel: "Monaco", accion: "Registro de trabajo" },
  { id: 3, fecha: "2025-05-09", empleado: "David", hotel: "Mallak", accion: "Registro de trabajo" },
  { id: 4, fecha: "2025-05-08", empleado: "Freire", hotel: "Argentina", accion: "Registro de trabajo" },
  { id: 5, fecha: "2025-05-08", empleado: "Diego", hotel: "Falkner", accion: "Registro de trabajo" },
  { id: 6, fecha: "2025-05-07", empleado: "Tucu", hotel: "Stromboli", accion: "Registro de trabajo" },
  { id: 7, fecha: "2025-05-07", empleado: "David", hotel: "San Miguel", accion: "Registro de trabajo" },
  { id: 8, fecha: "2025-05-06", empleado: "Freire", hotel: "Colores", accion: "Registro de trabajo" },
  { id: 9, fecha: "2025-05-06", empleado: "Diego", hotel: "Puntarenas", accion: "Registro de trabajo" },
  { id: 10, fecha: "2025-05-05", empleado: "Tucu", hotel: "Tupe", accion: "Registro de trabajo" },
]

export default function HistorialPage() {
  return (
    <div className="min-h-screen bg-[#f0f8ff] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Registros</h1>
            <p className="text-gray-500">Consulte el historial de registros de empleados</p>
          </div>
          <Link href="/empleados">
            <Button variant="outline">← Volver</Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha desde</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha hasta</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Empleado</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los empleados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los empleados</SelectItem>
                    <SelectItem value="diego">Diego</SelectItem>
                    <SelectItem value="tucu">Tucu</SelectItem>
                    <SelectItem value="david">David</SelectItem>
                    <SelectItem value="freire">Freire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Hotel</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los hoteles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los hoteles</SelectItem>
                    <SelectItem value="jaguel">Jaguel</SelectItem>
                    <SelectItem value="monaco">Monaco</SelectItem>
                    <SelectItem value="mallak">Mallak</SelectItem>
                    <SelectItem value="argentina">Argentina</SelectItem>
                    <SelectItem value="falkner">Falkner</SelectItem>
                    <SelectItem value="stromboli">Stromboli</SelectItem>
                    <SelectItem value="sanmiguel">San Miguel</SelectItem>
                    <SelectItem value="colores">Colores</SelectItem>
                    <SelectItem value="puntarenas">Puntarenas</SelectItem>
                    <SelectItem value="tupe">Tupe</SelectItem>
                    <SelectItem value="munich">Munich</SelectItem>
                    <SelectItem value="tiburones">Tiburones</SelectItem>
                    <SelectItem value="barlovento">Barlovento</SelectItem>
                    <SelectItem value="carama">Carama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700">Aplicar Filtros</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Historial de Registros</CardTitle>
            <div className="flex space-x-2">
              <Input placeholder="Buscar..." className="w-64" />
              <Button variant="outline">Exportar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Opciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialRegistros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>{registro.id}</TableCell>
                    <TableCell>{registro.fecha}</TableCell>
                    <TableCell>{registro.empleado}</TableCell>
                    <TableCell>{registro.hotel}</TableCell>
                    <TableCell>{registro.accion}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="sm">
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Siguiente
              </Button>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center text-sm text-gray-500 mt-8">
          © 2025 Hoteles de la Costa. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
}
