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

// Lista de hoteles
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
