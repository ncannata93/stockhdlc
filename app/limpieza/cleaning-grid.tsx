"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Calendar } from "lucide-react"
import { toggleCleaningComplete } from "./actions"
import { toast } from "@/hooks/use-toast"

type CleaningRecord = {
  id: string
  apartment: string
  date: string
  day_type: string
  cleaning_type: string
  is_completed: boolean
  pax?: number
  check_in?: string
  check_out?: string
}

type GroupedData = {
  [date: string]: {
    [apartment: string]: CleaningRecord
  }
}

const dayTypeColors: Record<string, string> = {
  "check-in": "bg-green-500/10 text-green-700 border-green-500/20",
  "check-out": "bg-red-500/10 text-red-700 border-red-500/20",
  "check-in-out": "bg-purple-500/10 text-purple-700 border-purple-500/20",
  daily: "bg-blue-500/10 text-blue-700 border-blue-500/20",
}

const cleaningTypeIcons: Record<string, string> = {
  repaso: "○",
  "repaso-sabanas": "◉",
  completa: "✕",
}

export function CleaningGrid({
  data,
  onUpdate,
}: {
  data: CleaningRecord[]
  onUpdate: () => void
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Generate apartment numbers
  const apartments = Array.from(new Set(data.map((d) => d.apartment))).sort()

  // Group data by date and apartment
  const grouped: GroupedData = {}
  data.forEach((record) => {
    if (!grouped[record.date]) {
      grouped[record.date] = {}
    }
    grouped[record.date][record.apartment] = record
  })

  const dates = Object.keys(grouped).sort()

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id)
    try {
      await toggleCleaningComplete(id, !currentStatus)
      toast({
        title: currentStatus ? "Marcado como pendiente" : "Marcado como completado",
        description: "El estado de limpieza ha sido actualizado",
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (dates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay estadías registradas</p>
          <p className="text-sm text-muted-foreground">Agrega una estadía para comenzar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planilla de Limpieza</CardTitle>
        <CardDescription>
          Limpieza automática generada por estadías.
          <span className="ml-2">○ = Repaso</span>
          <span className="ml-2">◉ = Repaso + Sábanas</span>
          <span className="ml-2">✕ = Completa</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header */}
            <div className="flex gap-2 mb-2 pb-2 border-b">
              <div className="w-20 font-semibold text-sm">Fecha</div>
              <div className="w-24 font-semibold text-sm">Apart.</div>
              <div className="w-16 font-semibold text-sm">PAX</div>
              <div className="w-32 font-semibold text-sm">Tipo</div>
              <div className="w-32 font-semibold text-sm">Limpieza</div>
              <div className="w-28 font-semibold text-sm">Estado</div>
            </div>

            {/* Rows */}
            <div className="space-y-1">
              {dates.map((date) => {
                const dateRecords = grouped[date]
                return apartments
                  .filter((apt) => dateRecords[apt])
                  .map((apt) => {
                    const record = dateRecords[apt]
                    return (
                      <div
                        key={record.id}
                        className={`flex gap-2 items-center py-2 px-2 rounded hover:bg-muted/50 transition-colors ${
                          record.is_completed ? "opacity-50" : ""
                        }`}
                      >
                        <div className="w-20 text-sm">
                          {new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </div>
                        <div className="w-24 font-medium text-sm">{record.apartment}</div>
                        <div className="w-16 text-sm">{record.pax || "-"}</div>
                        <div className="w-32">
                          <Badge variant="outline" className={dayTypeColors[record.day_type]}>
                            {record.day_type === "check-in"
                              ? "Check In"
                              : record.day_type === "check-out"
                                ? "Check Out"
                                : record.day_type === "check-in-out"
                                  ? "In/Out"
                                  : "Diario"}
                          </Badge>
                        </div>
                        <div className="w-32 flex items-center gap-2">
                          <span className="text-lg font-bold">{cleaningTypeIcons[record.cleaning_type]}</span>
                          <span className="text-sm text-muted-foreground">
                            {record.cleaning_type === "repaso"
                              ? "Repaso"
                              : record.cleaning_type === "repaso-sabanas"
                                ? "Rep + Sáb"
                                : "Completa"}
                          </span>
                        </div>
                        <div className="w-28">
                          <Button
                            size="sm"
                            variant={record.is_completed ? "default" : "outline"}
                            onClick={() => handleToggleComplete(record.id, record.is_completed)}
                            disabled={updatingId === record.id}
                            className="h-8"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {record.is_completed ? "Hecho" : "Pendiente"}
                          </Button>
                        </div>
                      </div>
                    )
                  })
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
