"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Users, CalendarDays, Edit } from "lucide-react"
import { deleteBooking } from "./actions"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"

type Booking = {
  id: string
  apartment: string
  pax: number
  check_in: string
  check_out: string
  notes?: string
  created_at: string
}

export function BookingsList({
  bookings,
  onUpdate,
  onEdit,
}: {
  bookings: { active: Booking[]; past: Booking[] }
  onUpdate: () => void
  onEdit: (booking: Booking) => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta estadía? Se eliminará también su planilla de limpieza.")) {
      return
    }

    setDeletingId(id)
    try {
      await deleteBooking(id)
      toast({
        title: "Estadía eliminada",
        description: "La estadía y su planilla han sido eliminadas",
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la estadía",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const renderBooking = (booking: Booking, isActive: boolean) => (
    <div
      key={booking.id}
      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
        isActive ? "hover:bg-muted/50" : "opacity-60 bg-muted/30"
      }`}
    >
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-3">
          <Badge variant={isActive ? "secondary" : "outline"} className="text-base font-semibold">
            {booking.apartment}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {booking.pax} pax
          </div>
          {!isActive && (
            <Badge variant="outline" className="text-xs">
              Finalizada
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>
            {new Date(booking.check_in + "T12:00:00").toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })}
          </span>
          <span className="text-muted-foreground">→</span>
          <span>
            {new Date(booking.check_out + "T12:00:00").toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })}
          </span>
        </div>
        {booking.notes && <p className="text-sm text-muted-foreground italic">{booking.notes}</p>}
      </div>
      {isActive && (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(booking)}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(booking.id)}
            disabled={deletingId === booking.id}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Estadías Activas */}
      <Card>
        <CardHeader>
          <CardTitle>Estadías Activas ({bookings.active.length})</CardTitle>
          <CardDescription>Estadías en curso - ordenadas por apartamento</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.active.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay estadías activas</p>
          ) : (
            <div className="space-y-3">{bookings.active.map((booking) => renderBooking(booking, true))}</div>
          )}
        </CardContent>
      </Card>

      {/* Estadías Pasadas */}
      {bookings.past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estadías Finalizadas ({bookings.past.length})</CardTitle>
            <CardDescription>Historial de estadías anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {bookings.past.map((booking) => renderBooking(booking, false))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
