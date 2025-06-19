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

// Colores brillantes para móvil
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
}

const getHotelCode = (hotelName: string) => {
  return hotelCodes[hotelName] || hotelName.substring(0, 2).toUpperCase()
}

const getHotelColor = (hotelName: string) => {
  return hotelColors[hotelName] || "bg-gray-500 text-white"
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
        console.error("Query error:", queryError)
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

      console.log("Assignments loaded:", formattedAssignments)
      setAssignments(formattedAssignments)
    } catch (err) {
      console.error("Load error:", err)
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
    const dayAssignments = assignments.filter((a) => a.assignment_date === dateStr)
    console.log(`Assignments for ${dateStr}:`, dayAssignments)
    return dayAssignments
  }

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const currentMonth = () => setCurrentDate(new Date())

  const DayDetailsDialog = ({ day, assignments }: { day: Date; assignments: Assignment[] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 rounded-full bg-blue-500 hover:bg-blue-600">
          <Eye className="h-2 w-2 text-white" />
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
                  <Badge className={`${getHotelColor(assignment.hotel_name)} font-bold text-sm px-3 py-1`}>
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
          <CardTitle className="text-lg">Calendario Móvil</CardTitle>
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
      <CardContent className="p-2">
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
            {/* Leyenda de hoteles */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold mb-2 text-gray-700">Hoteles:</h4>
              <div className="grid grid-cols-4 gap-1">
                {HOTELS.slice(0, 8).map((hotel) => (
                  <div key={hotel} className="flex items-center gap-1">
                    <Badge className={`${getHotelColor(hotel)} text-xs font-bold px-1 py-0.5`}>
                      {getHotelCode(hotel)}
                    </Badge>
                    <span className="text-xs truncate" title={hotel}>
                      {hotel.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
                <div
                  key={i}
                  className="text-center font-semibold p-1 text-xs text-muted-foreground bg-gray-100 rounded"
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
                          min-h-[100px] border rounded-lg p-1 relative
                          ${isToday ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "border-gray-200"}
                          ${!isCurrentMonth ? "bg-gray-50 opacity-50" : "bg-white"}
                          ${hasAssignments ? "border-green-400 bg-green-50" : ""}
                        `}
                      >
                        {/* Header del día */}
                        <div className="flex justify-between items-center mb-1">
                          <div
                            className={`text-sm font-bold ${isToday ? "text-blue-600" : isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}
                          >
                            {format(day, "d")}
                          </div>
                          {hasAssignments && <DayDetailsDialog day={day} assignments={dayAssignments} />}
                        </div>

                        {/* Contenido del día */}
                        {hasAssignments ? (
                          <div className="space-y-1">
                            {dayAssignments.slice(0, 2).map((assignment, index) => (
                              <div key={assignment.id} className="space-y-0.5">
                                <Badge
                                  className={`${getHotelColor(assignment.hotel_name)} text-xs font-bold w-full justify-center py-1`}
                                  title={`${assignment.hotel_name}: ${assignment.employee_name}`}
                                >
                                  {getHotelCode(assignment.hotel_name)}
                                </Badge>
                                <div className="text-xs text-center text-gray-700 truncate font-medium">
                                  {assignment.employee_name?.split(" ")[0] || "N/A"}
                                </div>
                              </div>
                            ))}
                            {dayAssignments.length > 2 && (
                              <div className="text-xs text-center text-blue-600 font-bold bg-blue-100 rounded px-1 py-0.5">
                                +{dayAssignments.length - 2}
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

            {/* Debug info */}
            <div className="text-xs text-gray-500 text-center">Total asignaciones cargadas: {assignments.length}</div>

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
