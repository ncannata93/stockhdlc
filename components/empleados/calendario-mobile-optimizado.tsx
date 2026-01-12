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
import { ChevronLeft, ChevronRight, Loader2, CalendarIcon, AlertCircle, Users, MapPin } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getSupabaseClient } from "@/lib/supabase"
import { HOTELS } from "@/lib/employee-types"

// Códigos ultra cortos para móvil
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

// Colores más suaves y legibles
const hotelColors: Record<string, string> = {
  Jaguel: "bg-red-100 text-red-700 border-red-200",
  Monaco: "bg-blue-100 text-blue-700 border-blue-200",
  Mallak: "bg-green-100 text-green-700 border-green-200",
  Argentina: "bg-purple-100 text-purple-700 border-purple-200",
  Falkner: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Stromboli: "bg-pink-100 text-pink-700 border-pink-200",
  "San Miguel": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Colores: "bg-orange-100 text-orange-700 border-orange-200",
  Puntarenas: "bg-teal-100 text-teal-700 border-teal-200",
  Tupe: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Munich: "bg-amber-100 text-amber-700 border-amber-200",
  Tiburones: "bg-slate-100 text-slate-700 border-slate-200",
  Barlovento: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Carama: "bg-violet-100 text-violet-700 border-violet-200",
}

const getHotelCode = (hotelName: string) => {
  return hotelCodes[hotelName] || hotelName.substring(0, 2).toUpperCase()
}

const getHotelColor = (hotelName: string) => {
  return hotelColors[hotelName] || "bg-gray-100 text-gray-700 border-gray-200"
}

interface Assignment {
  id: number
  employee_id: number
  hotel_name: string
  assignment_date: string
  employee_name?: string
}

export default function CalendarioMobileOptimizado() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

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

      setAssignments(formattedAssignments)
    } catch (err) {
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
    const dateStr = format(date, "yyyy-MM-dd")
    return assignments.filter((a) => a.assignment_date === dateStr)
  }

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const currentMonth = () => setCurrentDate(new Date())

  // Vista de lista para días con muchas asignaciones
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
      <ScrollArea className="h-[600px]">
        <div className="space-y-4 p-2">
          {daysWithAssignments.map(({ day, assignments }) => (
            <Card key={day.toISOString()} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  {format(day, "EEEE d 'de' MMMM", { locale: es })}
                  <Badge variant="secondary" className="ml-auto">
                    {assignments.length} asignaciones
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Badge className={`${getHotelColor(assignment.hotel_name)} font-bold px-3 py-1`}>
                        {getHotelCode(assignment.hotel_name)}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{assignment.employee_name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {assignment.hotel_name}
                      </div>
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
      </ScrollArea>
    )
  }

  const DayDetailsDialog = ({ day, assignments }: { day: Date; assignments: Assignment[] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Users className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-lg">{format(day, "EEEE d 'de' MMMM", { locale: es })}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 p-1">
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <div key={assignment.id} className="p-4 rounded-lg border bg-gray-50">
                  <div className="font-semibold text-lg mb-2">{assignment.employee_name}</div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getHotelColor(assignment.hotel_name)} font-bold px-3 py-1`}>
                      {getHotelCode(assignment.hotel_name)}
                    </Badge>
                    <span className="text-sm font-medium">{assignment.hotel_name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay asignaciones para este día</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Calendario</CardTitle>
          <div className="flex gap-1">
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
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground capitalize">
            {format(monthStart, "MMMM yyyy", { locale: es })}
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              Calendario
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              Lista
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm">Cargando...</span>
          </div>
        )}

        {!loading && viewMode === "list" && <ListView />}

        {!loading && viewMode === "calendar" && (
          <div className="space-y-3">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
                <div
                  key={i}
                  className="text-center font-semibold p-2 text-sm text-muted-foreground bg-gray-100 rounded"
                >
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
                          min-h-[80px] border rounded-lg p-2 relative
                          ${isToday ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "border-gray-200"}
                          ${!isCurrentMonth ? "bg-gray-50 opacity-50" : "bg-white"}
                          ${hasAssignments ? "border-green-400 bg-green-50" : ""}
                        `}
                      >
                        {/* Header del día */}
                        <div className="flex justify-between items-center mb-1">
                          <div
                            className={`text-sm font-bold ${
                              isToday ? "text-blue-600" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                            }`}
                          >
                            {format(day, "d")}
                          </div>
                          {hasAssignments && dayAssignments.length > 2 && (
                            <DayDetailsDialog day={day} assignments={dayAssignments} />
                          )}
                        </div>

                        {/* Contenido del día */}
                        {hasAssignments ? (
                          <div className="space-y-1">
                            {dayAssignments.slice(0, 2).map((assignment) => (
                              <div key={assignment.id} className="text-center">
                                <Badge
                                  className={`${getHotelColor(assignment.hotel_name)} text-xs font-bold w-full justify-center py-1 mb-1`}
                                  title={`${assignment.hotel_name}: ${assignment.employee_name}`}
                                >
                                  {getHotelCode(assignment.hotel_name)}
                                </Badge>
                              </div>
                            ))}
                            {dayAssignments.length > 2 && (
                              <div className="text-xs text-center text-blue-600 font-bold bg-blue-100 rounded px-1 py-0.5">
                                +{dayAssignments.length - 2} más
                              </div>
                            )}
                          </div>
                        ) : (
                          isCurrentMonth && (
                            <div className="h-full flex items-center justify-center opacity-20">
                              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            </div>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Leyenda compacta */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold mb-2 text-gray-700">Hoteles:</h4>
              <div className="grid grid-cols-3 gap-2">
                {HOTELS.slice(0, 9).map((hotel) => (
                  <div key={hotel} className="flex items-center gap-1">
                    <Badge className={`${getHotelColor(hotel)} text-xs font-bold px-2 py-0.5`}>
                      {getHotelCode(hotel)}
                    </Badge>
                    <span className="text-xs truncate" title={hotel}>
                      {hotel.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
              {HOTELS.length > 9 && (
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Y {HOTELS.length - 9} hoteles más...
                </div>
              )}
            </div>

            {assignments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No hay asignaciones este mes</p>
                <p className="text-sm">Agrega asignaciones desde "Agregar"</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
