"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee, EmployeePayment } from "@/lib/employee-types"

interface AccionesRapidasProps {
  employee: Employee
  totalAmount: number
  daysWorked: number
  payment?: EmployeePayment
  weekStart: string
  weekEnd: string
  onPaymentChange?: () => void
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
  const { savePayment, deletePayment } = useEmployeeDB()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const handleRegisterPayment = async () => {
    try {
      setIsSubmitting(true)
      console.log("🔄 Iniciando registro de pago para:", employee.name)

      // Verificar que todos los campos requeridos estén presentes
      if (!employee.id || totalAmount === undefined || totalAmount === null) {
        console.error("❌ Datos incompletos para registrar pago")
        toast({
          title: "Error en datos",
          description: "Faltan datos necesarios para registrar el pago.",
          variant: "destructive",
        })
        return
      }

      // Si ya existe un pago, actualizarlo
      if (payment?.id) {
        console.log("📝 Actualizando pago existente ID:", payment.id)

        const result = await savePayment({
          id: payment.id,
          employee_id: employee.id,
          amount: totalAmount,
          payment_date: new Date().toISOString().split("T")[0],
          week_start: weekStart,
          week_end: weekEnd,
          status: "pendiente",
          notes: `Pago por ${daysWorked} días trabajados`,
        })

        if (!result) {
          throw new Error("La operación de actualización no devolvió resultados")
        }

        console.log("✅ Pago actualizado exitosamente:", result)
      } else {
        // Crear un nuevo pago
        console.log("📝 Creando nuevo pago para empleado ID:", employee.id)

        const result = await savePayment({
          employee_id: employee.id,
          amount: totalAmount,
          payment_date: new Date().toISOString().split("T")[0],
          week_start: weekStart,
          week_end: weekEnd,
          status: "pendiente",
          notes: `Pago por ${daysWorked} días trabajados`,
        })

        if (!result) {
          throw new Error("La operación de creación no devolvió resultados")
        }

        console.log("✅ Pago creado exitosamente:", result)
      }

      toast({
        title: "Pago Registrado",
        description: `Se ha registrado el pago de $${totalAmount.toLocaleString()} para ${employee.name}.`,
      })

      // Notificar al componente padre para que actualice los datos
      if (onPaymentChange) {
        onPaymentChange()
      }
    } catch (error) {
      console.error("❌ Error al registrar pago:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el pago. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!payment?.id) return

    try {
      setIsMarkingPaid(true)
      console.log("🔄 Marcando pago como pagado, ID:", payment.id)

      const result = await savePayment({
        ...payment,
        status: "pagado",
      })

      if (!result) {
        throw new Error("La operación no devolvió resultados")
      }

      console.log("✅ Pago marcado como pagado:", result)

      toast({
        title: "Pago Completado",
        description: `Se ha marcado como pagado el monto de $${totalAmount.toLocaleString()} para ${employee.name}.`,
      })

      if (onPaymentChange) {
        onPaymentChange()
      }
    } catch (error) {
      console.error("❌ Error al marcar como pagado:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar el pago como pagado. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingPaid(false)
    }
  }

  const handleDeletePayment = async () => {
    if (!payment?.id) return

    try {
      setIsDeleting(true)
      console.log("🗑️ Eliminando pago, ID:", payment.id)

      const success = await deletePayment(payment.id)

      if (!success) {
        throw new Error("No se pudo eliminar el pago")
      }

      console.log("✅ Pago eliminado correctamente")

      toast({
        title: "Pago Eliminado",
        description: `Se ha eliminado el registro de pago para ${employee.name}.`,
      })

      if (onPaymentChange) {
        onPaymentChange()
      }
    } catch (error) {
      console.error("❌ Error al eliminar pago:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el pago. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1">
            {!payment && (
              <Button
                onClick={handleRegisterPayment}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting || daysWorked === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Registrar Pago (${totalAmount.toLocaleString()})
                  </>
                )}
              </Button>
            )}

            {payment && payment.status === "pendiente" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Pago pendiente de ${payment.amount.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleMarkAsPaid}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isMarkingPaid}
                  >
                    {isMarkingPaid ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Marcar Pagado
                  </Button>

                  <Button
                    onClick={handleDeletePayment}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "🗑️ Eliminar"}
                  </Button>
                </div>
              </div>
            )}

            {payment && payment.status === "pagado" && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">Pago completado de ${payment.amount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
