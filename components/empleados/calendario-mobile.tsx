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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getSupabaseClient } from "@/lib/supabase"
import { HOTELS } from "@/lib/employee-types"

// Códigos más cortos y legibles para móvil
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

// Colores más suaves para mejor legibilidad en móvil
const hotelColors: Record<string, string> = {
  Jaguel: "bg-red-100 text-red-800 border-red-200",
  Monaco: "bg-blue-100 text-blue-800 border-blue-200",
  Mallak: "bg-green-100 text-green-800 border-green-200",
  Argentina: "bg-purple-100 text-purple-800 border-purple-200",
  Falkner: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Stromboli: "bg-pink-100 text-pink-800 border-pink-200",
  "San Miguel": "bg-indigo-100 text-indigo-800 border-indigo-200",
  Colores: "bg-orange-100 text-orange-800 border-orange-200",
  Puntarenas: "bg-teal-100 text-teal-800 border-teal-200",
  Tupe: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Munich: "bg-amber-100 text-amber-800 border-amber-200",
  Tiburones: "bg-slate-100 text-slate-800 border-slate-200",
  Barlovento: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Carama: "bg-violet-100 text-violet-800 border-violet-200",
}

const getHotelCode = (hotelName: string) => {
  return hotelCodes[hotelName] || hotelName.substring(0, 2).toUpperCase()
}

const getHotelColor = (hotelName: string) => {
  return hotelColors[hotelName] || "bg-gray-100 text-gray-800 border-gray-200"
}

interface Assignment {
  id: number
  employee_id: number
  hotel_name: string
  assignment_date: string
  employee_name?: string
}

export default function CalendarioMobile() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
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

  const DayDetailsDialog = ({ day, assignments }: { day: Date; assignments: Assignment[] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 rounded-full bg-blue-100 hover:bg-blue-200">
          <Eye className="h-3 w-3 text-blue-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{format(day, "EEEE d 'de' MMMM", { locale: es })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <div key={assignment.id} className="p-4 rounded-lg border bg-gray-50">
                <div className="font-semibold text-lg mb-2">{assignment.employee_name}</div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getHotelColor(assignment.hotel_name)} font-bold`}>
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
        <div className="text-sm text-muted-foreground capitalize">
          {format(monthStart, "MMMM yyyy", { locale: es })}
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

        {!loading && (
          <div className="space-y-3">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
                <div key={i} className="text-center font-semibold p-2 text-xs text-muted-foreground">
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
                          min-h-[100px] border rounded-lg p-2 relative
                          ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"}
                          ${!isCurrentMonth ? "bg-gray-50 opacity-60" : "bg-white"}
                          ${hasAssignments ? "border-green-300 bg-green-50" : ""}
                        `}
                      >
                        {/* Header del día */}
                        <div className="flex justify-between items-center mb-2">
                          <div className={`text-sm font-semibold ${isToday ? "text-blue-600" : ""}`}>
                            {format(day, "d")}
                          </div>
                          {hasAssignments && <DayDetailsDialog day={day} assignments={dayAssignments} />}
                        </div>

                        {/* Contenido del día */}
                        {hasAssignments ? (
                          <div className="space-y-1">
                            {dayAssignments.slice(0, 2).map((assignment) => (
                              <div key={assignment.id} className="space-y-1">
                                <Badge
                                  className={`${getHotelColor(assignment.hotel_name)} text-xs font-bold w-full justify-center`}
                                  title={`${assignment.hotel_name}: ${assignment.employee_name}`}
                                >
                                  {getHotelCode(assignment.hotel_name)}
                                </Badge>
                                <div className="text-xs text-center text-gray-600 truncate">
                                  {assignment.employee_name?.split(" ")[0] || "N/A"}
                                </div>
                              </div>
                            ))}
                            {dayAssignments.length > 2 && (
                              <div className="text-xs text-center text-blue-600 font-medium bg-blue-100 rounded px-1 py-0.5">
                                +{dayAssignments.length - 2} más
                              </div>
                            )}
                          </div>
                        ) : (
                          isCurrentMonth && (
                            <div className="h-full flex items-center justify-center">
                              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                            </div>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Leyenda de hoteles */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold mb-2 text-gray-700">Códigos de Hoteles:</h4>
              <div className="grid grid-cols-2 gap-2">
                {HOTELS.slice(0, 8).map((hotel) => (
                  <div key={hotel} className="flex items-center gap-2">
                    <Badge className={`${getHotelColor(hotel)} text-xs font-bold`}>{getHotelCode(hotel)}</Badge>
                    <span className="text-xs truncate" title={hotel}>
                      {hotel}
                    </span>
                  </div>
                ))}
              </div>
              {HOTELS.length > 8 && (
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Y {HOTELS.length - 8} hoteles más...
                </div>
              )}
            </div>

            {assignments.length === 0 && !loading && (
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
