"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"
import { CheckCircle, XCircle, User, Clock, CreditCard, Loader2 } from "lucide-react"
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
  const { markWeekAsPaid, unmarkWeekAsPaid } = useEmployeeDB()
  const [loading, setLoading] = useState(false)
  const [paymentNotes, setPaymentNotes] = useState("")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  // Estado local para controlar la UI mientras se procesa
  const [localIsPaid, setLocalIsPaid] = useState(isPaid)
  // Flag para evitar recargas automáticas durante operaciones
  const [operationInProgress, setOperationInProgress] = useState(false)

  // Sincronizar el estado local con el prop cuando cambie (solo si no hay operación en progreso)
  useEffect(() => {
    if (!operationInProgress) {
      setLocalIsPaid(isPaid)
    }
  }, [isPaid, operationInProgress])

  useEffect(() => {
    console.log("🔍 AccionesRapidas montado:", {
      employee: employee.name,
      isPaid,
      localIsPaid,
      operationInProgress,
      daysWorked,
      totalAmount,
      weekStart,
      weekEnd,
    })
  }, [employee.name, isPaid, localIsPaid, operationInProgress, daysWorked, totalAmount, weekStart, weekEnd])

  const handleMarkAsPaid = async () => {
    if (loading || daysWorked === 0 || operationInProgress) return

    setLoading(true)
    setOperationInProgress(true)
    console.log("🔄 Iniciando proceso de pago:", {
      employee: employee.name,
      employeeId: employee.id,
      weekStart,
      weekEnd,
      totalAmount,
      notes: paymentNotes,
    })

    try {
      // Actualizar estado local inmediatamente para feedback visual
      setLocalIsPaid(true)

      const success = await markWeekAsPaid(
        employee.id,
        weekStart,
        weekEnd,
        totalAmount,
        paymentNotes || `Pago semanal - ${daysWorked} días trabajados`,
      )

      if (success) {
        console.log("✅ Pago registrado exitosamente")
        toast({
          title: "✅ Semana marcada como pagada",
          description: `Se registró el pago de $${totalAmount.toLocaleString()} para ${employee.name}`,
        })

        setShowPaymentDialog(false)
        setPaymentNotes("")

        // Esperar más tiempo antes de recargar y permitir actualizaciones
        setTimeout(() => {
          console.log("🔄 Recargando datos después del pago...")
          setOperationInProgress(false)
          onPaymentChange()
        }, 2000)
      } else {
        // Revertir estado local si falló
        setLocalIsPaid(false)
        setOperationInProgress(false)
        console.error("❌ Error: markWeekAsPaid retornó false")
        toast({
          title: "❌ Error al registrar el pago",
          description: "No se pudo marcar la semana como pagada. Verifica la conexión a la base de datos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revertir estado local si hubo error
      setLocalIsPaid(false)
      setOperationInProgress(false)
      console.error("❌ Error inesperado al marcar como pagada:", error)
      toast({
        title: "❌ Error inesperado",
        description: `Error al registrar el pago: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsUnpaid = async () => {
    if (loading || operationInProgress) return

    if (!confirm(`¿Estás seguro de que deseas desmarcar la semana como pagada para ${employee.name}?`)) {
      return
    }

    setLoading(true)
    setOperationInProgress(true)
    console.log("🔄 INICIO - Desmarcando semana como pagada:", {
      employee: employee.name,
      employeeId: employee.id,
      weekStart,
      weekEnd,
      isPaidAntes: isPaid,
      localIsPaidAntes: localIsPaid,
    })

    try {
      // Actualizar estado local inmediatamente para feedback visual
      console.log("🎨 Actualizando estado local a false...")
      setLocalIsPaid(false)

      console.log("🔄 Llamando a unmarkWeekAsPaid...")
      const success = await unmarkWeekAsPaid(employee.id, weekStart, weekEnd)
      console.log("📤 Resultado de unmarkWeekAsPaid:", success)

      if (success) {
        console.log("✅ Semana desmarcada exitosamente")
        toast({
          title: "🔄 Semana desmarcada",
          description: `Se removió el registro de pago para ${employee.name}`,
        })

        // Esperar más tiempo antes de recargar y permitir actualizaciones
        console.log("⏳ Esperando 3 segundos antes de recargar...")
        setTimeout(() => {
          console.log("🔄 Iniciando recarga de datos...")
          setOperationInProgress(false)
          onPaymentChange()
        }, 3000)
      } else {
        // Revertir estado local si falló
        console.log("❌ Revirtiendo estado local a true...")
        setLocalIsPaid(true)
        setOperationInProgress(false)
        console.error("❌ Error: unmarkWeekAsPaid retornó false")
        toast({
          title: "❌ Error al desmarcar",
          description: "No se pudo desmarcar la semana. Verifica la conexión a la base de datos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revertir estado local si hubo error
      console.log("❌ Revirtiendo estado local por error...")
      setLocalIsPaid(true)
      setOperationInProgress(false)
      console.error("❌ Error inesperado al desmarcar:", error)
      toast({
        title: "❌ Error inesperado",
        description: `Error al desmarcar: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      console.log("🏁 Finalizando handleMarkAsUnpaid, loading = false")
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

  const handleButtonClick = () => {
    console.log("🔘 Botón de pago clickeado:", {
      employee: employee.name,
      isPaid,
      localIsPaid,
      operationInProgress,
      daysWorked,
      totalAmount,
      loading,
    })

    if (daysWorked === 0) {
      console.log("⚠️ No se puede procesar: días trabajados = 0")
      return
    }

    if (loading || operationInProgress) {
      console.log("⚠️ No se puede procesar: ya está cargando o hay operación en progreso")
      return
    }

    console.log("✅ Abriendo diálogo de pago...")
    setShowPaymentDialog(true)
  }

  // Usar el estado local durante operaciones, sino usar el prop
  const displayIsPaid = operationInProgress ? localIsPaid : isPaid

  console.log("🔍 AccionesRapidas - Estado actual:", {
    employee: employee.name,
    isPaid,
    localIsPaid,
    displayIsPaid,
    operationInProgress,
    loading,
    weekStart,
    weekEnd,
    totalAmount,
    daysWorked,
  })

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-blue-600" />
          {employee.name}
          {operationInProgress && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              Procesando...
            </Badge>
          )}
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
              {displayIsPaid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-medium">Estado del pago</span>
            </div>
            <Badge
              variant={displayIsPaid ? "default" : "outline"}
              className={`${
                displayIsPaid
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
              }`}
            >
              {displayIsPaid ? "✅ Pagada" : "⏰ Pendiente"}
            </Badge>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-2 pt-2 border-t">
          {!displayIsPaid ? (
            <>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={daysWorked === 0 || loading || operationInProgress}
                onClick={handleButtonClick}
              >
                {loading || operationInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Marcar como Pagada
                  </>
                )}
              </Button>

              <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
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
                      <Button
                        variant="outline"
                        onClick={() => setShowPaymentDialog(false)}
                        className="flex-1"
                        disabled={loading || operationInProgress}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleMarkAsPaid}
                        disabled={loading || operationInProgress}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {loading || operationInProgress ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          "Confirmar Pago"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={handleMarkAsUnpaid}
              disabled={loading || operationInProgress}
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              size="lg"
            >
              {loading || operationInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {operationInProgress ? "Desmarcando..." : "Procesando..."}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Marcar como Pendiente
                </>
              )}
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
