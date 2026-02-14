"use client"

// Gestor de base de datos para Stock Argentina
import { createClient } from "@supabase/supabase-js"

// Tipos para Stock Argentina
export interface ProductArg {
  id: number
  name: string
  unit: string
  price: number
  min_stock: number
  pack_size: number
}

export interface InventoryItemArg {
  productId: number
  quantity: number
}

export interface StockRecordArg {
  id: number
  hotelId: number | null
  hotelName: string | null
  productId: number
  productName: string
  productUnit: string
  quantity: number
  price: number
  date: Date
  type: "entrada" | "salida"
  username?: string
}

// Estado de la conexión
let isOnlineMode = false
let isInitialized = false
let isInitializing = false
let connectionError: string | null = null

// Función para obtener el cliente de Supabase
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Verificar si las credenciales están configuradas
const areSupabaseCredentialsConfigured = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Inicializar la base de datos
export const initializeDBArg = async (): Promise<{
  success: boolean
  online: boolean
  error: string | null
  needsConfiguration: boolean
}> => {
  if (isInitializing) {
    let attempts = 0
    const maxAttempts = 200

    while (isInitializing && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    if (isInitializing) {
      return {
        success: false,
        online: false,
        error: "Tiempo de espera agotado durante la inicialización",
        needsConfiguration: !areSupabaseCredentialsConfigured(),
      }
    }

    if (isInitialized && isOnlineMode) {
      return { success: true, online: true, error: null, needsConfiguration: false }
    }
  }

  isInitializing = true
  connectionError = null

  if (!areSupabaseCredentialsConfigured()) {
    isInitializing = false
    connectionError = "Se requiere configurar las credenciales de Supabase"
    return {
      success: false,
      online: false,
      error: connectionError,
      needsConfiguration: true,
    }
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("No se pudo crear el cliente de Supabase")
    }

    // Verificar conexión con una consulta simple
    const { error } = await supabase.from("products_arg").select("id").limit(1)

    if (error && error.code !== "PGRST116") {
      // PGRST116 es "no rows returned" que está bien
      throw new Error(error.message)
    }

    isOnlineMode = true
    isInitialized = true
    isInitializing = false
    return { success: true, online: true, error: null, needsConfiguration: false }
  } catch (error) {
    console.error("Error al inicializar Stock Argentina:", error)
    isOnlineMode = false
    isInitialized = false
    isInitializing = false
    connectionError = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      online: false,
      error: connectionError,
      needsConfiguration: true,
    }
  }
}

// Obtener estado de conexión
export const getConnectionStatusArg = () => {
  return {
    isOnlineMode,
    isInitialized,
    isInitializing,
    connectionError,
    needsConfiguration: !areSupabaseCredentialsConfigured(),
  }
}

// PRODUCTOS
export const getProductsArg = async (): Promise<ProductArg[]> => {
  if (!isInitialized) {
    const result = await initializeDBArg()
    if (!result.success) return []
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("products_arg")
      .select("*")
      .order("name")

    if (error) throw error

    return (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      price: p.price || 0,
      min_stock: p.min_stock || 0,
      pack_size: p.pack_size || 0,
    }))
  } catch (error) {
    console.error("Error al obtener productos ARG:", error)
    return []
  }
}

export const saveProductArg = async (product: ProductArg): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDBArg()
    if (!result.success) return false
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase.from("products_arg").upsert({
      id: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      min_stock: product.min_stock,
      pack_size: product.pack_size,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al guardar producto ARG:", error)
    return false
  }
}

// INVENTARIO
export const getInventoryArg = async (): Promise<InventoryItemArg[]> => {
  if (!isInitialized) {
    const result = await initializeDBArg()
    if (!result.success) return []
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase.from("inventory_arg").select("*")

    if (error) throw error

    return (data || []).map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
    }))
  } catch (error) {
    console.error("Error al obtener inventario ARG:", error)
    return []
  }
}

export const saveInventoryItemArg = async (item: InventoryItemArg): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDBArg()
    if (!result.success) return false
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase.from("inventory_arg").upsert({
      product_id: item.productId,
      quantity: item.quantity,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al guardar inventario ARG:", error)
    return false
  }
}

