// Tipos para la gestión de empleados
export interface Employee {
  id: number
  name: string
  role: string
  daily_rate: number
  created_at?: string
}

export interface EmployeeAssignment {
  id: number
  employee_id: number
  hotel_name: string
  assignment_date: string
  daily_rate_used: number // Nueva columna para guardar la tarifa del día
  notes?: string
  created_at?: string
  created_by?: string
  // Campos calculados para la UI
  employee_name?: string
}

export interface EmployeePayment {
  id: number
  employee_id: number
  amount: number
  payment_date: string
  week_start?: string
  week_end?: string
  status: "pendiente" | "pagado"
  notes?: string
  created_at?: string
  created_by?: string
  // Campos calculados para la UI
  employee_name?: string
}

// Tipo para los eventos del calendario
export interface CalendarEvent {
  id: number
  title: string
  start: string
  end?: string
  allDay: boolean
  hotel: string
  employeeId: number
  notes?: string
}

// Lista COMPLETA de hoteles - ACTUALIZADA
export const HOTELS = [
  "Jaguel",
  "Monaco",
  "Mallak",
  "Argentina",
  "Falkner",
  "Stromboli",
  "San Miguel",
  "Colores",
  "Puntarenas",
  "Tupe",
  "Munich",
  "Tiburones",
  "Barlovento",
  "Carama",
]

// Códigos y colores para todos los hoteles
export const HOTEL_CODES: Record<string, string> = {
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

export const HOTEL_COLORS: Record<string, string> = {
  Jaguel: "bg-red-600 text-white",
  Monaco: "bg-blue-600 text-white",
  Mallak: "bg-green-600 text-white",
  Argentina: "bg-purple-600 text-white",
  Falkner: "bg-yellow-600 text-black",
  Stromboli: "bg-pink-600 text-white",
  "San Miguel": "bg-indigo-600 text-white",
  Colores: "bg-orange-600 text-white",
  Puntarenas: "bg-teal-600 text-white",
  Tupe: "bg-cyan-600 text-white",
  Munich: "bg-amber-600 text-black",
  Tiburones: "bg-slate-600 text-white",
  Barlovento: "bg-emerald-600 text-white",
  Carama: "bg-violet-600 text-white",
}

export const HOTEL_LIGHT_COLORS: Record<string, string> = {
  Jaguel: "bg-red-100 text-red-800 border-red-300",
  Monaco: "bg-blue-100 text-blue-800 border-blue-300",
  Mallak: "bg-green-100 text-green-800 border-green-300",
  Argentina: "bg-purple-100 text-purple-800 border-purple-300",
  Falkner: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Stromboli: "bg-pink-100 text-pink-800 border-pink-300",
  "San Miguel": "bg-indigo-100 text-indigo-800 border-indigo-300",
  Colores: "bg-orange-100 text-orange-800 border-orange-300",
  Puntarenas: "bg-teal-100 text-teal-800 border-teal-300",
  Tupe: "bg-cyan-100 text-cyan-800 border-cyan-300",
  Munich: "bg-amber-100 text-amber-800 border-amber-300",
  Tiburones: "bg-slate-100 text-slate-800 border-slate-300",
  Barlovento: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Carama: "bg-violet-100 text-violet-800 border-violet-300",
}

// Funciones helper
export const getHotelCode = (hotelName: string): string => {
  return HOTEL_CODES[hotelName] || hotelName.substring(0, 2).toUpperCase()
}

export const getHotelColor = (hotelName: string): string => {
  return HOTEL_COLORS[hotelName] || "bg-gray-600 text-white"
}

export const getHotelLightColor = (hotelName: string): string => {
  return HOTEL_LIGHT_COLORS[hotelName] || "bg-gray-100 text-gray-800 border-gray-300"
}
