"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Building, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface EmployeeSummary {
  total: number
  active: number
}

interface AssignmentSummary {
  today: number
  week: number
  month: number
}

interface HotelSummary {
  name: string
  count: number
}

export default function EmpleadosInicio() {
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummary>({ total: 0, active: 0 })
  const [assignmentSummary, setAssignmentSummary] = useState<AssignmentSummary>({ today: 0, week: 0, month: 0 })
  const [hotelSummary, setHotelSummary] = useState<HotelSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // En una implementación real, estos datos vendrían de la base de datos
    // Aquí usamos datos de ejemplo para la demostración
    setTimeout(() => {
      setEmployeeSummary({ total: 4, active: 3 })
      setAssignmentSummary({ today: 2, week: 8, month: 24 })
      setHotelSummary([
        { name: "Hotel A", count: 5 },
        { name: "Hotel B", count: 8 },
        { name: "Hotel C", count: 3 },
        { name: "Hotel D", count: 6 },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Resumen de empleados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold">{employeeSummary.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{employeeSummary.active}</div>
                  <div className="text-sm text-muted-foreground">Activos hoy</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de asignaciones */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Asignaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-3xl font-bold">{assignmentSummary.today}</div>
                  <div className="text-sm text-muted-foreground">Hoy</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{assignmentSummary.week}</div>
                  <div className="text-sm text-muted-foreground">Semana</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{assignmentSummary.month}</div>
                  <div className="text-sm text-muted-foreground">Mes</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">No hay alertas pendientes</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen por hotel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Asignaciones por Hotel
          </CardTitle>
          <CardDescription>Distribución de asignaciones en el mes actual</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {hotelSummary.map((hotel, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{hotel.name}</span>
                    <span className="font-medium">{hotel.count} asignaciones</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{
                        width: `${(hotel.count / Math.max(...hotelSummary.map((h) => h.count))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empleados activos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Empleados Activos
          </CardTitle>
          <CardDescription>Empleados con asignaciones en la semana actual</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Diego", "Tucu", "David"].map((name, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="font-medium">{name}</div>
                    <div className="text-sm text-muted-foreground">Mantenimiento</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