// REGISTROS
export const getRecordsArg = async (): Promise<StockRecordArg[]> => {
  if (!isInitialized) {
    const result = await initializeDBArg()
    if (!result.success) return []
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("records_arg")
      .select("*")
      .order("date", { ascending: false })

    if (error) throw error

    return (data || []).map((record) => ({
      id: record.id,
      hotelId: record.hotel_id,
      hotelName: record.hotel_name,
      productId: record.product_id,
      productName: record.product_name,
      productUnit: record.product_unit,
      quantity: record.quantity,
      price: record.price,
      date: new Date(record.date),
      type: record.type,
      username: record.username,
    }))
  } catch (error) {
    console.error("Error al obtener registros ARG:", error)
    return []
  }
}

export const saveRecordArg = async (record: StockRecordArg): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDBArg()
    if (!result.success) return false
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase.from("records_arg").insert({
      hotel_id: record.hotelId,
      hotel_name: record.hotelName,
      product_id: record.productId,
      product_name: record.productName,
      product_unit: record.productUnit,
      quantity: record.quantity,
      price: record.price,
      date: record.date.toISOString(),
      type: record.type,
      username: record.username,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al guardar registro ARG:", error)
    return false
  }
}

export const updateRecordArg = async (record: StockRecordArg): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDBArg()
    if (!result.success) return false
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    const { error } = await supabase
      .from("records_arg")
      .update({
        hotel_id: record.hotelId,
        hotel_name: record.hotelName,
        product_id: record.productId,
        product_name: record.productName,
        product_unit: record.productUnit,
        quantity: record.quantity,
        price: record.price,
        type: record.type,
        username: record.username,
      })
      .eq("id", record.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al actualizar registro ARG:", error)
    return false
  }
}

// Recalcular inventario desde los registros (fuente de verdad)
export const recalculateInventoryArg = async (): Promise<InventoryItemArg[]> => {
  if (!isInitialized) {
    const result = await initializeDBArg()
    if (!result.success) return []
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    // Obtener todos los registros
    const { data: allRecords, error: recordsError } = await supabase
      .from("records_arg")
      .select("product_id, quantity, type")

    if (recordsError) throw recordsError

    // Obtener todos los productos
    const { data: allProducts, error: productsError } = await supabase
      .from("products_arg")
      .select("id")

    if (productsError) throw productsError

    // Calcular cantidades correctas por producto
    const quantities: { [productId: number]: number } = {}

    // Inicializar todos los productos en 0
    for (const product of allProducts || []) {
      quantities[product.id] = 0
    }

    // Sumar entradas y restar salidas
    for (const record of allRecords || []) {
      if (!quantities[record.product_id]) {
        quantities[record.product_id] = 0
      }
      if (record.type === "entrada") {
        quantities[record.product_id] += record.quantity
      } else if (record.type === "salida") {
        quantities[record.product_id] -= record.quantity
      }
    }

    // Actualizar la tabla inventory_arg con los valores correctos
    const updatedInventory: InventoryItemArg[] = []
    for (const [productIdStr, quantity] of Object.entries(quantities)) {
      const productId = Number(productIdStr)
      const { error: upsertError } = await supabase.from("inventory_arg").upsert({
        product_id: productId,
        quantity: quantity,
      })

      if (upsertError) {
        console.error(`Error al actualizar inventario para producto ${productId}:`, upsertError)
      }

      updatedInventory.push({ productId, quantity })
    }

    return updatedInventory
  } catch (error) {
    console.error("Error al recalcular inventario ARG:", error)
    return []
  }
}

export const deleteRecordArg = async (recordId: number): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDBArg()
    if (!result.success) return false
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    // Obtener el registro para revertir el inventario
    const { data: recordData, error: recordError } = await supabase
      .from("records_arg")
      .select("*")
      .eq("id", recordId)
      .single()

    if (recordError || !recordData) {
      console.error("Error al obtener el registro a eliminar:", recordError)
      return false
    }

    // Actualizar el inventario (revertir el efecto del registro)
    const inventory = await getInventoryArg()
    const inventoryItem = inventory.find((i) => i.productId === recordData.product_id)
    
    if (inventoryItem) {
      const updatedQuantity =
        recordData.type === "entrada"
          ? inventoryItem.quantity - recordData.quantity
          : inventoryItem.quantity + recordData.quantity

      await saveInventoryItemArg({
        productId: recordData.product_id,
        quantity: updatedQuantity,
      })
    }

    // Eliminar el registro
    const { error: deleteError } = await supabase
      .from("records_arg")
      .delete()
      .eq("id", recordId)

    if (deleteError) throw deleteError
    return true
  } catch (error) {
    console.error("Error al eliminar registro ARG:", error)
    return false
  }
}
