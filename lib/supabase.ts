import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Estas URLs deberían estar en variables de entorno en producción
const supabaseUrl = "https://tu-proyecto.supabase.co"
const supabaseKey = "tu-clave-anon-key"

// Crear el cliente de Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Verificar si Supabase está disponible
export const isSupabaseAvailable = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from("health_check").select("*").limit(1)
    return !error
  } catch (error) {
    console.error("Error al verificar disponibilidad de Supabase:", error)
    return false
  }
}

// Tipos para Supabase
export type SupabaseProduct = {
  id: number
  name: string
  unit: string
  price: number
  created_at?: string
}

export type SupabaseInventoryItem = {
  product_id: number
  quantity: number
  created_at?: string
}

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
  created_at?: string
}

// Funciones para productos
export const saveProduct = async (product: SupabaseProduct) => {
  try {
    const { error } = await supabase.from("products").upsert({
      id: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
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
    const { error } = await supabase.from("products").upsert(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        price: p.price,
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
    const { data, error } = await supabase.from("inventory").select("*")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error al obtener inventario de Supabase:", error)
    return []
  }
}

// Funciones para registros
export const saveRecord = async (record: SupabaseRecord) => {
  try {
    const { error } = await supabase.from("records").upsert({
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
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al guardar registro en Supabase:", error)
    return false
  }
}

export const getRecords = async (): Promise<SupabaseRecord[]> => {
  try {
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
