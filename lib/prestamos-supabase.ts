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
  updated_at?: string
}

export interface BalanceHotel {
  hotel: string
  acreedor: number
  deudor: number
  balance: number
  transacciones: number
  acreedorDe: RelacionHotel[]
  deudorDe: RelacionHotel[]
}

export interface RelacionHotel {
  hotel: string
  monto: number
  transacciones: number
}

export interface FiltrosPrestamos {
  hotelOrigen?: string
  hotelDestino?: string
  hotel?: string
  estado?: string
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

// Función para formatear monto
export function formatearMonto(monto: number | string): string {
  const numero = typeof monto === "string" ? Number.parseFloat(monto.replace(/[^0-9.-]/g, "")) : monto
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

// Verificar conexión a Supabase
export async function verificarConexion(): Promise<{ conectado: boolean; mensaje: string }> {
  try {
    const { data, error } = await supabase.from("prestamos").select("count").limit(1)
    return {
      conectado: !error,
      mensaje: error ? error.message : "Conectado correctamente",
    }
  } catch (error) {
    return {
      conectado: false,
      mensaje: "Error de conexión",
    }
  }
}

// Verificar si existe la tabla prestamos
export async function verificarTablaPrestamons(): Promise<{ existe: boolean; columnas: string[]; mensaje: string }> {
  try {
    const { data, error } = await supabase.from("prestamos").select("id").limit(1)
    return {
      existe: !error,
      columnas: [
        "id",
        "fecha",
        "responsable",
        "hotel_origen",
        "hotel_destino",
        "producto",
        "cantidad",
        "valor",
        "notas",
        "estado",
        "created_at",
        "updated_at",
      ],
      mensaje: error ? error.message : "Tabla existe y es accesible",
    }
  } catch (error) {
    return {
      existe: false,
      columnas: [],
      mensaje: "Tabla no existe",
    }
  }
}

// Crear un nuevo préstamo
export async function crearPrestamo(prestamo: PrestamoInput): Promise<Prestamo | null> {
  try {
    // Convertir valor a número si es string
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
    console.error("Error en crearPrestamo:", error)
    throw error
  }
}

// Crear múltiples préstamos
export async function crearPrestamosMasivos(
  prestamos: PrestamoInput[],
): Promise<{ exitosos: number; errores: string[] }> {
  try {
    const prestamosFormateados = prestamos.map((prestamo) => ({
      fecha: prestamo.fecha || new Date().toISOString().split("T")[0],
      responsable: prestamo.responsable,
      hotel_origen: prestamo.hotel_origen,
      hotel_destino: prestamo.hotel_destino,
      producto: prestamo.producto,
      cantidad: prestamo.cantidad,
      valor:
        typeof prestamo.valor === "string"
          ? Number.parseFloat(prestamo.valor.replace(/[^0-9.-]/g, ""))
          : prestamo.valor,
      notas: prestamo.notas || "",
      estado: prestamo.estado || "pendiente",
    }))

    const { data, error } = await supabase.from("prestamos").insert(prestamosFormateados).select()

    if (error) {
      console.error("Error al crear préstamos masivos:", error)
      return { exitosos: 0, errores: [error.message] }
    }

    return { exitosos: data?.length || 0, errores: [] }
  } catch (error) {
    console.error("Error en crearPrestamosMasivos:", error)
    return { exitosos: 0, errores: [String(error)] }
  }
}

// Obtener todos los préstamos
export async function obtenerPrestamos(): Promise<Prestamo[]> {
  try {
    const { data, error } = await supabase.from("prestamos").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener préstamos:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error en obtenerPrestamos:", error)
    return []
  }
}

// Obtener préstamo por ID
export async function obtenerPrestamoPorId(id: string): Promise<Prestamo | null> {
  try {
    const { data, error } = await supabase.from("prestamos").select("*").eq("id", id).single()

    if (error) {
      console.error("Error al obtener préstamo:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error en obtenerPrestamoPorId:", error)
    return null
  }
}

// Actualizar un préstamo
export async function actualizarPrestamo(id: string, prestamo: Partial<PrestamoInput>): Promise<Prestamo | null> {
  try {
    const updateData: any = { ...prestamo }

    // Convertir valor a número si es string
    if (updateData.valor && typeof updateData.valor === "string") {
      updateData.valor = Number.parseFloat(updateData.valor.replace(/[^0-9.-]/g, ""))
    }

    const { data, error } = await supabase.from("prestamos").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error al actualizar préstamo:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error en actualizarPrestamo:", error)
    throw error
  }
}

// Eliminar un préstamo
export async function eliminarPrestamo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("prestamos").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar préstamo:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error en eliminarPrestamo:", error)
    return false
  }
}

// Obtener préstamos filtrados
export async function obtenerPrestamosFiltrados(filtros: FiltrosPrestamos): Promise<Prestamo[]> {
  try {
    let query = supabase.from("prestamos").select("*")

    // Aplicar filtros
    if (filtros.hotelOrigen && filtros.hotelOrigen !== "all") {
      query = query.eq("hotel_origen", filtros.hotelOrigen)
    }

    if (filtros.hotelDestino && filtros.hotelDestino !== "all") {
      query = query.eq("hotel_destino", filtros.hotelDestino)
    }

    if (filtros.hotel && filtros.hotel !== "all") {
      query = query.or(`hotel_origen.eq.${filtros.hotel},hotel_destino.eq.${filtros.hotel}`)
    }

    if (filtros.estado && filtros.estado !== "all") {
      query = query.eq("estado", filtros.estado)
    }

    if (filtros.responsable && filtros.responsable !== "all") {
      query = query.eq("responsable", filtros.responsable)
    }

    if (filtros.fechaInicio) {
      query = query.gte("fecha", filtros.fechaInicio)
    }

    if (filtros.fechaFin) {
      query = query.lte("fecha", filtros.fechaFin)
    }

    if (filtros.montoMinimo) {
      query = query.gte("valor", filtros.montoMinimo)
    }

    if (filtros.montoMaximo) {
      query = query.lte("valor", filtros.montoMaximo)
    }

    if (filtros.busqueda) {
      const busqueda = filtros.busqueda
      query = query.or(
        `producto.ilike.%${busqueda}%,notas.ilike.%${busqueda}%,hotel_origen.ilike.%${busqueda}%,hotel_destino.ilike.%${busqueda}%`,
      )
    }

    // Ordenar por fecha descendente
    query = query.order("fecha", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener préstamos filtrados:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error en obtenerPrestamosFiltrados:", error)
    return []
  }
}

// Obtener balance de hoteles
export async function obtenerBalanceHoteles(): Promise<BalanceHotel[]> {
  try {
    console.log("🔍 Iniciando cálculo de balance de hoteles...")

    const prestamos = await obtenerPrestamos()
    console.log(`📊 Préstamos obtenidos: ${prestamos.length}`)

    // Filtrar solo préstamos activos (no cancelados)
    const prestamosActivos = prestamos.filter((p) => p.estado !== "cancelado")
    console.log(`✅ Préstamos activos: ${prestamosActivos.length}`)

    // Obtener todos los hoteles únicos
    const todosLosHoteles = new Set<string>()
    prestamosActivos.forEach((prestamo) => {
      if (prestamo.hotel_origen) todosLosHoteles.add(prestamo.hotel_origen)
      if (prestamo.hotel_destino) todosLosHoteles.add(prestamo.hotel_destino)
    })

    console.log(`🏨 Hoteles únicos encontrados: ${Array.from(todosLosHoteles).join(", ")}`)

    // Inicializar balance para todos los hoteles
    const balanceMap = new Map<string, BalanceHotel>()
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
    prestamosActivos.forEach((prestamo) => {
      const hotelOrigen = prestamo.hotel_origen
      const hotelDestino = prestamo.hotel_destino
      const monto =
        typeof prestamo.valor === "string"
          ? Number.parseFloat(prestamo.valor.replace(/[^0-9.-]/g, ""))
          : Number(prestamo.valor)

      console.log(`💰 Procesando: ${hotelOrigen} → ${hotelDestino}: ${formatearMonto(monto)}`)

      if (isNaN(monto) || monto <= 0) {
        console.warn(`⚠️ Monto inválido en préstamo ${prestamo.id}:`, prestamo.valor)
        return
      }

      // Hotel origen es acreedor (le deben)
      const balanceOrigen = balanceMap.get(hotelOrigen)
      if (balanceOrigen) {
        balanceOrigen.acreedor += monto
        balanceOrigen.transacciones += 1

        // Buscar si ya existe relación con este hotel
        const relacionExistente = balanceOrigen.acreedorDe.find((r) => r.hotel === hotelDestino)
        if (relacionExistente) {
          relacionExistente.monto += monto
          relacionExistente.transacciones += 1
        } else {
          balanceOrigen.acreedorDe.push({
            hotel: hotelDestino,
            monto: monto,
            transacciones: 1,
          })
        }

        console.log(
          `📈 ${hotelOrigen} acreedor: +${formatearMonto(monto)} (total: ${formatearMonto(balanceOrigen.acreedor)})`,
        )
      }

      // Hotel destino es deudor (debe)
      const balanceDestino = balanceMap.get(hotelDestino)
      if (balanceDestino) {
        balanceDestino.deudor += monto
        balanceDestino.transacciones += 1

        // Buscar si ya existe relación con este hotel
        const relacionExistente = balanceDestino.deudorDe.find((r) => r.hotel === hotelOrigen)
        if (relacionExistente) {
          relacionExistente.monto += monto
          relacionExistente.transacciones += 1
        } else {
          balanceDestino.deudorDe.push({
            hotel: hotelOrigen,
            monto: monto,
            transacciones: 1,
          })
        }

        console.log(
          `📉 ${hotelDestino} deudor: +${formatearMonto(monto)} (total: ${formatearMonto(balanceDestino.deudor)})`,
        )
      }
    })

    // Calcular balance neto y ordenar relaciones
    const resultado = Array.from(balanceMap.values()).map((balance) => {
      balance.balance = balance.acreedor - balance.deudor

      // Ordenar relaciones por monto descendente
      balance.acreedorDe.sort((a, b) => b.monto - a.monto)
      balance.deudorDe.sort((a, b) => b.monto - a.monto)

      console.log(
        `🏨 ${balance.hotel}: Acreedor ${formatearMonto(balance.acreedor)}, Deudor ${formatearMonto(balance.deudor)}, Balance ${formatearMonto(balance.balance)}`,
      )

      return balance
    })

    // Filtrar hoteles sin transacciones y ordenar por balance descendente
    const resultadoFiltrado = resultado
      .filter((balance) => balance.transacciones > 0)
      .sort((a, b) => b.balance - a.balance)

    console.log(`✅ Balance calculado para ${resultadoFiltrado.length} hoteles con transacciones`)

    return resultadoFiltrado
  } catch (error) {
    console.error("❌ Error al obtener balance de hoteles:", error)
    throw error
  }
}

// Obtener hoteles únicos
export async function obtenerHoteles(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("prestamos").select("hotel_origen, hotel_destino")

    if (error) {
      console.error("Error al obtener hoteles:", error)
      return []
    }

    const hotelesSet = new Set<string>()
    data?.forEach((prestamo) => {
      if (prestamo.hotel_origen) hotelesSet.add(prestamo.hotel_origen)
      if (prestamo.hotel_destino) hotelesSet.add(prestamo.hotel_destino)
    })

    return Array.from(hotelesSet).sort()
  } catch (error) {
    console.error("Error en obtenerHoteles:", error)
    return []
  }
}

// Obtener responsables únicos
export async function obtenerResponsables(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("prestamos").select("responsable")

    if (error) {
      console.error("Error al obtener responsables:", error)
      return []
    }

    const responsablesSet = new Set<string>()
    data?.forEach((prestamo) => {
      if (prestamo.responsable) responsablesSet.add(prestamo.responsable)
    })

    return Array.from(responsablesSet).sort()
  } catch (error) {
    console.error("Error en obtenerResponsables:", error)
    return []
  }
}

// Obtener estadísticas
export async function obtenerEstadisticas(): Promise<EstadisticasPrestamos> {
  try {
    const prestamos = await obtenerPrestamos()
    const balance = await obtenerBalanceHoteles()

    const totalPrestamos = prestamos.length
    const montoTotal = prestamos.reduce((sum, p) => {
      const valor = typeof p.valor === "string" ? Number.parseFloat(p.valor.replace(/[^0-9.-]/g, "")) : Number(p.valor)
      return sum + (isNaN(valor) ? 0 : valor)
    }, 0)

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

// Exportar datos
export async function exportarDatos(): Promise<string> {
  try {
    const prestamos = await obtenerPrestamos()
    const balance = await obtenerBalanceHoteles()
    const estadisticas = await obtenerEstadisticas()

    const datos = {
      prestamos,
      balance,
      estadisticas,
      fechaExportacion: new Date().toISOString(),
      version: "2.0",
      fuente: "supabase",
    }

    return JSON.stringify(datos, null, 2)
  } catch (error) {
    console.error("Error al exportar datos:", error)
    return "{}"
  }
}
