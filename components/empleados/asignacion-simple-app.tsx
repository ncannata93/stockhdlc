"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Building2, Check, ArrowLeft, LogOut, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { addEmployeeAssignment, getEmployees, getHotels } from "@/lib/employee-db"
import type { Employee, Hotel } from "@/lib/employee-types"

type Step = "date" | "employee" | "hotels" | "confirm" | "success"

export default function AsignacionSimpleApp() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>("date")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedHotels, setSelectedHotels] = useState<Hotel[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [employeesData, hotelsData] = await Promise.all([getEmployees(), getHotels()])
      setEmployees(employeesData)
      setHotels(hotelsData)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleHotelToggle = (hotel: Hotel) => {
    setSelectedHotels((prev) => {
      const exists = prev.find((h) => h.id === hotel.id)
      if (exists) {
        return prev.filter((h) => h.id !== hotel.id)
      } else {
        return [...prev, hotel]
      }
    })
  }

  const handleSubmit = async () => {
    if (!selectedEmployee || selectedHotels.length === 0) return

    setLoading(true)
    try {
      const dailyRate = selectedEmployee.daily_rate / selectedHotels.length

      for (const hotel of selectedHotels) {
        await addEmployeeAssignment({
          employee_id: selectedEmployee.id,
          hotel_id: hotel.id,
          date: selectedDate,
          daily_rate: dailyRate,
          notes: selectedHotels.length > 1 ? `Tarifa dividida entre ${selectedHotels.length} hoteles` : undefined,
        })
      }

      setStep("success")
    } catch (error) {
      console.error("Error creating assignments:", error)
      alert("Error al crear las asignaciones")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep("date")
    setSelectedDate(new Date().toISOString().split("T")[0])
    setSelectedEmployee(null)
    setSelectedHotels([])
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const getStepTitle = () => {
    switch (step) {
      case "date":
        return "Seleccionar Fecha"
      case "employee":
        return "Seleccionar Empleado"
      case "hotels":
        return "Seleccionar Hoteles"
      case "confirm":
        return "Confirmar Asignación"
      case "success":
        return "¡Asignación Creada!"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header tipo app */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img src="/logo-hoteles-costa.svg" alt="Hoteles de la Costa" className="h-8 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Asignar Empleado</h1>
              <p className="text-xs text-gray-600">Asignación rápida</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <Badge variant="secondary" className="hidden sm:flex">
                <User className="h-3 w-3 mr-1" />
                {user.email?.split("@")[0]}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Salir</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container max-w-md mx-auto p-4">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-gray-900">{getStepTitle()}</CardTitle>
            <div className="flex justify-center mt-2">
              <div className="flex gap-2">
                {["date", "employee", "hotels", "confirm"].map((s, index) => (
                  <div
                    key={s}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      step === s
                        ? "bg-blue-600"
                        : ["date", "employee", "hotels", "confirm"].indexOf(step) > index
                          ? "bg-green-500"
                          : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === "date" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Calendar className="h-4 w-4" />
                  Paso 1 de 4
                </div>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <Button
                  onClick={() => setStep("employee")}
                  className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Continuar
                </Button>
              </div>
            )}

            {step === "employee" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    Paso 2 de 4
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep("date")}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {employees.map((employee) => (
                    <Button
                      key={employee.id}
                      variant={selectedEmployee?.id === employee.id ? "default" : "outline"}
                      className="w-full justify-start p-4 h-auto"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm opacity-70">{employee.role}</div>
                        <div className="text-sm opacity-70">${employee.daily_rate?.toLocaleString()}/día</div>
                      </div>
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => setStep("hotels")}
                  disabled={!selectedEmployee}
                  className="w-full py-4 text-lg"
                  size="lg"
                >
                  Continuar
                </Button>
              </div>
            )}

            {step === "hotels" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    Paso 3 de 4
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep("employee")}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-sm text-gray-600 mb-4">Selecciona uno o más hoteles (puedes elegir varios):</p>

                {selectedHotels.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Hoteles seleccionados:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedHotels.map((hotel) => (
                        <Badge key={hotel.id} variant="default" className="flex items-center gap-1">
                          {hotel.name}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => handleHotelToggle(hotel)} />
                        </Badge>
                      ))}
                    </div>
                    {selectedEmployee && (
                      <p className="text-xs text-gray-500 mt-2">
                        Tarifa por hotel: ${(selectedEmployee.daily_rate / selectedHotels.length).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {hotels.map((hotel) => {
                    const isSelected = selectedHotels.find((h) => h.id === hotel.id)
                    return (
                      <Button
                        key={hotel.id}
                        variant={isSelected ? "default" : "outline"}
                        className="w-full justify-between p-4 h-auto"
                        onClick={() => handleHotelToggle(hotel)}
                      >
                        <span>{hotel.name}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  onClick={() => setStep("confirm")}
                  disabled={selectedHotels.length === 0}
                  className="w-full py-4 text-lg"
                  size="lg"
                >
                  Continuar
                </Button>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4" />
                    Paso 4 de 4
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep("hotels")}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="font-medium">Fecha:</span> {selectedDate}
                  </div>
                  <div>
                    <span className="font-medium">Empleado:</span> {selectedEmployee?.name}
                  </div>
                  <div>
                    <span className="font-medium">Hoteles:</span>
                    <div className="mt-1">
                      {selectedHotels.map((hotel) => (
                        <div key={hotel.id} className="text-sm">
                          • {hotel.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Tarifa por hotel:</span> $
                    {selectedEmployee && (selectedEmployee.daily_rate / selectedHotels.length).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Total asignaciones:</span> {selectedHotels.length}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-4 text-lg bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {loading ? "Creando..." : "Crear Asignaciones"}
                </Button>
              </div>
            )}

            {step === "success" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-600" />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">¡Asignaciones creadas exitosamente!</h3>
                  <p className="text-sm text-gray-600">
                    Se crearon {selectedHotels.length} asignaciones para {selectedEmployee?.name}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button onClick={resetForm} className="w-full py-4 text-lg" size="lg">
                    Nueva Asignación
                  </Button>

                  <Button variant="outline" onClick={() => router.push("/empleados")} className="w-full">
                    Ver Empleados
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
