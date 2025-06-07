"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEmployeeDB } from "@/lib/employee-db"
import type { EmployeeAssignment } from "@/lib/employee-types"
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"

export default function EmpleadosCalendario() {
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  const { getAssignments } = useEmployeeDB()

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAssignments()
      setAssignments(data)
    } catch (error) {
      console.error("Error al cargar asignaciones:", error)
      setError("Error al cargar las asignaciones")
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return assignments.filter((assignment) => assignment.assignment_date.startsWith(dateStr))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Cargando calendario...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario de Asignaciones
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[150px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Encabezados de días */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center font-semibold text-gray-600 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendario */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2 h-24"></div>
              }

              const dayAssignments = getAssignmentsForDate(day)
              const isToday = day.toDateString() === new Date().toDateString()

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    p-2 h-24 border rounded-lg overflow-hidden
                    ${isToday ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}
                    hover:bg-gray-50 transition-colors
                  `}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                    {day.getDate()}
                  </div>

                  {dayAssignments.length > 0 && (
                    <div className="space-y-1">
                      {dayAssignments.slice(0, 2).map((assignment, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                          title={`${assignment.employee_name} - ${assignment.hotel_name}`}
                        >
                          {assignment.employee_name?.split(" ")[0] || "Empleado"} - {assignment.hotel_name}
                        </div>
                      ))}
                      {dayAssignments.length > 2 && (
                        <div className="text-xs text-gray-500">+{dayAssignments.length - 2} más</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Estadísticas del mes */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    assignments.filter((a) => {
                      const assignmentDate = new Date(a.assignment_date)
                      return (
                        assignmentDate.getMonth() === currentDate.getMonth() &&
                        assignmentDate.getFullYear() === currentDate.getFullYear()
                      )
                    }).length
                  }
                </div>
                <div className="text-sm text-blue-700">Asignaciones este mes</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    [
                      ...new Set(
                        assignments
                          .filter((a) => {
                            const assignmentDate = new Date(a.assignment_date)
                            return (
                              assignmentDate.getMonth() === currentDate.getMonth() &&
                              assignmentDate.getFullYear() === currentDate.getFullYear()
                            )
                          })
                          .map((a) => a.employee_id),
                      ),
                    ].length
                  }
                </div>
                <div className="text-sm text-green-700">Empleados activos</div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {
                    [
                      ...new Set(
                        assignments
                          .filter((a) => {
                            const assignmentDate = new Date(a.assignment_date)
                            return (
                              assignmentDate.getMonth() === currentDate.getMonth() &&
                              assignmentDate.getFullYear() === currentDate.getFullYear()
                            )
                          })
                          .map((a) => a.hotel_name),
                      ),
                    ].length
                  }
                </div>
                <div className="text-sm text-purple-700">Hoteles con servicio</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
