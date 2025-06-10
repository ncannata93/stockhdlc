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
import { ChevronLeft, ChevronRight, Loader2, CalendarIcon, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getSupabaseClient } from "@/lib/supabase"
import { HOTELS } from "@/lib/employee-types"

// Colores para TODOS los hoteles de la lista HOTELS
const hotelColors: Record<string, string> = {
  Jaguel: "bg-red-500 text-white",
  Monaco: "bg-blue-500 text-white",
  Mallak: "bg-green-500 text-white",
  Argentina: "bg-purple-500 text-white",
  Falkner: "bg-yellow-500 text-black",
  Stromboli: "bg-pink-500 text-white",
  "San Miguel": "bg-indigo-500 text-white",
  Colores: "bg-orange-500 text-white",
  Puntarenas: "bg-teal-500 text-white",
  Tupe: "bg-cyan-500 text-white",
  Munich: "bg-amber-500 text-black",
  Tiburones: "bg-slate-500 text-white",
  Barlovento: "bg-emerald-500 text-white",
  Carama: "bg-violet-500 text-white",
  default: "bg-gray-500 text-white",
}

// Códigos únicos de 2 letras para cada hotel
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
        <Button variant="ghost" size="sm" className="absolute top-0 right-0 h-5 w-5 p-0 text-xs">
          <Info className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignaciones - {format(day, "d 'de' MMMM", { locale: es })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <div key={assignment.id} className="p-3 rounded-lg border bg-gray-50">
                <div className="font-medium text-lg">{assignment.employee_name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`px-2 py-1 rounded text-sm font-bold ${getHotelColor(assignment.hotel_name)}`}>
                    {getHotelCode(assignment.hotel_name)}
                  </div>
                  <span className="text-sm text-gray-600">{assignment.hotel_name}</span>
                </div>
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
            {/* Leyenda de códigos de hoteles */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {isMobile ? "Códigos de Hoteles:" : "Leyenda de Hoteles:"}
              </h4>
              <div className={`grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}`}>
                {HOTELS.map((hotel) => (
                  <div key={hotel} className="flex items-center gap-2">
                    <div
                      className={`px-2 py-1 rounded text-xs font-bold min-w-[32px] text-center ${getHotelColor(hotel)}`}
                    >
                      {getHotelCode(hotel)}
                    </div>
                    <span className={`text-xs ${isMobile ? "truncate" : ""}`}>{hotel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
                <div key={i} className="text-center font-medium p-2 bg-muted rounded-md text-xs sm:text-sm">
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
                          ${isMobile ? "min-h-[80px]" : "min-h-[120px]"} 
                          border rounded-md p-1 relative
                          ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"}
                          ${!isCurrentMonth ? "bg-gray-50 opacity-50" : "bg-white"}
                        `}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-xs font-medium">{format(day, "d")}</div>
                          {hasAssignments && <DayDetailsDialog day={day} assignments={dayAssignments} />}
                        </div>

                        {hasAssignments ? (
                          <div className="space-y-1">
                            {dayAssignments.slice(0, isMobile ? 2 : 3).map((assignment) => (
                              <div key={assignment.id} className="space-y-1">
                                {isMobile ? (
                                  // Vista móvil: Solo código del hotel con color
                                  <div
                                    className={`
                                      text-xs font-bold px-1 py-0.5 rounded text-center
                                      ${getHotelColor(assignment.hotel_name)}
                                    `}
                                    title={`${assignment.hotel_name}: ${assignment.employee_name}`}
                                  >
                                    {getHotelCode(assignment.hotel_name)}
                                  </div>
                                ) : (
                                  // Vista desktop: Información completa
                                  <div
                                    className="text-xs p-1 rounded border bg-gray-50"
                                    title={`${assignment.hotel_name}: ${assignment.employee_name}`}
                                  >
                                    <div className="font-medium truncate">{assignment.employee_name}</div>
                                    <div className="text-xs opacity-75 truncate">{assignment.hotel_name}</div>
                                  </div>
                                )}
                              </div>
                            ))}
                            {dayAssignments.length > (isMobile ? 2 : 3) && (
                              <div className="text-xs text-center text-muted-foreground font-medium">
                                +{dayAssignments.length - (isMobile ? 2 : 3)}
                              </div>
                            )}
                          </div>
                        ) : (
                          isCurrentMonth && (
                            <div className="text-center text-xs text-muted-foreground py-2">
                              {isMobile ? "—" : "Sin asignaciones"}
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
