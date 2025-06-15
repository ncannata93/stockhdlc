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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getSupabaseClient } from "@/lib/supabase"
import { HOTELS } from "@/lib/employee-types"

// Colores distintivos para cada hotel
const hotelColors: Record<string, string> = {
  Jaguel: "bg-red-500 text-white",
  Monaco: "bg-blue-500 text-white",
  Mallak: "bg-green-500 text-white",
  Argentina: "bg-purple-500 text-white",
  Falkner: "bg-yellow-600 text-white",
  Stromboli: "bg-pink-500 text-white",
  "San Miguel": "bg-indigo-500 text-white",
  Colores: "bg-orange-500 text-white",
  Puntarenas: "bg-teal-500 text-white",
  Tupe: "bg-cyan-500 text-white",
  Munich: "bg-amber-600 text-white",
  Tiburones: "bg-slate-500 text-white",
  Barlovento: "bg-emerald-500 text-white",
  Carama: "bg-violet-500 text-white",
}

// Códigos de 2 letras para cada hotel
const hotelCodes: Record<string, string> = {
  Jaguel: "JA",
  Monaco: "MO",
  Mallak: "ML",
  Argentina: "AR",
  Falkner: "FK",
  Stromboli: "ST",
  "San Miguel": "SM",
  Colores: "CO",
  Puntarenas: "PT",
  Tupe: "TP",
  Munich: "MN",
  Tiburones: "TB",
  Barlovento: "BV",
  Carama: "CR",
}

const getHotelColor = (hotelName: string) => {
  return hotelColors[hotelName] || "bg-gray-500 text-white"
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

export default function EmpleadosCalendario() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      console.error("Error al cargar datos del calendario:", err)
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments(currentDate)
  }, [currentDate])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const daysToDisplay = eachDayOfInterval({ start: startDate, end: endDate })

  const weeks: Date[][] = []
  for (let i = 0; i < daysToDisplay.length; i += 7) {
    weeks.push(daysToDisplay.slice(i, i + 7))
  }

  const getAssignmentsForDay = (date: Date) => {
    if (!assignments || assignments.length === 0) return []

    const dateStr = format(date, "yyyy-MM-dd")
    return assignments.filter((a) => a.assignment_date === dateStr)
  }

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
        <div className="text-sm text-muted-foreground capitalize">
          {format(monthStart, "MMMM yyyy", { locale: es })}
        </div>
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
            {/* Leyenda de hoteles */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Leyenda de Hoteles:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {HOTELS.slice(0, 10).map((hotel) => (
                  <div key={hotel} className="flex items-center gap-2">
                    <Badge className={`${getHotelColor(hotel)} font-bold text-xs px-2 py-1`}>
                      {getHotelCode(hotel)}
                    </Badge>
                    <span className="text-xs truncate" title={hotel}>
                      {hotel}
                    </span>
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
                          min-h-[120px] sm:min-h-[140px] border rounded-md p-1 relative
                          ${isToday ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "border-gray-200"}
                          ${!isCurrentMonth ? "bg-gray-50 opacity-50" : "bg-white"}
                          ${hasAssignments ? "border-green-300 bg-green-50" : ""}
                        `}
                      >
                        <div className="text-sm font-medium mb-1 text-center">{format(day, "d")}</div>

                        {hasAssignments ? (
                          <div className="grid grid-cols-2 gap-0.5">
                            {dayAssignments.map((assignment) => (
                              <TooltipProvider key={assignment.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`
                                        text-xs p-0.5 rounded font-bold text-center cursor-pointer
                                        ${getHotelColor(assignment.hotel_name)}
                                        min-h-[20px] flex flex-col justify-center
                                      `}
                                    >
                                      <div className="text-xs font-bold leading-none">
                                        {getHotelCode(assignment.hotel_name)}
                                      </div>
                                      <div className="text-xs truncate leading-none mt-0.5">
                                        {assignment.employee_name?.split(" ")[0]?.substring(0, 4) || "N/A"}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm">
                                      <div className="font-medium">{assignment.hotel_name}</div>
                                      <div>{assignment.employee_name}</div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        ) : (
                          isCurrentMonth && (
                            <div className="h-full flex items-center justify-center opacity-30">
                              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            </div>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Información adicional */}
            {assignments.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay asignaciones para este mes</p>
                <p className="text-sm">Agrega asignaciones desde la sección "Agregar"</p>
              </div>
            )}

            {/* Debug info */}
            <div className="text-xs text-muted-foreground text-center">
              Total asignaciones cargadas: {assignments.length}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
