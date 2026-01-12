import type {
  Prestamo,
  PrestamoInput,
  BalanceHotel,
  RelacionHotel,
  FiltrosPrestamos,
  EstadisticasPrestamos,
} from "./prestamos-types"
import { HOTELES } from "./prestamos-types"

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

// Función para formatear monto - ARREGLADA
export function formatearMonto(monto: number | string): string {
  // Convertir a número si es string
  const numero = typeof monto === "string" ? Number.parseFloat(monto) : monto

  // Verificar que sea un número válido
  if (isNaN(numero)) {
    return "$ 0"
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numero)
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
      monto: Number(input.monto), // Asegurar que sea número
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

    // Asegurar que el monto sea número si se está actualizando
    if (cambios.monto !== undefined) {
      cambios.monto = Number(cambios.monto)
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

export function obtenerPrestamosFiltrados(filtros: FiltrosPrestamos): Prestamo[] {
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
      prestamos = prestamos.filter((p) => Number(p.monto) >= filtros.montoMinimo!)
    }

    if (filtros.montoMaximo) {
      prestamos = prestamos.filter((p) => Number(p.monto) <= filtros.montoMaximo!)
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

export function obtenerHoteles(): string[] {
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

export function obtenerResponsables(): string[] {
  try {
    const prestamos = obtenerPrestamosLocal()
    const responsables = new Set<string>()

    prestamos.forEach((prestamo) => {
      responsables.add(prestamo.responsable)
    })

    return Array.from(responsables).sort()
  } catch (error) {
    console.error("Error al obtener responsables:", error)
    return []
  }
}

// Función auxiliar para actualizar relaciones con compensación
function actualizarRelacionConCompensacion(
  relaciones: RelacionHotel[],
  hotel: string,
  monto: number,
  relacionesOpuestas: RelacionHotel[],
): void {
  // Buscar si existe una relación opuesta
  const relacionOpuesta = relacionesOpuestas.find((r) => r.hotel === hotel)

  if (relacionOpuesta) {
    // Hay compensación - calcular el neto
    const montoNeto = monto - relacionOpuesta.monto

    if (montoNeto > 0) {
      // Queda saldo a favor de esta relación
      const relacion = relaciones.find((r) => r.hotel === hotel)
      if (relacion) {
        relacion.monto = montoNeto
        relacion.transacciones++
      } else {
        relaciones.push({
          hotel,
          monto: montoNeto,
          transacciones: 1,
        })
      }

      // Eliminar la relación opuesta ya que fue compensada
      const indiceOpuesto = relacionesOpuestas.findIndex((r) => r.hotel === hotel)
      if (indiceOpuesto !== -1) {
        relacionesOpuestas.splice(indiceOpuesto, 1)
      }
    } else if (montoNeto < 0) {
      // El saldo queda a favor de la relación opuesta
      relacionOpuesta.monto = Math.abs(montoNeto)
      relacionOpuesta.transacciones++
    } else {
      // Se compensan exactamente - eliminar ambas relaciones
      const indiceOpuesto = relacionesOpuestas.findIndex((r) => r.hotel === hotel)
      if (indiceOpuesto !== -1) {
        relacionesOpuestas.splice(indiceOpuesto, 1)
      }
    }
  } else {
    // No hay compensación - agregar normalmente
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

    // Primera pasada: calcular totales brutos
    const relacionesBrutas = new Map<string, { acreedorDe: Map<string, number>; deudorDe: Map<string, number> }>()

    prestamos.forEach((prestamo) => {
      if (prestamo.estado === "cancelado") return

      const hotelOrigen = prestamo.hotel_origen
      const hotelDestino = prestamo.hotel_destino
      const monto = Number(prestamo.valor || prestamo.monto)

      if (isNaN(monto)) {
        console.warn(`Monto inválido en préstamo ${prestamo.id}:`, prestamo.valor || prestamo.monto)
        return
      }

      // Inicializar mapas si no existen
      if (!relacionesBrutas.has(hotelOrigen)) {
        relacionesBrutas.set(hotelOrigen, { acreedorDe: new Map(), deudorDe: new Map() })
      }
      if (!relacionesBrutas.has(hotelDestino)) {
        relacionesBrutas.set(hotelDestino, { acreedorDe: new Map(), deudorDe: new Map() })
      }

      // Acumular relaciones brutas
      const relacionOrigen = relacionesBrutas.get(hotelOrigen)!
      const relacionDestino = relacionesBrutas.get(hotelDestino)!

      // Hotel origen es acreedor de hotel destino
      const montoActualAcreedor = relacionOrigen.acreedorDe.get(hotelDestino) || 0
      relacionOrigen.acreedorDe.set(hotelDestino, montoActualAcreedor + monto)

      // Hotel destino es deudor de hotel origen
      const montoActualDeudor = relacionDestino.deudorDe.get(hotelOrigen) || 0
      relacionDestino.deudorDe.set(hotelOrigen, montoActualDeudor + monto)
    })

    // Segunda pasada: aplicar compensación y calcular balances netos
    relacionesBrutas.forEach((relaciones, hotel) => {
      const balance = balanceMap.get(hotel)!

      // Procesar relaciones como acreedor con compensación
      relaciones.acreedorDe.forEach((monto, otroHotel) => {
        const relacionesOtroHotel = relacionesBrutas.get(otroHotel)
        const montoQueLeDebenAEsteHotel = relacionesOtroHotel?.acreedorDe.get(hotel) || 0

        // Calcular el neto
        const montoNeto = monto - montoQueLeDebenAEsteHotel

        if (montoNeto > 0) {
          // Este hotel es acreedor neto
          balance.acreedor += montoNeto
          balance.acreedorDe.push({
            hotel: otroHotel,
            monto: montoNeto,
            transacciones: 1, // Simplificado para el ejemplo
          })
        } else if (montoNeto < 0) {
          // Este hotel es deudor neto
          balance.deudor += Math.abs(montoNeto)
          balance.deudorDe.push({
            hotel: otroHotel,
            monto: Math.abs(montoNeto),
            transacciones: 1,
          })
        }
        // Si montoNeto === 0, se compensan exactamente y no se agrega nada
      })

      // Contar transacciones totales
      balance.transacciones = prestamos.filter((p) => p.hotel_origen === hotel || p.hotel_destino === hotel).length
    })

    // Calcular balance neto final
    const resultado = Array.from(balanceMap.values()).map((balance) => {
      balance.balance = balance.acreedor - balance.deudor

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
    const montoTotal = prestamos.reduce((sum, p) => sum + Number(p.valor || p.monto || 0), 0)
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
      // Asegurar que todos los montos sean números
      const prestamosCorregidos = datos.prestamos.map((p: any) => ({
        ...p,
        monto: Number(p.monto || p.valor || 0),
        valor: Number(p.valor || p.monto || 0),
      }))

      guardarPrestamosLocal(prestamosCorregidos)
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
