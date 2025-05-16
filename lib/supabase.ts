import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Función para obtener las credenciales de Supabase
const getSupabaseCredentials = () => {
  // Verificar si estamos en el navegador
  if (typeof window === "undefined") {
    // En el servidor, usar directamente las variables de entorno
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    }
  }

  // En el cliente, obtener del localStorage
  let url = ""
  let key = ""

  try {
    url = localStorage.getItem("supabaseUrl") || ""
    key = localStorage.getItem("supabaseKey") || ""

    // Verificar si las credenciales están en formato JSON (a veces ocurre)
    if (url && url.startsWith('"') && url.endsWith('"')) {
      url = JSON.parse(url)
    }
    if (key && key.startsWith('"') && key.endsWith('"')) {
      key = JSON.parse(key)
    }

    // Verificar si las credenciales están vacías o son inválidas
    if (!url || url === "undefined" || url === "null") {
      url = ""
    }
    if (!key || key === "undefined" || key === "null") {
      key = ""
    }

    console.log("Credenciales obtenidas de localStorage:", {
      url: url ? url.substring(0, 15) + "..." : "No configurada",
      key: key ? key.substring(0, 10) + "..." : "No configurada",
    })
  } catch (error) {
    console.error("Error al leer credenciales de localStorage:", error)
  }

  // Si tenemos las variables de entorno de Vercel, usarlas como respaldo
  if (!url && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL
    console.log("Usando URL de Supabase desde variables de entorno")
  }
  if (!key && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    console.log("Usando clave de Supabase desde variables de entorno")
  }

  return { url, key }
}

// Crear una función para obtener el cliente de Supabase
export const getSupabaseClient = () => {
  const { url, key } = getSupabaseCredentials()

  // Verificar que las credenciales existan
  if (!url || !key) {
    console.warn("Credenciales de Supabase no encontradas")
    return null
  }

  try {
    return createClient<Database>(url, key)
  } catch (error) {
    console.error("Error al crear cliente Supabase:", error)
    return null
  }
}

// Función mejorada para verificar la disponibilidad de Supabase
export const isSupabaseAvailable = async (): Promise<{ available: boolean; error: string | null }> => {
  try {
    console.log("Verificando disponibilidad de Supabase...")
    const supabase = getSupabaseClient()

    // Si no hay cliente, Supabase no está disponible
    if (!supabase) {
      console.warn("Cliente Supabase no disponible - credenciales no configuradas")
      return { available: false, error: "Credenciales de Supabase no configuradas" }
    }

    // Mostrar la URL que se está usando (sin mostrar la clave completa)
    const { url } = getSupabaseCredentials()
    console.log("Verificando conexión usando URL:", url)

    // Intentar una operación simple con timeout extendido
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos

    try {
      console.log("Intentando verificar tabla de health_check...")
      // Primero intentamos una operación sencilla en la tabla health_check
      const { data, error: healthCheckError } = await supabase
        .from("health_check")
        .select("*")
        .limit(1)
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (healthCheckError) {
        console.warn("Error al verificar tabla health_check:", healthCheckError)

        // Si hay un error específico de autenticación, las credenciales son incorrectas
        if (
          healthCheckError.code === "PGRST301" ||
          healthCheckError.message.includes("JWT") ||
          healthCheckError.message.includes("auth")
        ) {
          return {
            available: false,
            error: `Error de autenticación: ${healthCheckError.message}. Verifica tus credenciales.`,
          }
        }

        // Si la tabla no existe, intentar con productos
        console.log("Intentando verificar tabla de productos...")
        try {
          const { count, error: productsError } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })

          if (productsError) {
            console.warn("Error al verificar tabla products:", productsError)
            return {
              available: false,
              error: `Error al verificar tablas: ${productsError.message}`,
            }
          }

          console.log("Verificación de tabla products exitosa")
          return { available: true, error: null }
        } catch (productsError) {
          console.error("Error al verificar tabla products:", productsError)
          return {
            available: false,
            error: `Error al verificar tablas: ${productsError instanceof Error ? productsError.message : String(productsError)}`,
          }
        }
      }

      console.log("Verificación de Supabase completada con éxito")
      return { available: true, error: null }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.warn("Error de fetch al verificar Supabase:", fetchError)

      return {
        available: false,
        error: `Error de conexión: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
      }
    }
  } catch (error) {
    console.error("Error general al verificar disponibilidad de Supabase:", error)
    return {
      available: false,
      error: `Error general: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Tipos para Supabase
export type SupabaseProduct = {
  id: number
  name: string
  unit: string
  price: number
  min_stock: number
  created_at?: string
}

export type SupabaseInventoryItem = {
  product_id: number
  quantity: number
  created_at?: string
}

// Update the SupabaseRecord type to include username
export type SupabaseRecord = {
  id: number
  hotel_id: number | null
  hotel_name: string | null
  product_id: number
  product_name: string
  product_unit: string
  quantity: number
  price: number
  date: string
  type: "entrada" | "salida"
  username: string | null // Add username field
  created_at?: string
}

// Funciones para productos
export const saveProduct = async (product: SupabaseProduct) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase.from("products").upsert({
      id: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      min_stock: product.min_stock,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al guardar producto en Supabase:", error)
    return false
  }
}

export const saveProducts = async (products: SupabaseProduct[]) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase.from("products").upsert(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        price: p.price,
        min_stock: p.min_stock,
      })),
    )

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al guardar productos en Supabase:", error)
    return false
  }
}

