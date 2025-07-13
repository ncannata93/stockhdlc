import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Tipos específicos para préstamos
export interface Prestamo {
  id: string
  fecha: string
  responsable: string
  hotel_origen: string
  hotel_destino: string
  producto: string
  cantidad?: string
  valor: number
  notas?: string
  estado: "pendiente" | "pagado" | "cancelado"
  created_at: string
  updated_at: string
  created_by?: string
}

export interface PrestamoInput {
  fecha?: string
  responsable: string
  hotel_origen: string
  hotel_destino: string
  producto: string
  cantidad?: string
  valor: number
  notas?: string
  estado?: "pendiente" | "pagado" | "cancelado"
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

// Constantes predefinidas
const HOTELES_PREDEFINIDOS = [
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

const RESPONSABLES_PREDEFINIDOS = ["Nicolas Cannata", "Juan Manuel", "Nacho", "Diego", "Administrador", "Gerente"]

// Cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Función para formatear monto
export function formatearMonto(monto: number | string): string {
  const numero = typeof monto === "string" ? Number.parseFloat(monto) : monto
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

// Verificar si la tabla prestamos existe y tiene las columnas correctas
export async function verificarTablaPrestamons(): Promise<{ existe: boolean; columnas: string[]; mensaje: string }> {
  try {
    const { data, error } = await supabase.from("prestamos").select("id").limit(1)

    if (error) {
      console.error("Error al verificar tabla prestamos:", error)
      return {
        existe: false,
        columnas: [],
        mensaje: `Error: ${error.message}`,
      }
    }

    // Si llegamos aquí, la tabla existe
    return {
      existe: true,
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
        "created_by",
      ],
      mensaje: "Tabla prestamos existe y es accesible",
    }
  } catch (error) {
    console.error("Error al verificar tabla:", error)
    return {
      existe: false,
      columnas: [],
      mensaje: `Error de conexión: ${error}`,
    }
  }
}

// FUNCIONES PRINCIPALES

export async function obtenerPrestamos(): Promise<Prestamo[]> {
  try {
    // Verificar tabla primero
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      console.error("Tabla prestamos no existe:", verificacion.mensaje)
      return []
    }

    const { data, error } = await supabase.from("prestamos").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener préstamos:", error)
      throw new Error(`Error de Supabase: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error al obtener préstamos:", error)
    throw error
  }
}

export async function obtenerPrestamoPorId(id: string): Promise<Prestamo | null> {
  try {
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      return null
    }

    const { data, error } = await supabase.from("prestamos").select("*").eq("id", id).single()

    if (error) {
      console.error("Error al obtener préstamo:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error al obtener préstamo:", error)
    return null
  }
}

export async function crearPrestamo(input: PrestamoInput): Promise<Prestamo | null> {
  try {
    // Verificar tabla primero
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      throw new Error("Tabla prestamos no existe. Ejecuta el script de creación primero.")
    }

    // Obtener el usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const prestamoData = {
      fecha: input.fecha || new Date().toISOString().split("T")[0],
      responsable: input.responsable,
      hotel_origen: input.hotel_origen,
      hotel_destino: input.hotel_destino,
      producto: input.producto,
      cantidad: input.cantidad,
      valor: Number(input.valor),
      notas: input.notas,
      estado: input.estado || ("pendiente" as const),
      created_by: user?.id,
    }

    const { data, error } = await supabase.from("prestamos").insert([prestamoData]).select().single()

    if (error) {
      console.error("Error al crear préstamo:", error)
      throw new Error(`Error al crear préstamo: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error al crear préstamo:", error)
    throw error
  }
}

export async function crearPrestamosMasivos(
  prestamos: PrestamoInput[],
): Promise<{ exitosos: number; errores: string[] }> {
  try {
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      throw new Error("Tabla prestamos no existe. Ejecuta el script de creación primero.")
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const prestamosData = prestamos.map((input) => ({
      fecha: input.fecha || new Date().toISOString().split("T")[0],
      responsable: input.responsable,
      hotel_origen: input.hotel_origen,
      hotel_destino: input.hotel_destino,
      producto: input.producto,
      cantidad: input.cantidad,
      valor: Number(input.valor),
      notas: input.notas,
      estado: input.estado || ("pendiente" as const),
      created_by: user?.id,
    }))

    const { data, error } = await supabase.from("prestamos").insert(prestamosData).select()

    if (error) {
      console.error("Error al crear préstamos masivos:", error)
      return { exitosos: 0, errores: [error.message] }
    }

    return { exitosos: data?.length || 0, errores: [] }
  } catch (error) {
    console.error("Error al crear préstamos masivos:", error)
    return { exitosos: 0, errores: [String(error)] }
  }
}

export async function actualizarPrestamo(id: string, cambios: Partial<PrestamoInput>): Promise<Prestamo | null> {
  try {
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      throw new Error("Tabla prestamos no existe")
    }

    // Asegurar que el valor sea número si se está actualizando
    const cambiosLimpios = { ...cambios }
    if (cambiosLimpios.valor !== undefined) {
      cambiosLimpios.valor = Number(cambiosLimpios.valor)
    }

    const { data, error } = await supabase.from("prestamos").update(cambiosLimpios).eq("id", id).select().single()

    if (error) {
      console.error("Error al actualizar préstamo:", error)
      throw new Error(`Error al actualizar préstamo: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error al actualizar préstamo:", error)
    throw error
  }
}

export async function eliminarPrestamo(id: string): Promise<boolean> {
  try {
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      return false
    }

    const { error } = await supabase.from("prestamos").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar préstamo:", error)
      throw new Error(`Error al eliminar préstamo: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error("Error al eliminar préstamo:", error)
    return false
  }
}

export async function obtenerPrestamosFiltrados(filtros: FiltrosPrestamos): Promise<Prestamo[]> {
  try {
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      return []
    }

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
      throw new Error(`Error al filtrar préstamos: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error al obtener préstamos filtrados:", error)
    throw error
  }
}

export async function obtenerHoteles(): Promise<string[]> {
  try {
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      console.warn("Tabla prestamos no existe, usando hoteles predefinidos")
      return HOTELES_PREDEFINIDOS.sort()
    }

    // Intentar obtener hoteles de la tabla prestamos
    const { data, error } = await supabase.from("prestamos").select("hotel_origen, hotel_destino")

    if (error) {
      console.error("Error al obtener hoteles desde prestamos:", error)
      // Si hay error, devolver lista predefinida
      return HOTELES_PREDEFINIDOS.sort()
    }

    const hoteles = new Set<string>()

    // Agregar hoteles de los préstamos existentes
    data?.forEach((prestamo) => {
      if (prestamo.hotel_origen) hoteles.add(prestamo.hotel_origen)
      if (prestamo.hotel_destino) hoteles.add(prestamo.hotel_destino)
    })

    // Agregar hoteles predefinidos
    HOTELES_PREDEFINIDOS.forEach((hotel) => hoteles.add(hotel))

    return Array.from(hoteles).sort()
  } catch (error) {
    console.error("Error al obtener hoteles:", error)
    return HOTELES_PREDEFINIDOS.sort()
  }
}

export async function obtenerResponsables(): Promise<string[]> {
  try {
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      console.warn("Tabla prestamos no existe, usando responsables predefinidos")
      return RESPONSABLES_PREDEFINIDOS.sort()
    }

    const { data, error } = await supabase.from("prestamos").select("responsable").order("responsable")

    if (error) {
      console.error("Error al obtener responsables:", error)
      return RESPONSABLES_PREDEFINIDOS.sort()
    }

    const responsables = new Set<string>()
    data?.forEach((prestamo) => {
      if (prestamo.responsable) responsables.add(prestamo.responsable)
    })

    // Agregar responsables predefinidos
    RESPONSABLES_PREDEFINIDOS.forEach((responsable) => responsables.add(responsable))

    return Array.from(responsables).sort()
  } catch (error) {
    console.error("Error al obtener responsables:", error)
    return RESPONSABLES_PREDEFINIDOS.sort()
  }
}

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

    // Agregar hoteles predefinidos
    const hoteles = await obtenerHoteles()
    hoteles.forEach((hotel) => todosLosHoteles.add(hotel))

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
      const monto = Number(prestamo.valor)

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

export async function obtenerEstadisticas(): Promise<EstadisticasPrestamos> {
  try {
    const prestamos = await obtenerPrestamos()
    const balance = await obtenerBalanceHoteles()

    const totalPrestamos = prestamos.length
    const montoTotal = prestamos.reduce((sum, p) => sum + Number(p.valor || 0), 0)
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

// Función para migrar datos de localStorage a Supabase
export async function migrarDatosLocalStorage(): Promise<{ exito: boolean; mensaje: string; migrados: number }> {
  try {
    // Verificar tabla primero
    const verificacion = await verificarTablaPrestamons()
    if (!verificacion.existe) {
      return { exito: false, mensaje: "Tabla prestamos no existe. Ejecuta el script de creación primero.", migrados: 0 }
    }

    // Verificar si hay datos en localStorage
    const datosLocal = localStorage.getItem("prestamos_data")
    if (!datosLocal) {
      return { exito: false, mensaje: "No hay datos en localStorage para migrar", migrados: 0 }
    }

    const prestamosLocal = JSON.parse(datosLocal)
    if (!Array.isArray(prestamosLocal) || prestamosLocal.length === 0) {
      return { exito: false, mensaje: "No hay préstamos válidos en localStorage", migrados: 0 }
    }

    // Obtener usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { exito: false, mensaje: "Usuario no autenticado", migrados: 0 }
    }

    let migrados = 0
    const errores: string[] = []

    // Migrar cada préstamo
    for (const prestamoLocal of prestamosLocal) {
      try {
        const prestamoData = {
          fecha: prestamoLocal.fecha || new Date().toISOString().split("T")[0],
          responsable: prestamoLocal.responsable,
          hotel_origen: prestamoLocal.hotel_origen || prestamoLocal.hotelOrigen,
          hotel_destino: prestamoLocal.hotel_destino || prestamoLocal.hotelDestino,
          producto: prestamoLocal.producto,
          cantidad: prestamoLocal.cantidad,
          valor: Number(prestamoLocal.valor || prestamoLocal.monto || 0),
          notas: prestamoLocal.notas,
          estado: prestamoLocal.estado || "pendiente",
          created_by: user.id,
        }

        const { error } = await supabase.from("prestamos").insert([prestamoData])

        if (error) {
          errores.push(`Error al migrar préstamo: ${error.message}`)
        } else {
          migrados++
        }
      } catch (error) {
        errores.push(`Error al procesar préstamo: ${error}`)
      }
    }

    if (migrados > 0) {
      // Limpiar localStorage después de migración exitosa
      localStorage.removeItem("prestamos_data")
      return {
        exito: true,
        mensaje: `${migrados} préstamos migrados exitosamente${errores.length > 0 ? ` (${errores.length} errores)` : ""}`,
        migrados,
      }
    } else {
      return {
        exito: false,
        mensaje: `No se pudo migrar ningún préstamo. Errores: ${errores.join(", ")}`,
        migrados: 0,
      }
    }
  } catch (error) {
    console.error("Error en migración:", error)
    return { exito: false, mensaje: `Error en migración: ${error}`, migrados: 0 }
  }
}

// Verificar conexión a Supabase
export async function verificarConexion(): Promise<{ conectado: boolean; mensaje: string }> {
  try {
    const verificacion = await verificarTablaPrestamons()

    if (!verificacion.existe) {
      return {
        conectado: false,
        mensaje: `Tabla prestamos no existe: ${verificacion.mensaje}`,
      }
    }

    return { conectado: true, mensaje: "Conectado a Supabase correctamente" }
  } catch (error) {
    return { conectado: false, mensaje: `Error de red: ${error}` }
  }
}
