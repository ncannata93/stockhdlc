export interface Prestamo {
  id: string
  responsable: string
  hotel_origen: string
  hotel_destino: string
  producto: string
  cantidad: number
  valor: number
  fecha: string
  notas?: string
  created_at?: string
  updated_at?: string
}

export interface PrestamoFormData {
  responsable: string
  hotel_origen: string
  hotel_destino: string
  producto: string
  cantidad: number
  valor: number
  notas?: string
}

export const HOTELES = [
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
  "Juan Manuel",
  "Nacho",
  "Diego",
] as const

export const RESPONSABLES = ["Nicolas Cannata", "Juan Manuel", "Nacho", "Diego", "Administrador", "Gerente"] as const

export const ESTADOS_PRESTAMO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "cancelado", label: "Cancelado" },
] as const

export type Hotel = (typeof HOTELES)[number]
export type Responsable = (typeof RESPONSABLES)[number]
export type EstadoPrestamo = (typeof ESTADOS_PRESTAMO)[number]["value"]
