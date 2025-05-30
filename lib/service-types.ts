export interface Hotel {
  id: string
  name: string
  code: string
  active: boolean
  created_at?: string
}

export interface Service {
  id: string
  name: string // Ej: "Electricidad - Edenor", "Gas - Metrogas"
  description?: string // Descripción opcional adicional
  category: ServiceCategory
  account_number?: string
  hotel_id: string
  hotel_name?: string // Para mostrar en la interfaz
  average_amount?: number // Monto promedio mensual
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ServicePayment {
  id: string
  service_id: string
  service_name: string
  hotel_id: string
  hotel_name?: string // Para mostrar en la interfaz
  month: number // 1-12
  year: number
  amount: number
  due_date: string
  payment_date?: string
  status: PaymentStatus
  invoice_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type ServiceCategory =
  | "electricidad"
  | "gas"
  | "agua"
  | "telefono"
  | "internet"
  | "cable"
  | "seguridad"
  | "limpieza"
  | "mantenimiento"
  | "seguros"
  | "impuestos"
  | "otros"

export type PaymentStatus = "pendiente" | "abonado" | "vencido"

export const SERVICE_CATEGORIES = {
  electricidad: "Electricidad",
  gas: "Gas",
  agua: "Agua",
  telefono: "Teléfono",
  internet: "Internet",
  cable: "Cable/TV",
  seguridad: "Seguridad",
  limpieza: "Limpieza",
  mantenimiento: "Mantenimiento",
  seguros: "Seguros",
  impuestos: "Impuestos",
  otros: "Otros",
}

export const PAYMENT_STATUS = {
  pendiente: "Pendiente",
  abonado: "Abonado",
  vencido: "Vencido",
}

export const MONTHS = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
}

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

// Ejemplos de nombres de servicios más descriptivos:
export const SERVICE_NAME_EXAMPLES = {
  electricidad: ["Electricidad - Edenor", "Electricidad - Edesur"],
  gas: ["Gas - Metrogas", "Gas - Naturgy"],
  agua: ["Agua - AySA", "Agua - ABSA"],
  telefono: ["Teléfono - Telecom", "Teléfono - Movistar"],
  internet: ["Internet - Fibertel", "Internet - Speedy"],
  cable: ["Cable - Cablevisión", "Cable - DirecTV"],
  seguridad: ["Seguridad - Prosegur", "Seguridad - Securitas"],
  limpieza: ["Limpieza - Empresa Local"],
  mantenimiento: ["Mantenimiento - Técnico Juan"],
  seguros: ["Seguro - La Caja", "Seguro - Sancor"],
  impuestos: ["ABL", "Ingresos Brutos"],
  otros: ["Otros servicios"],
}
