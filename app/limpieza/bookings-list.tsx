"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Users, CalendarDays } from "lucide-react"
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
}: {
  bookings: Booking[]
  onUpdate: () => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  if (bookings.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadías Activas</CardTitle>
        <CardDescription>Gestiona las estadías registradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-base font-semibold">
                    {booking.apartment}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {booking.pax} pax
                  </div>
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
