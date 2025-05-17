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
import { createClient } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Definición de tipos
interface Employee {
  id: number
  name: string
}

interface Assignment {
  id: number
  employee_id: number
  hotel_name: string
  assignment_date: string
  notes?: string
  employee_name?: string
}

// Colores para los hoteles
const hotelColors: Record<string, string> = {
  "Hotel A": "bg-red-100 border-red-200 text-red-800",
  "Hotel B": "bg-blue-100 border-blue-200 text-blue-800",
  "Hotel C": "bg-green-100 border-green-200 text-green-800",
  "Hotel D": "bg-purple-100 border-purple-200 text-purple-800",
  "Hotel E": "bg-yellow-100 border-yellow-200 text-yellow-800",
  "Hotel F": "bg-pink-100 border-pink-200 text-pink-800",
  "Hotel G": "bg-indigo-100 border-indigo-200 text-indigo-800",
  "Hotel H": "bg-orange-100 border-orange-200 text-orange-800",
  // Color por defecto para otros hoteles
  default: "bg-gray-100 border-gray-200 text-gray-800",
}

// Función para obtener el color de un hotel
const getHotelColor = (hotelName: string) => {
  return hotelColors[hotelName] || hotelColors.default
}

export default function EmpleadosCalendario() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obtener el cliente de Supabase
  const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseKey) {
      console.error("Faltan credenciales de Supabase")
      return null
    }

    return createClient(supabaseUrl, supabaseKey)
  }

  // Calcular fechas del mes
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Lunes
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 }) // Domingo

  // Crear array de días para mostrar (incluye días del mes anterior y siguiente para completar semanas)
  const daysToDisplay = eachDayOfInterval({ start: startDate, end: endDate })

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          setError("No se pudo conectar a la base de datos")
          setLoading(false)
          return
        }

        // Cargar empleados
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("*")
          .order("name")

        if (employeesError) {
          console.error("Error al cargar empleados:", employeesError)
          setError("Error al cargar empleados")
          setLoading(false)
          return
        }

        setEmployees(employeesData || [])

        // Formatear fechas para la consulta
        const startDateStr = format(startDate, "yyyy-MM-dd")
        const endDateStr = format(endDate, "yyyy-MM-dd")

        // Cargar asignaciones para el mes
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("employee_assignments")
          .select(`
            *,
            employees(name)
          `)
          .gte("assignment_date", startDateStr)
          .lte("assignment_date", endDateStr)
          .order("assignment_date")

        if (assignmentsError) {
          console.error("Error al cargar asignaciones:", assignmentsError)
          setError("Error al cargar asignaciones")
          setLoading(false)
          return
        }

        // Formatear los datos para incluir el nombre del empleado
        const formattedAssignments = (assignmentsData || []).map((item) => ({
          ...item,
          employee_name: item.employees?.name,
        }))

        setAssignments(formattedAssignments)
      } catch (error) {
        console.error("Error al cargar datos del calendario:", error)
        setError("Error al cargar los datos. Por favor, intenta de nuevo.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [startDate, endDate])

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
    const hotelGroups: Record<string, Assignment[]> = {}

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
              {Object.keys(hotelColors)
                .filter((hotel) => hotel !== "default")
                .map((hotel) => (
                  <Badge key={hotel} className={`${getHotelColor(hotel)} border`}>
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
                                        text-xs p-1 rounded border truncate
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
