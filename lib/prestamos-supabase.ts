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

// Normalizar texto a Title Case para unificar mayusculas/minusculas
const normalizarTexto = (texto: string): string => {
  if (!texto) return ""
  return texto
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (match) => match.toUpperCase())
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

// Función para convertir fecha a formato ISO
const convertirFechaAISO = (fecha: string): string => {
  // Si ya está en formato ISO (YYYY-MM-DD), devolverla tal como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha
  }

  // Si está en formato DD/MM/YYYY o DD/M/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fecha)) {
    const [dia, mes, año] = fecha.split("/")
    const diaFormatted = dia.padStart(2, "0")
    const mesFormatted = mes.padStart(2, "0")
    return `${año}-${mesFormatted}-${diaFormatted}`
  }

  // Si está en formato DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(fecha)) {
    const [dia, mes, año] = fecha.split("-")
    const diaFormatted = dia.padStart(2, "0")
    const mesFormatted = mes.padStart(2, "0")
    return `${año}-${mesFormatted}-${diaFormatted}`
  }

  // Si no coincide con ningún formato, intentar crear una fecha válida
  try {
    const fechaObj = new Date(fecha)
    if (!isNaN(fechaObj.getTime())) {
      return fechaObj.toISOString().split("T")[0]
    }
  } catch (error) {
    console.error("Error al convertir fecha:", fecha, error)
  }

  // Como último recurso, usar la fecha actual
  console.warn("Fecha inválida, usando fecha actual:", fecha)
  return new Date().toISOString().split("T")[0]
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

    // Convertir fecha a formato ISO
    const fechaISO = prestamo.fecha ? convertirFechaAISO(prestamo.fecha) : new Date().toISOString().split("T")[0]

    console.log("📅 Fecha original:", prestamo.fecha)
    console.log("📅 Fecha convertida a ISO:", fechaISO)
    console.log("💰 Valor convertido:", valor)

    const datosParaInsertar = {
      fecha: fechaISO,
      responsable: normalizarTexto(prestamo.responsable),
      hotel_origen: normalizarTexto(prestamo.hotel_origen),
      hotel_destino: normalizarTexto(prestamo.hotel_destino),
      producto: normalizarTexto(prestamo.producto),
      cantidad: prestamo.cantidad,
      valor: valor,
      estado: prestamo.estado || "pendiente",
    }

    console.log("📝 Datos a insertar:", datosParaInsertar)

    const { data, error } = await supabase.from("prestamos").insert([datosParaInsertar]).select().single()

    if (error) {
      console.error("❌ Error al crear préstamo:", error)
      throw new Error(`Error de base de datos: ${error.message}`)
    }

    console.log("✅ Préstamo creado exitosamente:", data)
    return data
  } catch (error) {
    console.error("❌ Error al crear préstamo:", error)
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
    // Si hay cambios en la fecha, convertirla a ISO
    if (cambios.fecha) {
      cambios.fecha = convertirFechaAISO(cambios.fecha)
    }

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
      if (prestamo.hotel_origen) hoteles.add(normalizarTexto(prestamo.hotel_origen))
      if (prestamo.hotel_destino) hoteles.add(normalizarTexto(prestamo.hotel_destino))
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
      if (prestamo.responsable) responsables.add(normalizarTexto(prestamo.responsable))
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
    console.log("[v0] 📊 Total de préstamos obtenidos:", prestamos.length)

    const prestamosActivos = prestamos.filter((p) => p.estado !== "cancelado")
    console.log("[v0] ✅ Préstamos activos (no cancelados):", prestamosActivos.length)

    const transaccionJuanManuel = prestamos.find(
      (p) =>
        p.responsable === "Juan Manuel" &&
        p.hotel_origen === "Mallak" &&
        p.hotel_destino === "Argentina" &&
        p.producto === "Toallas",
    )

    if (transaccionJuanManuel) {
      console.log("[v0] 🔍 Transacción de Juan Manuel encontrada:", {
        id: transaccionJuanManuel.id,
        fecha: transaccionJuanManuel.fecha,
        responsable: transaccionJuanManuel.responsable,
        origen: transaccionJuanManuel.hotel_origen,
        destino: transaccionJuanManuel.hotel_destino,
        producto: transaccionJuanManuel.producto,
        cantidad: transaccionJuanManuel.cantidad,
        valor: transaccionJuanManuel.valor,
        estado: transaccionJuanManuel.estado,
        created_at: transaccionJuanManuel.created_at,
      })

      const estaActiva = prestamosActivos.includes(transaccionJuanManuel)
      console.log("[v0] ❓ ¿Está en préstamos activos?:", estaActiva)

      if (!estaActiva) {
        console.log("[v0] ⚠️ PROBLEMA: La transacción está CANCELADA, por eso no aparece en el balance")
      }
    } else {
      console.log("[v0] ❌ Transacción de Juan Manuel NO encontrada en la base de datos")
      console.log(
        "[v0] 📋 Todas las transacciones:",
        prestamos.map((p) => ({
          responsable: p.responsable,
          origen: p.hotel_origen,
          destino: p.hotel_destino,
          producto: p.producto,
          estado: p.estado,
        })),
      )
    }

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

    // Inicializar todos los hoteles (normalizando nombres)
    prestamosActivos.forEach((prestamo) => {
      const origen = normalizarTexto(prestamo.hotel_origen)
      const destino = normalizarTexto(prestamo.hotel_destino)
      if (!balanceMap.has(origen)) {
        balanceMap.set(origen, {
          acreedor: 0,
          deudor: 0,
          transacciones: 0,
          acreedorDe: new Map(),
          deudorDe: new Map(),
        })
      }
      if (!balanceMap.has(destino)) {
        balanceMap.set(destino, {
          acreedor: 0,
          deudor: 0,
          transacciones: 0,
          acreedorDe: new Map(),
          deudorDe: new Map(),
        })
      }
    })

    // Calcular balances (normalizando nombres)
    prestamosActivos.forEach((prestamo) => {
      const valor = prestamo.valor
      const origen = normalizarTexto(prestamo.hotel_origen)
      const destino = normalizarTexto(prestamo.hotel_destino)

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

    console.log(
      "[v0] 🏨 Balances calculados:",
      balances.map((b) => ({
        hotel: b.hotel,
        balance: b.balance,
        transacciones: b.transacciones,
      })),
    )

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
