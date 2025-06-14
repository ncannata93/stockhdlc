"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { DollarSign, CheckCircle, Trash2, Loader2, AlertTriangle, Calendar, User } from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeePayment } from "@/lib/employee-types"
import { formatDateForDisplay } from "@/lib/date-utils"

interface AccionesRapidasProps {
  employee: Employee
  totalAmount: number
  daysWorked: number
  payment?: EmployeePayment
  weekStart: string
  weekEnd: string
  onPaymentChange: () => void
}

export default function AccionesRapidas({
  employee,
  totalAmount,
  daysWorked,
  payment,
  weekStart,
  weekEnd,
  onPaymentChange,
}: AccionesRapidasProps) {
  const [loading, setLoading] = useState(false)

  // Get the hook functions directly
  const employeeDB = useEmployeeDB()
  const { savePayment, deletePayment } = employeeDB || {}

  const handleCreatePayment = async () => {
    console.log("🚀 handleCreatePayment iniciado")

    // Safety validations
    if (!employeeDB) {
      console.error("❌ employeeDB hook no disponible")
      toast({
        title: "❌ Error",
        description: "Sistema de base de datos no inicializado",
        variant: "destructive",
      })
      return
    }

    if (!savePayment) {
      console.error("❌ savePayment no está disponible")
      toast({
        title: "❌ Error",
        description: "Función savePayment no disponible",
        variant: "destructive",
      })
      return
    }

    if (!employee?.id) {
      console.error("❌ employee o employee.id no disponible")
      toast({
        title: "❌ Error",
        description: "Información del empleado no disponible",
        variant: "destructive",
      })
      return
    }

    if (loading || daysWorked === 0) {
      console.log("❌ Bloqueado por loading o días trabajados")
      return
    }

    console.log("✅ Todas las validaciones pasaron")
    setLoading(true)

    try {
      const paymentData = {
        employee_id: employee.id,
        amount: totalAmount,
        payment_date: new Date().toISOString().split("T")[0],
        week_start: weekStart,
        week_end: weekEnd,
        status: "pendiente" as const,
      }

      console.log("📤 Datos del pago:", paymentData)

      const result = await savePayment(paymentData)
      console.log("📥 Resultado:", result)

      if (result) {
        console.log("✅ Pago creado exitosamente")
        toast({
          title: "✅ Pago registrado",
          description: `Pago de $${totalAmount.toLocaleString()} registrado para ${employee.name}`,
        })

        if (onPaymentChange) {
          onPaymentChange()
          console.log("✅ onPaymentChange ejecutado")
        }
      } else {
        console.error("❌ savePayment retornó null/undefined")
        toast({
          title: "❌ Error",
          description: "No se pudo registrar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error completo:", error)
      toast({
        title: "❌ Error",
        description: `Error: ${error instanceof Error ? error.message : "Desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (loading || !payment || !savePayment) return

    setLoading(true)
    try {
      const result = await savePayment({
        ...payment,
        status: "pagado",
      })

      if (result) {
        toast({
          title: "✅ Pago actualizado",
          description: `Pago de $${payment.amount.toLocaleString()} marcado como pagado`,
        })
        onPaymentChange?.()
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo actualizar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error al actualizar pago:", error)
      toast({
        title: "❌ Error",
        description: "Error inesperado al actualizar el pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async () => {
    if (loading || !payment || !deletePayment) return

    if (!confirm(`¿Eliminar el pago de $${payment.amount.toLocaleString()} para ${employee.name}?`)) {
      return
    }

    setLoading(true)
    try {
      const success = await deletePayment(payment.id)

      if (success) {
        toast({
          title: "🗑️ Pago eliminado",
          description: `Pago eliminado correctamente`,
        })
        onPaymentChange?.()
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo eliminar el pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error al eliminar pago:", error)
      toast({
        title: "❌ Error",
        description: "Error inesperado al eliminar el pago",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Acciones Rápidas - {employee?.name || "Sin nombre"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del empleado */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium">Días trabajados: {daysWorked}</div>
              <div className="text-sm text-muted-foreground">
                {formatDateForDisplay(weekStart)} - {formatDateForDisplay(weekEnd)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">${totalAmount.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total a pagar</div>
          </div>
        </div>

        {/* Estado del pago */}
        <div className="flex items-center justify-center p-3">
          {payment ? (
            <Badge
              variant={payment.status === "pagado" ? "default" : "outline"}
              className={`px-4 py-2 text-base ${
                payment.status === "pagado"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
              }`}
            >
              {payment.status === "pagado" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />✅ Semana Pagada
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />⏰ Pago Pendiente
                </>
              )}
            </Badge>
          ) : (
            <Badge variant="outline" className="px-4 py-2 text-base bg-gray-100 text-gray-800">
              📝 Sin pago registrado
            </Badge>
          )}
        </div>

        {/* Debug info */}
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          Estado: Hook={!!employeeDB ? "✅" : "❌"}, SavePayment={!!savePayment ? "✅" : "❌"}, Employee=
          {!!employee ? "✅" : "❌"}, EmployeeID={employee?.id || "❌"}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3">
          {!payment ? (
            <Button
              onClick={handleCreatePayment}
              disabled={loading || daysWorked === 0 || !savePayment}
              className="w-full bg-green-600 hover:bg-green-700 h-12"
              size="lg"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <DollarSign className="mr-2 h-5 w-5" />}
              {loading ? "Registrando..." : "💰 Registrar Pago"}
            </Button>
          ) : payment.status === "pendiente" ? (
            <div className="space-y-3">
              <Button
                onClick={handleMarkAsPaid}
                disabled={loading || !savePayment}
                className="w-full bg-green-600 hover:bg-green-700 h-12"
                size="lg"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                {loading ? "Actualizando..." : "✅ Marcar como Pagado"}
              </Button>
              <Button
                variant="outline"
                onClick={handleDeletePayment}
                disabled={loading || !deletePayment}
                className="w-full h-12 border-red-300 text-red-700 hover:bg-red-50"
                size="lg"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trash2 className="mr-2 h-5 w-5" />}
                {loading ? "Eliminando..." : "🗑️ Eliminar Pago"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="font-medium text-green-800">✅ Semana Pagada</div>
                <div className="text-sm text-green-600">Pago de ${payment.amount.toLocaleString()} completado</div>
              </div>
              <Button
                variant="outline"
                onClick={handleDeletePayment}
                disabled={loading || !deletePayment}
                className="w-full h-12 border-red-300 text-red-700 hover:bg-red-50"
                size="lg"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trash2 className="mr-2 h-5 w-5" />}
                {loading ? "Eliminando..." : "🗑️ Eliminar Pago"}
              </Button>
            </div>
          )}
        </div>

        {/* Advertencias */}
        {daysWorked === 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">No se puede crear un pago sin días trabajados</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
