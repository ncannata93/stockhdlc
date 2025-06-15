"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"
import { CheckCircle, XCircle, User, Clock, CreditCard } from "lucide-react"
import type { Employee } from "@/lib/employee-types"

interface AccionesRapidasProps {
  employee: Employee
  totalAmount: number
  daysWorked: number
  weekStart: string
  weekEnd: string
  isPaid: boolean
  onPaymentChange: () => void
}

export default function AccionesRapidas({
  employee,
  totalAmount,
  daysWorked,
  weekStart,
  weekEnd,
  isPaid,
  onPaymentChange,
}: AccionesRapidasProps) {
  const { toast } = useToast()
  const { markWeekAsPaid, markWeekAsUnpaid } = useEmployeeDB()
  const [loading, setLoading] = useState(false)
  const [paymentNotes, setPaymentNotes] = useState("")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  const handleMarkAsPaid = async () => {
    setLoading(true)
    try {
      await markWeekAsPaid({
        employee_id: employee.id,
        week_start: weekStart,
        week_end: weekEnd,
        amount_paid: totalAmount,
        payment_notes: paymentNotes || `Pago semanal - ${daysWorked} días trabajados`,
      })

      toast({
        title: "✅ Semana marcada como pagada",
        description: `Se registró el pago de $${totalAmount.toLocaleString()} para ${employee.name}`,
      })

      setShowPaymentDialog(false)
      setPaymentNotes("")
      onPaymentChange()
    } catch (error) {
      toast({
        title: "❌ Error al marcar como pagada",
        description: "No se pudo registrar el pago. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsUnpaid = async () => {
    setLoading(true)
    try {
      await markWeekAsUnpaid({
        employee_id: employee.id,
        week_start: weekStart,
        week_end: weekEnd,
      })

      toast({
        title: "⏰ Semana marcada como pendiente",
        description: `Se removió el registro de pago para ${employee.name}`,
      })

      onPaymentChange()
    } catch (error) {
      toast({
        title: "❌ Error al marcar como pendiente",
        description: "No se pudo actualizar el estado. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + "T00:00:00")
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-blue-600" />
          {employee.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del empleado - Layout móvil optimizado */}
        <div className="grid grid-cols-1 gap-3">
          {/* Información básica */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">👤 Empleado</span>
              <span className="font-medium">{employee.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">🏷️ Rol</span>
              <span className="font-medium">{employee.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">💰 Tarifa diaria</span>
              <span className="font-medium">${employee.daily_rate.toLocaleString()}</span>
            </div>
          </div>

          {/* Resumen de la semana */}
          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">📅 Período</span>
              <span className="font-medium text-sm">
                {formatDate(weekStart)} - {formatDate(weekEnd)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">⏰ Días trabajados</span>
              <span className="font-bold text-blue-600">{daysWorked}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">💵 Total a pagar</span>
              <span className="font-bold text-green-600 text-lg">${totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Estado de pago */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              {isPaid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-medium">Estado del pago</span>
            </div>
            <Badge
              variant={isPaid ? "default" : "outline"}
              className={`${
                isPaid
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
              }`}
            >
              {isPaid ? "✅ Pagada" : "⏰ Pendiente"}
            </Badge>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-2 pt-2 border-t">
          {!isPaid ? (
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Marcar como Pagada
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Confirmar Pago
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Empleado:</span>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Período:</span>
                      <span className="font-medium text-sm">
                        {formatDate(weekStart)} - {formatDate(weekEnd)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Días:</span>
                      <span className="font-medium">{daysWorked}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-green-600 text-lg">${totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-notes">Notas del pago (opcional)</Label>
                    <Textarea
                      id="payment-notes"
                      placeholder="Ej: Pago en efectivo, transferencia bancaria, etc."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleMarkAsPaid}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Procesando..." : "Confirmar Pago"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant="outline"
              onClick={handleMarkAsUnpaid}
              disabled={loading}
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              size="lg"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {loading ? "Procesando..." : "Marcar como Pendiente"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
