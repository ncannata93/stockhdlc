import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface PrestamoInput {
  fecha?: string
  responsable: string
  hotel_origen: string
  hotel_destino: string
  producto: string
  cantidad: string
  valor: number | string
  notas?: string
  estado: "pendiente" | "pagado" | "cancelado"
}

export interface Prestamo extends PrestamoInput {
  id: string
  created_at: string
  updated_at: string
  valor: number
}

export interface BalanceHotel {
  hotel: string
  acreedor: number
  deudor: number
  balance: number
  transacciones: number
  acreedorDe: { hotel: string; monto: number }[]
  deudorDe: { hotel: string; monto: number }[]
}

export interface EstadisticasPrestamos {
  totalPrestamos: number
  montoTotal: number
  promedioMonto: number
  hotelMayorAcreedor: string
  hotelMayorDeudor: string
}

export interface FiltrosPrestamos {
  hotel?: string
  estado?: string
  responsable?: string
  busqueda?: string
}

export interface ResultadoMasivo {
  exitosos: number
  errores: string[]
}

// Función para formatear montos
export const formatearMonto = (valor: number | string): string => {
  const numero = typeof valor === "string" ? Number.parseFloat(valor) : valor
  if (isNaN(numero)) return "$0"
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numero)
}

// Verificar conexión a Supabase
export const verificarConexion = async (): Promise<{ conectado: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.from("prestamos").select("count").limit(1)
    if (error) {
      console.error("Error de conexión:", error)
      return { conectado: false, error: error.message }
    }
    return { conectado: true }
  } catch (error) {
    console.error("Error de conexión:", error)
    return { conectado: false, error: "Error de red" }
  }
}

// Verificar si la tabla prestamos existe
export const verificarTablaPrestamons = async (): Promise<{ existe: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.from("prestamos").select("id").limit(1)
    if (error && error.code === "PGRST116") {
      return { existe: false, error: "Tabla no existe" }
    }
    return { existe: true }
  } catch (error) {
    console.error("Error al verificar tabla:", error)
    return { existe: false, error: "Error de verificación" }
  }
}

// Crear un préstamo individual
export const crearPrestamo = async (prestamo: PrestamoInput): Promise<Prestamo | null> => {
  try {
    const valor =
      typeof prestamo.valor === "string" ? Number.parseFloat(prestamo.valor.replace(/[^0-9.-]/g, "")) : prestamo.valor

    const { data, error } = await supabase
      .from("prestamos")
      .insert([
        {
          fecha: prestamo.fecha || new Date().toISOString().split("T")[0],
          responsable: prestamo.responsable,
          hotel_origen: prestamo.hotel_origen,
          hotel_destino: prestamo.hotel_destino,
          producto: prestamo.producto,
          cantidad: prestamo.cantidad,
          valor: valor,
          notas: prestamo.notas || "",
          estado: prestamo.estado || "pendiente",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error al crear préstamo:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error al crear préstamo:", error)
    throw error
  }
}

// Crear múltiples préstamos
export const crearPrestamosMasivos = async (prestamos: PrestamoInput[]): Promise<ResultadoMasivo> => {
  const resultado: ResultadoMasivo = { exitosos: 0, errores: [] }

  for (const prestamo of prestamos) {
    try {
      await crearPrestamo(prestamo)
      resultado.exitosos++
    } catch (error) {
      resultado.errores.push(`Error en préstamo ${prestamo.responsable}: ${error}`)
    }
  }

  return resultado
}

// Obtener todos los préstamos
export const obtenerPrestamos = async (): Promise<Prestamo[]> => {
  try {
    const { data, error } = await supabase.from("prestamos").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener préstamos:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error al obtener préstamos:", error)
    throw error
  }
}

// Obtener préstamos con filtros
export const obtenerPrestamosFiltrados = async (filtros: FiltrosPrestamos): Promise<Prestamo[]> => {
  try {
    let query = supabase.from("prestamos").select("*")

    if (filtros.hotel && filtros.hotel !== "all") {
      query = query.or(`hotel_origen.eq.${filtros.hotel},hotel_destino.eq.${filtros.hotel}`)
    }

    if (filtros.estado && filtros.estado !== "all") {
      query = query.eq("estado", filtros.estado)
    }

    if (filtros.responsable && filtros.responsable !== "all") {
      query = query.eq("responsable", filtros.responsable)
    }

    if (filtros.busqueda) {
      query = query.or(
        `responsable.ilike.%${filtros.busqueda}%,producto.ilike.%${filtros.busqueda}%,hotel_origen.ilike.%${filtros.busqueda}%,hotel_destino.ilike.%${filtros.busqueda}%`,
      )
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error al filtrar préstamos:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error al filtrar préstamos:", error)
    throw error
  }
}

// Actualizar préstamo
export const actualizarPrestamo = async (id: string, cambios: Partial<PrestamoInput>): Promise<Prestamo | null> => {
  try {
    const { data, error } = await supabase.from("prestamos").update(cambios).eq("id", id).select().single()

    if (error) {
      console.error("Error al actualizar préstamo:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error al actualizar préstamo:", error)
    throw error
  }
}

// Eliminar préstamo
export const eliminarPrestamo = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("prestamos").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar préstamo:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error al eliminar préstamo:", error)
    throw error
  }
}

// Obtener lista de hoteles únicos
export const obtenerHoteles = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.from("prestamos").select("hotel_origen, hotel_destino")

    if (error) {
      console.error("Error al obtener hoteles:", error)
      return []
    }

    const hoteles = new Set<string>()
    data?.forEach((prestamo) => {
      if (prestamo.hotel_origen) hoteles.add(prestamo.hotel_origen)
      if (prestamo.hotel_destino) hoteles.add(prestamo.hotel_destino)
    })

    return Array.from(hoteles).sort()
  } catch (error) {
    console.error("Error al obtener hoteles:", error)
    return []
  }
}

// Obtener lista de responsables únicos
export const obtenerResponsables = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.from("prestamos").select("responsable")

    if (error) {
      console.error("Error al obtener responsables:", error)
      return []
    }

    const responsables = new Set<string>()
    data?.forEach((prestamo) => {
      if (prestamo.responsable) responsables.add(prestamo.responsable)
    })

    return Array.from(responsables).sort()
  } catch (error) {
    console.error("Error al obtener responsables:", error)
    return []
  }
}

