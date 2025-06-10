"use client"

import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, CalendarIcon, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { getSupabaseClient } from "@/lib/supabase"
import { HOTELS } from "@/lib/employee-types"

// Colores distintivos para cada hotel (mismos que en móvil)
const hotelColors: Record<string, string> = {
  Jaguel: "bg-red-600 text-white border-red-600",
  Monaco: "bg-blue-600 text-white border-blue-600",
  Mallak: "bg-green-600 text-white border-green-600",
  Argentina: "bg-purple-600 text-white border-purple-600",
  Falkner: "bg-yellow-500 text-black border-yellow-500",
  Stromboli: "bg-pink-600 text-white border-pink-600",
  "San Miguel": "bg-indigo-600 text-white border-indigo-600",
  Colores: "bg-orange-600 text-white border-orange-600",
  Puntarenas: "bg-teal-600 text-white border-teal-600",
  Tupe: "bg-cyan-600 text-white border-cyan-600",
  Munich: "bg-amber-500 text-black border-amber-500",
  Tiburones: "bg-slate-600 text-white border-slate-600",
  Barlovento: "bg-emerald-600 text-white border-emerald-600",
  Carama: "bg-violet-600 text-white border-violet-600",
  default: "bg-gray-600 text-white border-gray-600",
}

// Códigos de 2 letras para cada hotel
const hotelCodes: Record<string, string> = {
  Jaguel: "JA",
  Monaco: "MO",
  Mallak: "MA",
  Argentina: "AR",
  Falkner: "FA",
  Stromboli: "ST",
  "San Miguel": "SM",
  Colores: "CO",
  Puntarenas: "PU",
  Tupe: "TU",
  Munich: "MU",
  Tiburones: "TI",
  Barlovento: "BA",
  Carama: "CA",
}

const getHotelColor = (hotelName: string) => {
  return hotelColors[hotelName] || hotelColors.default
}

const getHotelCode = (hotelName: string) => {
  return hotelCodes[hotelName] || hotelName.substring(0, 2).toUpperCase()
}

interface Assignment {
  id: number
  employee_id: number
  hotel_name: string
  assignment_date: string
  employee_name?: string
}

export default function CalendarioSimple() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para cargar asignaciones
  const loadAssignments = async (date: Date) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError("No se pudo conectar a la base de datos")
        return
      }

      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

      const startDateStr = format(startDate, "yyyy-MM-dd")
      const endDateStr = format(endDate, "yyyy-MM-dd")

      console.log("Cargando asignaciones:", { startDateStr, endDateStr })

      const { data, error: queryError } = await supabase
        .from("employee_assignments")
        .select(`
          id,
          employee_id,
          hotel_name,
          assignment_date,
          employees!inner(name)
        `)
        .gte("assignment_date", startDateStr)
        .lte("assignment_date", endDateStr)
        .order("assignment_date")

      if (queryError) {
        console.error("Error al cargar asignaciones:", queryError)
        setError("Error al cargar asignaciones")
        return
      }

      const formattedAssignments = (data || []).map((item: any) => ({
        id: item.id,
        employee_id: item.employee_id,
        hotel_name: item.hotel_name,
        assignment_date: item.assignment_date,
        employee_name: item.employees?.name,
      }))

      console.log("Asignaciones cargadas:", formattedAssignments.length)
      setAssignments(formattedAssignments)
    } catch (err) {
      console.error("Error inesperado:", err)
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos cuando cambia el mes
  useEffect(() => {
    loadAssignments(currentDate)
  }, [currentDate])

  // Calcular fechas para el calendario
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const daysToDisplay = eachDayOfInterval({ start: startDate, end: endDate })

  // Agrupar días por semanas
  const weeks: Date[][] = []
  for (let i = 0; i < daysToDisplay.length; i += 7) {
    weeks.push(daysToDisplay.slice(i, i + 7))
  }

  // Obtener asignaciones para un día específico
  const getAssignmentsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return assignments.filter((a) => a.assignment_date === dateStr)
  }

  // Navegar meses
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const currentMonth = () => setCurrentDate(new Date())

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg sm:text-xl">Calendario de Asignaciones</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth} disabled={loading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={currentMonth} disabled={loading}>
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth} disabled={loading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{format(monthStart, "MMMM yyyy", { locale: es })}</div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando calendario...</span>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {/* Leyenda completa de hoteles con colores */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Leyenda de Hoteles:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {HOTELS.map((hotel) => (
                  <div key={hotel} className="flex items-center gap-2">
                    <Badge className={`${getHotelColor(hotel)} font-bold text-xs px-2 py-1`}>
                      {getHotelCode(hotel)}
                    </Badge>
                    <span className="text-xs">{hotel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => (
                <div key={i} className="text-center font-medium p-2 bg-muted rounded-md text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendario */}
            <div className="space-y-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => {
                    const isToday = isSameDay(day, new Date())
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const dayAssignments = getAssignmentsForDay(day)
                    const hasAssignments = dayAssignments.length > 0

                    return (
                      <div
                        key={dayIndex}
                        className={`
                          min-h-[120px] border rounded-md p-2 relative
                          ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"}
                          ${!isCurrentMonth ? "bg-gray-50 opacity-50" : "bg-white"}
                        `}
                      >
                        <div className="text-sm font-medium mb-2">{format(day, "d")}</div>

                        {hasAssignments ? (
                          <div className="space-y-1">
                            {dayAssignments.map((assignment) => (
                              <div key={assignment.id} className="space-y-1">
                                <div
                                  className={`
                                    text-xs p-2 rounded border font-medium
                                    ${getHotelColor(assignment.hotel_name)}
                                  `}
                                  title={`${assignment.hotel_name}: ${assignment.employee_name}`}
                                >
                                  <div className="font-bold text-center mb-1">
                                    {getHotelCode(assignment.hotel_name)}
                                  </div>
                                  <div className="text-xs text-center truncate">{assignment.employee_name}</div>
                                  <div className="text-xs text-center opacity-90 truncate">{assignment.hotel_name}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          isCurrentMonth && (
                            <div className="text-center text-xs text-muted-foreground py-4">Sin asignaciones</div>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Estado vacío */}
            {assignments.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay asignaciones para este mes</p>
                <p className="text-sm">Agrega asignaciones desde la sección "Agregar"</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
