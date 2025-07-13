import type {
  Prestamo,
  PrestamoInput,
  PrestamoRapidoType,
  BalanceHotel,
  RelacionHotel,
  FiltrosPrestamos,
  EstadisticasPrestamos,
} from "./prestamos-types"
import { HOTELES, RESPONSABLES } from "./prestamos-types"

// Clave para localStorage
const PRESTAMOS_KEY = "prestamos_data"

// Función para generar ID único
function generarId(): string {
  return `prestamo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Función para obtener todos los préstamos del localStorage
function obtenerPrestamosLocal(): Prestamo[] {
  if (typeof window === "undefined") return []

  try {
    const data = localStorage.getItem(PRESTAMOS_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error al obtener préstamos del localStorage:", error)
    return []
  }
}

// Función para guardar préstamos en localStorage
function guardarPrestamosLocal(prestamos: Prestamo[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(PRESTAMOS_KEY, JSON.stringify(prestamos))
  } catch (error) {
    console.error("Error al guardar préstamos en localStorage:", error)
  }
}

// Función para formatear fecha
function formatearFecha(fecha?: string): string {
  const date = fecha ? new Date(fecha) : new Date()
  return date.toISOString().split("T")[0]
}

// Función para formatear monto
export function formatearMonto(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto)
}

// EXPORTACIONES PRINCIPALES

export async function obtenerPrestamos(): Promise<Prestamo[]> {
  return obtenerPrestamosLocal()
}

export async function obtenerPrestamoPorId(id: string): Promise<Prestamo | null> {
  const prestamos = obtenerPrestamosLocal()
  return prestamos.find((p) => p.id === id) || null
}

export async function crearPrestamo(input: PrestamoInput): Promise<Prestamo | null> {
  try {
    const prestamos = obtenerPrestamosLocal()

    const nuevoPrestamo: Prestamo = {
      id: generarId(),
      fecha: formatearFecha(input.fecha),
      hotel_origen: input.hotel_origen,
      hotel_destino: input.hotel_destino,
      monto: input.monto,
      concepto: input.concepto,
      responsable: input.responsable,
      estado: "pendiente",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notas: input.notas,
    }

    prestamos.push(nuevoPrestamo)
    guardarPrestamosLocal(prestamos)

    return nuevoPrestamo
  } catch (error) {
    console.error("Error al crear préstamo:", error)
    return null
  }
}

export async function actualizarPrestamo(id: string, cambios: Partial<Prestamo>): Promise<Prestamo | null> {
  try {
    const prestamos = obtenerPrestamosLocal()
    const indice = prestamos.findIndex((p) => p.id === id)

    if (indice === -1) {
      return null
    }

    prestamos[indice] = {
      ...prestamos[indice],
      ...cambios,
      updated_at: new Date().toISOString(),
    }

    guardarPrestamosLocal(prestamos)
    return prestamos[indice]
  } catch (error) {
    console.error("Error al actualizar préstamo:", error)
    return null
  }
}

export async function eliminarPrestamo(id: string): Promise<boolean> {
  try {
    const prestamos = obtenerPrestamosLocal()
    const prestamosFiltrados = prestamos.filter((p) => p.id !== id)

    if (prestamosFiltrados.length === prestamos.length) {
      return false // No se encontró el préstamo
    }

    guardarPrestamosLocal(prestamosFiltrados)
    return true
  } catch (error) {
    console.error("Error al eliminar préstamo:", error)
    return false
  }
}

export async function procesarIngresoRapido(input: PrestamoRapidoType): Promise<Prestamo | null> {
  try {
    let hotel_origen: string
    let hotel_destino: string
    let concepto: string

    if (input.tipo === "prestamo") {
      hotel_origen = input.hotel1
      hotel_destino = input.hotel2
      concepto = input.concepto || `Préstamo de ${input.hotel1} a ${input.hotel2}`
    } else {
      // Es una devolución
      hotel_origen = input.hotel2
      hotel_destino = input.hotel1
      concepto = input.concepto || `Devolución de ${input.hotel2} a ${input.hotel1}`
    }

    const prestamoInput: PrestamoInput = {
      hotel_origen,
      hotel_destino,
      monto: input.monto,
      concepto,
      responsable: input.responsable,
    }

    return await crearPrestamo(prestamoInput)
  } catch (error) {
    console.error("Error al procesar ingreso rápido:", error)
    return null
  }
}

export async function obtenerPrestamosFiltrados(filtros: FiltrosPrestamos): Promise<Prestamo[]> {
  try {
    let prestamos = obtenerPrestamosLocal()

    // Aplicar filtros
    if (filtros.hotelOrigen) {
      prestamos = prestamos.filter((p) => p.hotel_origen === filtros.hotelOrigen)
    }

    if (filtros.hotelDestino) {
      prestamos = prestamos.filter((p) => p.hotel_destino === filtros.hotelDestino)
    }

    if (filtros.hotel) {
      prestamos = prestamos.filter((p) => p.hotel_origen === filtros.hotel || p.hotel_destino === filtros.hotel)
    }

    if (filtros.estado) {
      prestamos = prestamos.filter((p) => p.estado === filtros.estado)
    }

    if (filtros.responsable) {
      prestamos = prestamos.filter((p) => p.responsable === filtros.responsable)
    }

    if (filtros.fechaInicio) {
      prestamos = prestamos.filter((p) => p.fecha >= filtros.fechaInicio!)
    }

    if (filtros.fechaFin) {
      prestamos = prestamos.filter((p) => p.fecha <= filtros.fechaFin!)
    }

    if (filtros.montoMinimo) {
      prestamos = prestamos.filter((p) => p.monto >= filtros.montoMinimo!)
    }

    if (filtros.montoMaximo) {
      prestamos = prestamos.filter((p) => p.monto <= filtros.montoMaximo!)
    }

    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase()
      prestamos = prestamos.filter(
        (p) =>
          p.concepto.toLowerCase().includes(busqueda) ||
          (p.notas && p.notas.toLowerCase().includes(busqueda)) ||
          p.hotel_origen.toLowerCase().includes(busqueda) ||
          p.hotel_destino.toLowerCase().includes(busqueda),
      )
    }

    return prestamos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  } catch (error) {
    console.error("Error al obtener préstamos filtrados:", error)
    return []
  }
}

export async function obtenerHoteles(): Promise<string[]> {
  try {
    const prestamos = obtenerPrestamosLocal()
    const hoteles = new Set<string>()

    prestamos.forEach((prestamo) => {
      hoteles.add(prestamo.hotel_origen)
      hoteles.add(prestamo.hotel_destino)
    })

    // Agregar hoteles predefinidos
    HOTELES.forEach((hotel) => hoteles.add(hotel))

    return Array.from(hoteles).sort()
  } catch (error) {
    console.error("Error al obtener hoteles:", error)
    return HOTELES
  }
}

export async function obtenerResponsables(): Promise<string[]> {
  try {
    const prestamos = obtenerPrestamosLocal()
    const responsables = new Set<string>()

    prestamos.forEach((prestamo) => {
      responsables.add(prestamo.responsable)
    })

    // Agregar responsables predefinidos
    RESPONSABLES.forEach((resp) => responsables.add(resp))

    return Array.from(responsables).sort()
  } catch (error) {
    console.error("Error al obtener responsables:", error)
    return RESPONSABLES
  }
}

// Función auxiliar para actualizar relaciones
function actualizarRelacion(relaciones: RelacionHotel[], hotel: string, monto: number): void {
  const relacion = relaciones.find((r) => r.hotel === hotel)
  if (relacion) {
    relacion.monto += monto
    relacion.transacciones++
  } else {
    relaciones.push({
      hotel,
      monto,
      transacciones: 1,
    })
  }
}

export async function obtenerBalanceHoteles(): Promise<BalanceHotel[]> {
  try {
    const prestamos = obtenerPrestamosLocal()
    const balanceMap = new Map<string, BalanceHotel>()

    // Inicializar balance para todos los hoteles conocidos
    const todosLosHoteles = new Set<string>()
    prestamos.forEach((prestamo) => {
      todosLosHoteles.add(prestamo.hotel_origen)
      todosLosHoteles.add(prestamo.hotel_destino)
    })

    // Agregar hoteles predefinidos
    HOTELES.forEach((hotel) => todosLosHoteles.add(hotel))

    todosLosHoteles.forEach((hotel) => {
      balanceMap.set(hotel, {
        hotel,
        acreedor: 0,
        deudor: 0,
        balance: 0,
        transacciones: 0,
        acreedorDe: [],
        deudorDe: [],
      })
    })

    // Procesar cada préstamo
    prestamos.forEach((prestamo) => {
      if (prestamo.estado === "cancelado") return

      const hotelOrigen = prestamo.hotel_origen
      const hotelDestino = prestamo.hotel_destino
      const monto = prestamo.monto

      const balanceOrigen = balanceMap.get(hotelOrigen)
      const balanceDestino = balanceMap.get(hotelDestino)

      if (balanceOrigen && balanceDestino) {
        // Actualizar balance del hotel origen (es acreedor)
        balanceOrigen.acreedor += monto
        balanceOrigen.transacciones++
        actualizarRelacion(balanceOrigen.acreedorDe, hotelDestino, monto)

        // Actualizar balance del hotel destino (es deudor)
        balanceDestino.deudor += monto
        balanceDestino.transacciones++
        actualizarRelacion(balanceDestino.deudorDe, hotelOrigen, monto)
      }
    })

    // Calcular balance neto y filtrar relaciones vacías
    const resultado = Array.from(balanceMap.values()).map((balance) => {
      balance.balance = balance.acreedor - balance.deudor

      // Filtrar relaciones con monto 0
      balance.acreedorDe = balance.acreedorDe.filter((r) => r.monto > 0)
      balance.deudorDe = balance.deudorDe.filter((r) => r.monto > 0)

      // Ordenar relaciones por monto descendente
      balance.acreedorDe.sort((a, b) => b.monto - a.monto)
      balance.deudorDe.sort((a, b) => b.monto - a.monto)

      return balance
    })

    // Filtrar hoteles sin transacciones y ordenar por balance descendente
    return resultado.filter((balance) => balance.transacciones > 0).sort((a, b) => b.balance - a.balance)
  } catch (error) {
    console.error("Error al obtener balance de hoteles:", error)
    return []
  }
}

export async function obtenerEstadisticas(): Promise<EstadisticasPrestamos> {
  try {
    const prestamos = obtenerPrestamosLocal()
    const balance = await obtenerBalanceHoteles()

    const totalPrestamos = prestamos.length
    const montoTotal = prestamos.reduce((sum, p) => sum + p.monto, 0)
    const prestamosActivos = prestamos.filter((p) => p.estado === "pendiente").length
    const prestamosPagados = prestamos.filter((p) => p.estado === "pagado").length
    const prestamosCancelados = prestamos.filter((p) => p.estado === "cancelado").length
    const promedioMonto = totalPrestamos > 0 ? montoTotal / totalPrestamos : 0

    const hotelMayorAcreedor = balance.length > 0 ? balance[0].hotel : ""
    const hotelMayorDeudor = balance.length > 0 ? balance.sort((a, b) => a.balance - b.balance)[0].hotel : ""

    return {
      totalPrestamos,
      montoTotal,
      prestamosActivos,
      prestamosPagados,
      prestamosCancelados,
      promedioMonto,
      hotelMayorAcreedor,
      hotelMayorDeudor,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return {
      totalPrestamos: 0,
      montoTotal: 0,
      prestamosActivos: 0,
      prestamosPagados: 0,
      prestamosCancelados: 0,
      promedioMonto: 0,
      hotelMayorAcreedor: "",
      hotelMayorDeudor: "",
    }
  }
}

export async function exportarDatos(): Promise<string> {
  try {
    const prestamos = obtenerPrestamosLocal()
    const balance = await obtenerBalanceHoteles()
    const estadisticas = await obtenerEstadisticas()

    const datos = {
      prestamos,
      balance,
      estadisticas,
      fechaExportacion: new Date().toISOString(),
      version: "1.0",
    }

    return JSON.stringify(datos, null, 2)
  } catch (error) {
    console.error("Error al exportar datos:", error)
    return "{}"
  }
}

export async function importarDatos(datosJson: string): Promise<boolean> {
  try {
    const datos = JSON.parse(datosJson)

    if (datos.prestamos && Array.isArray(datos.prestamos)) {
      guardarPrestamosLocal(datos.prestamos)
      return true
    }

    return false
  } catch (error) {
    console.error("Error al importar datos:", error)
    return false
  }
}

// Función para limpiar datos (útil para desarrollo)
export function limpiarDatos(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PRESTAMOS_KEY)
  }
}

// Función para inicializar datos de prueba
export function inicializarDatosPrueba(): void {
  const prestamos: Prestamo[] = [
    {
      id: "prestamo_1",
      fecha: "2024-01-15",
      hotel_origen: "Argentina",
      hotel_destino: "Mallak",
      monto: 50000,
      concepto: "Préstamo para reparaciones",
      responsable: "Nicolás Cannata",
      estado: "pendiente",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "prestamo_2",
      fecha: "2024-01-20",
      hotel_origen: "Mallak",
      hotel_destino: "Monaco",
      monto: 30000,
      concepto: "Préstamo para equipamiento",
      responsable: "Diego Pili",
      estado: "pendiente",
      created_at: "2024-01-20T14:30:00Z",
      updated_at: "2024-01-20T14:30:00Z",
    },
    {
      id: "prestamo_3",
      fecha: "2024-01-25",
      hotel_origen: "Jaguel",
      hotel_destino: "Argentina",
      monto: 75000,
      concepto: "Préstamo para renovación",
      responsable: "Juan Prey",
      estado: "pagado",
      created_at: "2024-01-25T09:15:00Z",
      updated_at: "2024-01-25T09:15:00Z",
    },
  ]

  guardarPrestamosLocal(prestamos)
}
