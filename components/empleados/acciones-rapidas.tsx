"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useEmployeeDB } from "@/lib/employee-db"
import { CheckCircle, XCircle, User, Clock, AlertTriangle } from "lucide-react"
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

// Tipos de estado
type PaymentStatus = "pendiente" | "pagado" | "vencido"

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
  const { updatePaymentStatus } = useEmployeeDB()
  const [loading, setLoading] = useState(false)

  // Determinar estado actual basado en isPaid
  const getCurrentStatus = (): PaymentStatus => {
    if (isPaid) return "pagado"
    // Aquí podrías agregar lógica para determinar si está vencido
    // Por ejemplo, si la semana terminó hace más de X días
    const weekEndDate = new Date(weekEnd)
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - weekEndDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 7) return "vencido" // Vencido si pasaron más de 7 días
    return "pendiente"
  }

  const [currentStatus, setCurrentStatus] = useState<PaymentStatus>(getCurrentStatus())

  // Actualizar estado cuando cambie isPaid
  useEffect(() => {
    setCurrentStatus(getCurrentStatus())
  }, [isPaid, weekEnd])

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    if (loading || daysWorked === 0) return

    setLoading(true)
    console.log("🔄 Cambiando estado de pago:", {
      employee: employee.name,
      from: currentStatus,
      to: newStatus,
      weekStart,
      weekEnd,
    })

    try {
      // Actualizar estado local inmediatamente para feedback visual
      setCurrentStatus(newStatus)

      const success = await updatePaymentStatus(
        employee.id,
        weekStart,
        weekEnd,
        newStatus,
        totalAmount,
        `Estado cambiado a ${newStatus} - ${daysWorked} días trabajados`,
      )

      if (success) {
        console.log("✅ Estado actualizado exitosamente")
        toast({
          title: "✅ Estado actualizado",
          description: `${employee.name}: ${getStatusLabel(newStatus)}`,
        })

        // Recargar datos después de un breve delay
        setTimeout(() => {
          onPaymentChange()
        }, 1000)
      } else {
        // Revertir estado local si falló
        setCurrentStatus(getCurrentStatus())
        console.error("❌ Error: updatePaymentStatus retornó false")
        toast({
          title: "❌ Error al actualizar estado",
          description: "No se pudo cambiar el estado. Verifica la conexión a la base de datos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revertir estado local si hubo error
      setCurrentStatus(getCurrentStatus())
      console.error("❌ Error inesperado:", error)
      toast({
        title: "❌ Error inesperado",
        description: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: PaymentStatus): string => {
    switch (status) {
      case "pendiente":
        return "⏰ Pendiente"
      case "pagado":
        return "✅ Pagado"
      case "vencido":
        return "⚠️ Vencido"
      default:
        return "❓ Desconocido"
    }
  }

  const getStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "pagado":
        return "bg-green-100 text-green-800 border-green-300"
      case "vencido":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case "pendiente":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "pagado":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "vencido":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <XCircle className="h-5 w-5 text-gray-600" />
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

          {/* Estado de pago actual */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              {getStatusIcon(currentStatus)}
              <span className="font-medium">Estado actual</span>
            </div>
            <Badge variant="outline" className={getStatusColor(currentStatus)}>
              {getStatusLabel(currentStatus)}
            </Badge>
          </div>
        </div>

        {/* Selector de estado */}
        <div className="space-y-2 pt-2 border-t">
          <label className="text-sm font-medium">Cambiar estado del pago:</label>
          <Select value={currentStatus} onValueChange={handleStatusChange} disabled={daysWorked === 0 || loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span>⏰ Pendiente</span>
                </div>
              </SelectItem>
              <SelectItem value="pagado">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>✅ Pagado</span>
                </div>
              </SelectItem>
              <SelectItem value="vencido">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>⚠️ Vencido</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {loading && <div className="text-center text-sm text-muted-foreground">Actualizando estado...</div>}
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