export const getProducts = async (): Promise<SupabaseProduct[]> => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase.from("products").select("*").order("id")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error al obtener productos de Supabase:", error)
    return []
  }
}

// Funciones para inventario
export const saveInventoryItem = async (item: SupabaseInventoryItem) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase.from("inventory").upsert({
      product_id: item.product_id,
      quantity: item.quantity,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al guardar item de inventario en Supabase:", error)
    return false
  }
}

export const saveInventory = async (inventory: SupabaseInventoryItem[]) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase.from("inventory").upsert(
      inventory.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    )

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al guardar inventario en Supabase:", error)
    return false
  }
}

export const getInventory = async (): Promise<SupabaseInventoryItem[]> => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase.from("inventory").select("*")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error al obtener inventario de Supabase:", error)
    return []
  }
}

// Funciones para registros
// Modify the saveRecord function to handle the case where username field might not exist yet
export const saveRecord = async (record: SupabaseRecord) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    // Create a base record object without username
    const baseRecord = {
      id: record.id,
      hotel_id: record.hotel_id,
      hotel_name: record.hotel_name,
      product_id: record.product_id,
      product_name: record.product_name,
      product_unit: record.product_unit,
      quantity: record.quantity,
      price: record.price,
      date: record.date,
      type: record.type,
    }

    // First try to save with username
    try {
      const { error } = await supabase.from("records").upsert({
        ...baseRecord,
        username: record.username,
      })

      if (!error) return true

      // If there's an error related to the username column
      if (error.message && error.message.includes("username")) {
        console.log("Username column not found, trying without username field")
        // Try again without the username field
        const { error: fallbackError } = await supabase.from("records").upsert(baseRecord)

        if (fallbackError) throw fallbackError
        return true
      } else {
        throw error
      }
    } catch (innerError) {
      console.error("Error in first upsert attempt:", innerError)
      // As a last resort, try without username
      const { error: lastError } = await supabase.from("records").upsert(baseRecord)
      if (lastError) throw lastError
      return true
    }
  } catch (error) {
    console.error("Error al guardar registro en Supabase:", error)
    return false
  }
}

export const getRecords = async (): Promise<SupabaseRecord[]> => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase.from("records").select("*").order("date", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error al obtener registros de Supabase:", error)
    return []
  }
}

// Suscripciones en tiempo real
export const subscribeToInventory = (callback: (inventory: SupabaseInventoryItem[]) => void) => {
  const supabase = getSupabaseClient()
  if (!supabase) return { unsubscribe: () => {} }

  return supabase
    .channel("inventory-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "inventory",
      },
      async () => {
        // Cuando hay un cambio, obtenemos todos los datos actualizados
        const inventory = await getInventory()
        callback(inventory)
      },
    )
    .subscribe()
}

export const subscribeToRecords = (callback: (records: SupabaseRecord[]) => void) => {
  const supabase = getSupabaseClient()
  if (!supabase) return { unsubscribe: () => {} }

  return supabase
    .channel("records-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "records",
      },
      async () => {
        // Cuando hay un cambio, obtenemos todos los datos actualizados
        const records = await getRecords()
        callback(records)
      },
    )
    .subscribe()
}
