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
import { ChevronLeft, ChevronRight, Loader2, CalendarIcon, AlertCircle, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

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

  const toggleDayExpansion = (dateStr: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dateStr)) {
      newExpanded.delete(dateStr)
    } else {
      newExpanded.add(dateStr)
    }
    setExpandedDays(newExpanded)
  }

  // 📱 COMPONENTE MEJORADO PARA VISTA MÓVIL
  const MobileCalendarView = () => {
    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

    // Vista de lista optimizada para móvil
    const ListView = () => {
      const daysWithAssignments = daysToDisplay
        .filter((day) => isSameMonth(day, currentDate))
        .map((day) => ({
          day,
          assignments: getAssignmentsForDay(day),
        }))
        .filter((item) => item.assignments.length > 0)
        .sort((a, b) => a.day.getTime() - b.day.getTime())

      return (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {daysWithAssignments.map(({ day, assignments }) => (
            <Card key={day.toISOString()} className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg">{format(day, "EEEE d", { locale: es })}</div>
                    <div className="text-sm text-muted-foreground">{format(day, "MMMM yyyy", { locale: es })}</div>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {assignments.length} empleados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Badge className={`${getHotelColor(assignment.hotel_name)} font-bold px-3 py-1 text-sm`}>
                      {getHotelCode(assignment.hotel_name)}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-semibold">{assignment.employee_name}</div>
                      <div className="text-sm text-muted-foreground">{assignment.hotel_name}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          {daysWithAssignments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay asignaciones este mes</p>
              <p className="text-sm">Agrega asignaciones desde "Agregar"</p>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Selector de vista */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <Button
            variant={viewMode === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            className="flex-1"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendario
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Lista
          </Button>
        </div>

        {viewMode === "list" ? (
          <ListView />
        ) : (
          <div className="space-y-4">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1">
              {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
                <div key={i} className="text-center font-bold p-3 text-sm text-muted-foreground bg-gray-100 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendario optimizado para móvil */}
            <div className="space-y-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => {
                    const isToday = isSameDay(day, new Date())
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const dayAssignments = getAssignmentsForDay(day)
                    const hasAssignments = dayAssignments.length > 0
                    const dateStr = format(day, "yyyy-MM-dd")
                    const isExpanded = expandedDays.has(dateStr)

                    return (
                      <div
                        key={dayIndex}
                        className={`
                        min-h-[120px] border-2 rounded-xl p-2 relative transition-all duration-200
                        ${isToday ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200" : "border-gray-200"}
                        ${!isCurrentMonth ? "bg-gray-50 opacity-60" : "bg-white"}
                        ${hasAssignments ? "border-green-400 bg-green-50" : ""}
                        ${isExpanded ? "shadow-xl scale-105 z-10" : ""}
                      `}
                      >
                        {/* Header del día mejorado */}
                        <div className="flex justify-between items-center mb-2">
                          <div
                            className={`text-lg font-bold ${
                              isToday ? "text-blue-600" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                            }`}
                          >
                            {format(day, "d")}
                          </div>
                          {hasAssignments && (
                            <div className="flex items-center gap-1">
                              <div className="text-xs bg-blue-500 text-white rounded-full px-2 py-1 font-bold">
                                {dayAssignments.length}
                              </div>
                              {dayAssignments.length > 2 && (
                                <button
                                  onClick={() => toggleDayExpansion(dateStr)}
                                  className="text-xs bg-gray-500 text-white rounded-full p-1 hover:bg-gray-600 transition-colors"
                                >
                                  {isExpanded ? "−" : "+"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Contenido del día mejorado */}
                        {hasAssignments ? (
                          <div className="space-y-1">
                            {(() => {
                              const visibleAssignments = isExpanded ? dayAssignments : dayAssignments.slice(0, 2)

                              return (
                                <>
                                  {visibleAssignments.map((assignment) => (
                                    <div
                                      key={assignment.id}
                                      className={`
                                      ${getHotelColor(assignment.hotel_name)} 
                                      text-xs font-bold px-2 py-1.5 rounded-lg text-center
                                      shadow-sm border border-white/30 transition-transform hover:scale-105
                                    `}
                                      title={`${assignment.hotel_name}: ${assignment.employee_name}`}
                                    >
                                      <div className="font-bold text-xs mb-0.5">
                                        {getHotelCode(assignment.hotel_name)}
                                      </div>
                                      <div className="text-xs leading-tight">
                                        {assignment.employee_name?.split(" ")[0] || "N/A"}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Indicador de más asignaciones mejorado */}
                                  {dayAssignments.length > 2 && !isExpanded && (
                                    <div
                                      className="text-xs text-center text-blue-600 font-bold bg-blue-100 hover:bg-blue-200 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
                                      onClick={() => toggleDayExpansion(dateStr)}
                                    >
                                      +{dayAssignments.length - 2} más
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        ) : (
                          isCurrentMonth && (
                            <div className="h-full flex items-center justify-center opacity-20">
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            </div>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Leyenda mejorada y completa */}
            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border">
              <h4 className="text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Códigos de Hoteles ({HOTELS.length} hoteles):
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {HOTELS.map((hotel) => (
                  <div key={hotel} className="flex items-center gap-2 p-2 bg-white rounded-lg border shadow-sm">
                    <Badge className={`${getHotelColor(hotel)} text-xs font-bold px-2 py-1 flex-shrink-0`}>
                      {getHotelCode(hotel)}
                    </Badge>
                    <span className="text-xs font-medium truncate" title={hotel}>
                      {hotel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensaje cuando no hay asignaciones */}
            {assignments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay asignaciones este mes</p>
                <p className="text-sm">Agrega asignaciones desde "Agregar"</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Replace the existing calendar rendering with mobile-optimized version
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

        {!loading && <MobileCalendarView />}
      </CardContent>
    </Card>
  )
}
