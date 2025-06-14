"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { DollarSign, CheckCircle, Undo2, Loader2, Calendar, User } from "lucide-react"
import { useEmployeeDB } from "@/lib/employee-db"
import type { Employee } from "@/lib/employee-types"
import { formatDateForDisplay } from "@/lib/date-utils"

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
  const [loading, setLoading] = useState(false)
  const { markWeekAsPaid, unmarkWeekAsPaid } = useEmployeeDB()

  const handleMarkAsPaid = async () => {
    if (loading || daysWorked === 0) return

    setLoading(true)
    try {
      const success = await markWeekAsPaid(
        employee.id,
        weekStart,
        weekEnd,
        totalAmount,
        `Semana pagada el ${new Date().toISOString().split("T")[0]}`,
      )

      if (success) {
        toast({
          title: "✅ Semana marcada como pagada",
          description: `$${totalAmount.toLocaleString()} para ${employee.name}`,
        })
        onPaymentChange()
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo marcar la semana como pagada",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnmarkAsPaid = async () => {
    if (loading) return

    if (!confirm(`¿Desmarcar la semana como pagada para ${employee.name}?`)) {
      return
    }

    setLoading(true)
    try {
      const success = await unmarkWeekAsPaid(employee.id, weekStart, weekEnd)

      if (success) {
        toast({
          title: "🔄 Semana desmarcada",
          description: `Semana desmarcada para ${employee.name}`,
        })
        onPaymentChange()
      } else {
        toast({
          title: "❌ Error",
          description: "No se pudo desmarcar la semana",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error inesperado",
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
          {employee.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información de la semana */}
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
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Estado del pago */}
        <div className="flex items-center justify-center p-3">
          <Badge
            variant={isPaid ? "default" : "outline"}
            className={`px-4 py-2 text-base ${
              isPaid
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-yellow-100 text-yellow-800 border-yellow-300"
            }`}
          >
            {isPaid ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />✅ Semana Pagada
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />💰 Pendiente de Pago
              </>
            )}
          </Badge>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3">
          {!isPaid ? (
            <Button
              onClick={handleMarkAsPaid}
              disabled={loading || daysWorked === 0}
              className="w-full bg-green-600 hover:bg-green-700 h-12"
              size="lg"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <DollarSign className="mr-2 h-5 w-5" />}
              {loading ? "Marcando..." : "💰 Marcar como Pagada"}
            </Button>
          ) : (
            <Button
              onClick={handleUnmarkAsPaid}
              disabled={loading}
              variant="outline"
              className="w-full h-12 border-orange-300 text-orange-700 hover:bg-orange-50"
              size="lg"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Undo2 className="mr-2 h-5 w-5" />}
              {loading ? "Desmarcando..." : "🔄 Desmarcar Pago"}
            </Button>
          )}
        </div>

        {daysWorked === 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <span className="text-sm text-yellow-800">No hay días trabajados en esta semana</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
