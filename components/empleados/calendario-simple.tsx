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
import { ChevronLeft, ChevronRight, Loader2, CalendarIcon, AlertCircle, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getSupabaseClient } from "@/lib/supabase"
import { HOTELS } from "@/lib/employee-types"

// Colores para TODOS los hoteles de la lista HOTELS
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
  Munich: "bg-amber-100 border-amber-200 text-amber-800",
  Tiburones: "bg-slate-100 border-slate-200 text-slate-800",
  Barlovento: "bg-emerald-100 border-emerald-200 text-emerald-800",
  Carama: "bg-violet-100 border-violet-200 text-violet-800",
  default: "bg-gray-100 border-gray-200 text-gray-800",
}

// Abreviaciones para móvil
const hotelAbbreviations: Record<string, string> = {
  Jaguel: "JAG",
  Monaco: "MON",
  Mallak: "MAL",
  Argentina: "ARG",
  Falkner: "FAL",
  Stromboli: "STR",
  "San Miguel": "SMG",
  Colores: "COL",
  Puntarenas: "PUN",
  Tupe: "TUP",
  Munich: "MUN",
  Tiburones: "TIB",
  Barlovento: "BAR",
  Carama: "CAR",
}

const getHotelColor = (hotelName: string) => {
  return hotelColors[hotelName] || hotelColors.default
}

const getHotelAbbreviation = (hotelName: string) => {
  return hotelAbbreviations[hotelName] || hotelName.substring(0, 3).toUpperCase()
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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

  // Componente para mostrar detalles del día
  const DayDetailsDialog = ({ day, assignments }: { day: Date; assignments: Assignment[] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Eye className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignaciones - {format(day, "d 'de' MMMM", { locale: es })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <div key={assignment.id} className={`p-3 rounded-lg border ${getHotelColor(assignment.hotel_name)}`}>
                <div className="font-medium">{assignment.employee_name}</div>
                <div className="text-sm opacity-75">{assignment.hotel_name}</div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay asignaciones para este día</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

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
            {/* Leyenda completa de hoteles - Solo en desktop */}
            {!isMobile && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Leyenda de Hoteles:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {HOTELS.map((hotel) => (
                    <Badge
                      key={hotel}
                      variant="outline"
                      className={`${getHotelColor(hotel)} border text-xs justify-center`}
                    >
                      {hotel}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Leyenda móvil con abreviaciones */}
            {isMobile && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Hoteles (Abreviaciones):</h4>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {HOTELS.map((hotel) => (
                    <div key={hotel} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded border ${getHotelColor(hotel)}`}></div>
                      <span className="font-medium">{getHotelAbbreviation(hotel)}</span>
                      <span className="text-muted-foreground truncate">{hotel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
                <div key={i} className="text-center font-medium p-1 bg-muted rounded-md text-xs sm:text-sm">
                  <span className="hidden sm:inline">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i]}</span>
                  <span className="sm:hidden">{day}</span>
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
                          min-h-[100px] sm:min-h-[120px] border rounded-md p-1 relative
                          ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"}
                          ${!isCurrentMonth ? "bg-gray-50 opacity-50" : "bg-white"}
                        `}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-xs font-medium">{format(day, "d")}</div>
                          {hasAssignments && isMobile && <DayDetailsDialog day={day} assignments={dayAssignments} />}
                        </div>

                        {hasAssignments ? (
                          <div className="space-y-1">
                            {isMobile
                              ? // Vista móvil: mostrar solo abreviaciones con colores
                                dayAssignments
                                  .slice(0, 2)
                                  .map((assignment) => (
                                    <div
                                      key={assignment.id}
                                      className={`
                                    text-xs p-1 rounded border text-center font-medium
                                    ${getHotelColor(assignment.hotel_name)}
                                  `}
                                      title={`${assignment.hotel_name}: ${assignment.employee_name}`}
                                    >
                                      {getHotelAbbreviation(assignment.hotel_name)}
                                    </div>
                                  ))
                              : // Vista desktop: mostrar información completa
                                dayAssignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className={`
                                    text-xs p-1 rounded border truncate
                                    ${getHotelColor(assignment.hotel_name)}
                                  `}
                                    title={`${assignment.hotel_name}: ${assignment.employee_name}`}
                                  >
                                    <div className="font-medium truncate text-xs">{assignment.employee_name}</div>
                                    <div className="text-xs opacity-75 truncate">{assignment.hotel_name}</div>
                                  </div>
                                ))}
                            {isMobile && dayAssignments.length > 2 && (
                              <div className="text-xs text-center text-muted-foreground">
                                +{dayAssignments.length - 2} más
                              </div>
                            )}
                          </div>
                        ) : (
                          isCurrentMonth && (
                            <div className="text-center text-xs text-muted-foreground py-1">
                              {isMobile ? "-" : "Sin asignaciones"}
                            </div>
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
