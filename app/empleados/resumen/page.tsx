import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo actualizados con los empleados y hoteles proporcionados
const resumenEmpleados = [
  {
    id: 1,
    nombre: "Diego",
    diasTrabajados: 8,
    hoteles: ["Jaguel", "Falkner", "Puntarenas", "Barlovento"],
    montoPorSemana: 35000,
    estado: "Pagado",
  },
  {
    id: 2,
    nombre: "Tucu",
    diasTrabajados: 6,
    hoteles: ["Monaco", "Stromboli", "Tupe", "Carama"],
    montoPorSemana: 30000,
    estado: "Pendiente",
  },
  {
    id: 3,
    nombre: "David",
    diasTrabajados: 5,
    hoteles: ["Mallak", "San Miguel", "Munich", "Jaguel"],
    montoPorSemana: 25000,
    estado: "Pagado",
  },
  {
    id: 4,
    nombre: "Freire",
    diasTrabajados: 4,
    hoteles: ["Argentina", "Colores", "Tiburones"],
    montoPorSemana: 20000,
    estado: "Pendiente",
  },
]

// Datos de ejemplo para el detalle de pagos
const detallePagos = [
  { id: 1, empleado: "Diego", fecha: "2025-05-10", monto: 35000, estado: "Pagado" },
  { id: 2, empleado: "David", fecha: "2025-05-09", monto: 25000, estado: "Pagado" },
  { id: 3, empleado: "Tucu", fecha: "2025-05-07", monto: 30000, estado: "Pendiente" },
  { id: 4, empleado: "Freire", fecha: "2025-05-06", monto: 20000, estado: "Pendiente" },
]

export default function ResumenPage() {
  return (
    <div className="min-h-screen bg-[#f0f8ff] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Verificar que el botón "Volver" tenga el enlace correcto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resumen de Empleados</h1>
            <p className="text-gray-500">Consulte resúmenes de pagos y asignaciones</p>
          </div>
          <Link href="/empleados">
            <Button variant="outline">← Volver</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">4</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">2</p>
              <p className="text-sm text-gray-500">$50,000 en total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagos Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">2</p>
              <p className="text-sm text-gray-500">$60,000 en total</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="resumen">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resumen">Resumen por Empleado</TabsTrigger>
            <TabsTrigger value="pagos">Detalle de Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Resumen por Empleado</CardTitle>
                <div className="flex space-x-2">
                  <Input placeholder="Buscar empleado..." className="w-64" />
                  <Button variant="outline">Exportar</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Días Trabajados</TableHead>
                      <TableHead>Hoteles</TableHead>
                      <TableHead>Monto Semanal</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumenEmpleados.map((empleado) => (
                      <TableRow key={empleado.id}>
                        <TableCell>{empleado.id}</TableCell>
                        <TableCell>{empleado.nombre}</TableCell>
                        <TableCell>{empleado.diasTrabajados}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {empleado.hoteles.map((hotel, idx) => (
                              <Badge key={idx} variant="outline">
                                {hotel}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>${empleado.montoPorSemana.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              empleado.estado === "Pagado"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }
                            variant="outline"
                          >
                            {empleado.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Ver Detalle
                            </Button>
                            {empleado.estado === "Pendiente" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-100 text-green-800 hover:bg-green-200"
                              >
                                Marcar Pagado
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Detalle de Pagos</CardTitle>
                <div className="flex space-x-2">
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">Exportar</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detallePagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>{pago.id}</TableCell>
                        <TableCell>{pago.empleado}</TableCell>
                        <TableCell>{pago.fecha}</TableCell>
                        <TableCell>${pago.monto.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              pago.estado === "Pagado" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                            }
                            variant="outline"
                          >
                            {pago.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Ver Detalle
                            </Button>
                            {pago.estado === "Pendiente" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-100 text-green-800 hover:bg-green-200"
                              >
                                Marcar Pagado
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-sm text-gray-500 mt-8">
          © 2025 Hoteles de la Costa. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
}
