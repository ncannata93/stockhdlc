"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"

// Cliente simple
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

export default function PagoSimple() {
  const { toast } = useToast()
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar empleados con sus pagos pendientes
  const cargarDatos = async () => {
    try {
      console.log("🔄 Cargando empleados...")

      // Obtener empleados básicos
      const { data: employees } = await supabase.from("employees").select("*").order("name")

      if (!employees) return

      // Para cada empleado, calcular si tiene pagos pendientes
      const empleadosConPagos = await Promise.all(
        employees.map(async (emp) => {
          // Obtener asignaciones de las últimas 4 semanas
          const fechaLimite = new Date()
          fechaLimite.setDate(fechaLimite.getDate() - 28)
          const fechaLimiteStr = fechaLimite.toISOString().split("T")[0]

          const { data: asignaciones } = await supabase
            .from("employee_assignments")
            .select("*")
            .eq("employee_id", emp.id)
            .gte("assignment_date", fechaLimiteStr)

          // Calcular total a pagar
          const totalAPagar = (asignaciones || []).reduce((sum, a) => sum + (a.daily_rate_used || 0), 0)

          // Verificar si ya está pagado
          const { data: pagado } = await supabase
            .from("paid_weeks")
            .select("*")
            .eq("employee_id", emp.id)
            .gte("week_start", fechaLimiteStr)

          const totalPagado = (pagado || []).reduce((sum, p) => sum + (p.amount || 0), 0)
          const pendiente = totalAPagar - totalPagado

          return {
            ...emp,
            totalAPagar,
            totalPagado,
            pendiente: pendiente > 0 ? pendiente : 0,
            tienePendiente: pendiente > 0,
          }
        }),
      )

      // Solo mostrar empleados con pagos pendientes
      const conPendientes = empleadosConPagos.filter((emp) => emp.tienePendiente)
      setEmpleados(conPendientes)

      console.log(`✅ Cargados ${conPendientes.length} empleados con pagos pendientes`)
    } catch (error) {
      console.error("❌ Error:", error)
    }
  }

  useEffect(() => {
    setLoading(true)
    cargarDatos().finally(() => setLoading(false))
  }, [])

  // Función SÚPER SIMPLE: marcar como pagado
  const marcarComoPagado = async (empleado: any) => {
    try {
      console.log(`💰 Pagando a ${empleado.name}: $${empleado.pendiente}`)

      // Insertar registro de pago
      const { error } = await supabase.from("paid_weeks").insert({
        employee_id: empleado.id,
        amount: empleado.pendiente,
        paid_date: new Date().toISOString().split("T")[0],
        week_start: new Date().toISOString().split("T")[0], // Fecha actual
        week_end: new Date().toISOString().split("T")[0], // Fecha actual
        notes: `Pago manual - ${empleado.name}`,
      })

      if (error) {
        console.error("❌ Error al pagar:", error)
        toast({
          title: "❌ Error",
          description: "No se pudo procesar el pago",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "✅ Pagado",
        description: `${empleado.name}: $${empleado.pendiente.toLocaleString()} pagados`,
      })

      // Recargar datos
      await cargarDatos()
    } catch (error) {
      console.error("❌ Error inesperado:", error)
      toast({
        title: "❌ Error",
        description: "Error inesperado",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔥 Pagos Pendientes - SÚPER SIMPLE</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : empleados.length === 0 ? (
          <div className="text-center py-8 text-green-600">✅ ¡No hay pagos pendientes!</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead className="text-right">Monto Pendiente</TableHead>
                <TableHead className="text-center">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empleados.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-sm text-muted-foreground">{emp.role}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      ${emp.pendiente.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      onClick={() => marcarComoPagado(emp)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      ✅ PAGAR ${emp.pendiente.toLocaleString()}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4">
          <Button onClick={cargarDatos} variant="outline" className="w-full" disabled={loading}>
            🔄 Actualizar Lista
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
