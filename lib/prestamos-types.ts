// Tipos principales
export interface Prestamo {
  id: string
  fecha: string
  hotel_origen: string
  hotel_destino: string
  monto: number
  concepto: string
  responsable: string
  estado: "pendiente" | "pagado" | "cancelado"
  notas?: string
  created_at: string
  updated_at: string
  producto?: string
  cantidad?: number
}

export interface PrestamoInput {
  fecha?: string
  hotel_origen: string
  hotel_destino: string
  monto: number
  concepto: string
  responsable: string
  notas?: string
  producto?: string
  cantidad?: number
}

export interface PrestamoRapidoType {
  tipo: "prestamo" | "devolucion"
  hotel1: string
  hotel2: string
  monto: number
  concepto?: string
  responsable: string
  producto?: string
  cantidad?: number
}

export interface RelacionHotel {
  hotel: string
  monto: number
  transacciones: number
}

export interface BalanceHotel {
  hotel: string
  balance: number
  acreedor: number
  deudor: number
  transacciones: number
  acreedorDe: RelacionHotel[]
  deudorDe: RelacionHotel[]
}

export interface FiltrosPrestamos {
  hotel?: string
  hotelOrigen?: string
  hotelDestino?: string
  estado?: Prestamo["estado"]
  responsable?: string
  fechaInicio?: string
  fechaFin?: string
  montoMinimo?: number
  montoMaximo?: number
  busqueda?: string
}

export interface EstadisticasPrestamos {
  totalPrestamos: number
  montoTotal: number
  prestamosActivos: number
  prestamosPagados: number
  prestamosCancelados: number
  promedioMonto: number
  hotelMayorAcreedor: string
  hotelMayorDeudor: string
}

// Constantes actualizadas
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
]

export const RESPONSABLES = [
  "Nicolás Cannata",
  "Diego Pili",
  "Juan Prey",
  "Admin",
  "Gerente",
  "Recepción",
  "Contabilidad",
]

export const ESTADOS_PRESTAMO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "cancelado", label: "Cancelado" },
] as const
