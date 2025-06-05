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
import { useEmployeeDB } from "@/lib/employee-db"
import type { EmployeeAssignment } from "@/lib/employee-types"
import { HOTELS } from "@/lib/employee-types"

// Colores para los hoteles
const hotelColors: Record<string, string> = {
  Jaguel: "bg-red-100 border-red-200 text-red-800",
  Monaco: "bg-blue-100 border-blue-200 text-blue-800",
  Mallak: "bg-green-100 border-green-200 text-green-800",
  Argentina: "bg-purple-100 border-purple-200 text-purple-800",
  Falkner: "bg-yellow-100 border-yellow-200 text-yellow-800",
  Stromboli: "bg-pink-100 border-pink-200 text-pink-800",
  "San Miguel": "bg-indigo-100 border-indigo-200 text-indigo-800",
  Colores: "bg-orange-100 border-orange-200 text-orange-800",
  Puntarenas: "bg-teal-100 border-teal-200 text-teal-800",
  Tupe: "bg-cyan-100 border-cyan-200 text-cyan-800",
  Munich: "bg-lime-100 border-lime-200 text-lime-800",
  Tiburones: "bg-emerald-100 border-emerald-200 text-emerald-800",
  Barlovento: "bg-violet-100 border-violet-200 text-violet-800",
  Carama: "bg-rose-100 border-rose-200 text-rose-800",
  // Color por defecto para otros hoteles
  default: "bg-gray-100 border-gray-200 text-gray-800",
}

// Función para obtener el color de un hotel
const getHotelColor = (hotelName: string) => {
  return hotelColors[hotelName] || hotelColors.default
}

export default function EmpleadosCalendario() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { getAssignments } = useEmployeeDB()

  useEffect(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const loadCalendarData = async () => {
      setLoading(true)
      setError(null)

      try {
        const startDateStr = format(startDate, "yyyy-MM-dd")
        const endDateStr = format(endDate, "yyyy-MM-dd")

        console.log("Cargando asignaciones para calendario:", { startDateStr, endDateStr })

        const assignmentsData = await getAssignments({
          start_date: startDateStr,
          end_date: endDateStr,
        })

        console.log("Asignaciones cargadas:", assignmentsData.length)
        setAssignments(assignmentsData)
      } catch (error) {
        console.error("Error al cargar datos del calendario:", error)
        setError("Error al cargar los datos. Por favor, intenta de nuevo.")
      } finally {
        setLoading(false)
      }
    }

    loadCalendarData()
  }, [currentDate])

  // Calcular fechas del mes (mover después del useEffect)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStartDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEndDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // Crear array de días para mostrar
  const daysToDisplay = eachDayOfInterval({ start: calendarStartDate, end: calendarEndDate })

  // Agrupar días por semanas
  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  daysToDisplay.forEach((day) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  // Navegar al mes anterior
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  // Navegar al mes siguiente
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  // Navegar al mes actual
  const currentMonth = () => {
    setCurrentDate(new Date())
  }

  // Obtener asignaciones para un día específico
  const getAssignmentsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return assignments.filter((a) => a.assignment_date === dateStr)
  }

  // Agrupar asignaciones por hotel para un día específico
  const getHotelGroups = (date: Date) => {
    const dayAssignments = getAssignmentsForDay(date)
    const hotelGroups: Record<string, EmployeeAssignment[]> = {}

    dayAssignments.forEach((assignment) => {
      if (!hotelGroups[assignment.hotel_name]) {
        hotelGroups[assignment.hotel_name] = []
      }
      hotelGroups[assignment.hotel_name].push(assignment)
    })

    return hotelGroups
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Calendario Mensual</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={currentMonth}>
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
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

        {loading ? (
          <div className="flex flex-col justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Cargando calendario...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Leyenda de hoteles */}
            <div className="flex flex-wrap gap-2 mb-4">
              {HOTELS.slice(0, 8).map((hotel) => (
                <Badge key={hotel} className={`${getHotelColor(hotel)} border text-xs`}>
                  {hotel}
                </Badge>
              ))}
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => (
                <div key={i} className="text-center font-medium p-2 bg-muted rounded-md">
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
                    const hotelGroups = getHotelGroups(day)
                    const hasAssignments = Object.keys(hotelGroups).length > 0

                    return (
                      <div
                        key={dayIndex}
                        className={`
                          min-h-[100px] border rounded-md p-1 overflow-y-auto
                          ${isToday ? "border-blue-500 bg-blue-50" : ""}
                          ${!isCurrentMonth ? "bg-gray-50 opacity-50" : ""}
                        `}
                      >
                        <div className="text-right text-sm font-medium mb-1">{format(day, "d")}</div>

                        {hasAssignments ? (
                          <div className="space-y-1">
                            {Object.entries(hotelGroups).map(([hotel, hotelAssignments]) => (
                              <TooltipProvider key={hotel}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`
                                        text-xs p-1 rounded border truncate cursor-pointer
                                        ${getHotelColor(hotel)}
                                      `}
                                    >
                                      {hotel}: {hotelAssignments.length}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm">
                                      <div className="font-medium mb-1">{hotel}</div>
                                      <ul className="space-y-1">
                                        {hotelAssignments.map((assignment) => (
                                          <li key={assignment.id}>
                                            {assignment.employee_name || `Empleado #${assignment.employee_id}`}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        ) : (
                          isCurrentMonth && (
                            <div className="text-center text-xs text-muted-foreground py-2">Sin asignaciones</div>
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