// Calcular balance de hoteles
export const obtenerBalanceHoteles = async (): Promise<BalanceHotel[]> => {
  try {
    const prestamos = await obtenerPrestamos()
    const prestamosActivos = prestamos.filter((p) => p.estado !== "cancelado")

    // Crear mapa de balances por hotel
    const balanceMap = new Map<
      string,
      {
        acreedor: number
        deudor: number
        transacciones: number
        acreedorDe: Map<string, number>
        deudorDe: Map<string, number>
      }
    >()

    // Inicializar todos los hoteles
    prestamosActivos.forEach((prestamo) => {
      if (!balanceMap.has(prestamo.hotel_origen)) {
        balanceMap.set(prestamo.hotel_origen, {
          acreedor: 0,
          deudor: 0,
          transacciones: 0,
          acreedorDe: new Map(),
          deudorDe: new Map(),
        })
      }
      if (!balanceMap.has(prestamo.hotel_destino)) {
        balanceMap.set(prestamo.hotel_destino, {
          acreedor: 0,
          deudor: 0,
          transacciones: 0,
          acreedorDe: new Map(),
          deudorDe: new Map(),
        })
      }
    })

    // Calcular balances
    prestamosActivos.forEach((prestamo) => {
      const valor = prestamo.valor
      const origen = prestamo.hotel_origen
      const destino = prestamo.hotel_destino

      // Hotel origen es acreedor (le deben)
      const balanceOrigen = balanceMap.get(origen)!
      balanceOrigen.acreedor += valor
      balanceOrigen.transacciones++
      balanceOrigen.acreedorDe.set(destino, (balanceOrigen.acreedorDe.get(destino) || 0) + valor)

      // Hotel destino es deudor (debe)
      const balanceDestino = balanceMap.get(destino)!
      balanceDestino.deudor += valor
      balanceDestino.transacciones++
      balanceDestino.deudorDe.set(origen, (balanceDestino.deudorDe.get(origen) || 0) + valor)
    })

    // Convertir a array y calcular balance neto
    const balances: BalanceHotel[] = Array.from(balanceMap.entries()).map(([hotel, datos]) => ({
      hotel,
      acreedor: datos.acreedor,
      deudor: datos.deudor,
      balance: datos.acreedor - datos.deudor,
      transacciones: datos.transacciones,
      acreedorDe: Array.from(datos.acreedorDe.entries()).map(([h, m]) => ({ hotel: h, monto: m })),
      deudorDe: Array.from(datos.deudorDe.entries()).map(([h, m]) => ({ hotel: h, monto: m })),
    }))

    return balances.sort((a, b) => b.balance - a.balance)
  } catch (error) {
    console.error("Error al calcular balance:", error)
    throw error
  }
}

// Obtener estadísticas
export const obtenerEstadisticas = async (): Promise<EstadisticasPrestamos> => {
  try {
    const prestamos = await obtenerPrestamos()
    const prestamosActivos = prestamos.filter((p) => p.estado !== "cancelado")
    const balances = await obtenerBalanceHoteles()

    const montoTotal = prestamosActivos.reduce((sum, p) => sum + p.valor, 0)
    const promedioMonto = prestamosActivos.length > 0 ? montoTotal / prestamosActivos.length : 0

    const mayorAcreedor = balances.reduce(
      (max, hotel) => (hotel.balance > max.balance ? hotel : max),
      balances[0] || { balance: 0, hotel: "" },
    )

    const mayorDeudor = balances.reduce(
      (min, hotel) => (hotel.balance < min.balance ? hotel : min),
      balances[0] || { balance: 0, hotel: "" },
    )

    return {
      totalPrestamos: prestamosActivos.length,
      montoTotal,
      promedioMonto,
      hotelMayorAcreedor: mayorAcreedor.hotel,
      hotelMayorDeudor: mayorDeudor.hotel,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    throw error
  }
}

// Exportar datos
export const exportarDatos = async (): Promise<string> => {
  try {
    const prestamos = await obtenerPrestamos()
    return JSON.stringify(prestamos, null, 2)
  } catch (error) {
    console.error("Error al exportar datos:", error)
    throw error
  }
}
