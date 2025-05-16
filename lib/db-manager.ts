"use client"

// Gestor de base de datos que integra Supabase y la base de datos local
import * as supabaseDB from "@/lib/supabase"
import * as localDB from "@/lib/local-db"
import { useState, useEffect } from "react"

// Tipos
export type { Product, InventoryItem, StockRecord } from "@/lib/local-db"

// Estado de la conexión
let isOnlineMode = false
let isInitialized = false
let isInitializing = false
let lastSyncTime: Date | null = null
let connectionError: string | null = null

// Función para verificar si las credenciales de Supabase están configuradas
const areSupabaseCredentialsConfigured = (): boolean => {
  // Verificar primero las variables de entorno
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return true
  }

  // Si no hay variables de entorno, verificar localStorage
  if (typeof window === "undefined") return false

  try {
    const url = localStorage.getItem("supabaseUrl")
    const key = localStorage.getItem("supabaseKey")

    // Verificar que las credenciales no sean null, undefined o cadenas vacías
    return !!(
      url &&
      url !== "null" &&
      url !== "undefined" &&
      url !== "" &&
      key &&
      key !== "null" &&
      key !== "undefined" &&
      key !== ""
    )
  } catch (error) {
    console.error("Error al verificar credenciales en localStorage:", error)
    return false
  }
}

// Modificar la función initializeDB para que sea más robusta
export const initializeDB = async (): Promise<{
  success: boolean
  online: boolean
  error: string | null
  needsConfiguration: boolean
}> => {
  if (isInitializing) {
    console.log("Ya hay una inicialización en progreso, esperando...")

    // Esperar hasta 20 segundos como máximo
    let attempts = 0
    const maxAttempts = 200 // 20 segundos (200 * 100ms)

    while (isInitializing && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    // Si sigue inicializando después del tiempo máximo, considerarlo como un error
    if (isInitializing) {
      console.error("Tiempo de espera agotado durante la inicialización")
      return {
        success: false,
        online: false,
        error: "Tiempo de espera agotado durante la inicialización",
        needsConfiguration: !areSupabaseCredentialsConfigured(),
      }
    }

    // Si ya se inicializó correctamente, devolver el estado actual
    if (isInitialized && isOnlineMode) {
      return { success: true, online: true, error: null, needsConfiguration: false }
    }

    // Si hubo un error en la inicialización anterior, devolverlo
    if (!isInitialized && connectionError) {
      return {
        success: false,
        online: false,
        error: connectionError,
        needsConfiguration: !areSupabaseCredentialsConfigured(),
      }
    }
  }

  isInitializing = true
  connectionError = null
  console.log("Inicializando sistema de base de datos...")

  // Verificar si las credenciales están configuradas
  if (!areSupabaseCredentialsConfigured()) {
    console.log("Credenciales de Supabase no configuradas")
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
    // Intentar conectar con Supabase
    console.log("Intentando conectar con Supabase...")

    // Intentar la conexión hasta 3 veces
    let supabaseAvailable = false
    let attemptCount = 0
    let lastError = null

    while (!supabaseAvailable && attemptCount < 3) {
      attemptCount++
      console.log(`Intento de conexión a Supabase #${attemptCount}`)

      try {
        // Intentar la conexión con la nueva función que devuelve más información
        const result = await supabaseDB.isSupabaseAvailable()

        if (result.available) {
          console.log("Supabase disponible, usando modo online")
          supabaseAvailable = true
          break
        } else {
          console.log(`Intento #${attemptCount} fallido: ${result.error}`)
          lastError = result.error || "No se pudo verificar la disponibilidad de Supabase"
          // Esperar antes del siguiente intento
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error(`Error en intento #${attemptCount}:`, error)
        lastError = error instanceof Error ? error.message : String(error)
        // Esperar antes del siguiente intento
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    if (supabaseAvailable) {
      isOnlineMode = true
      isInitialized = true
      isInitializing = false
      connectionError = null
      return { success: true, online: true, error: null, needsConfiguration: false }
    } else {
      console.error("Error al conectar con Supabase después de 3 intentos:", lastError)
      isOnlineMode = false
      isInitialized = false
      isInitializing = false
      connectionError = `Error al conectar con Supabase después de 3 intentos: ${lastError}`
      return {
        success: false,
        online: false,
        error: connectionError,
        needsConfiguration: true,
      }
    }
  } catch (error) {
    console.error("Error al inicializar el sistema de base de datos:", error)
    isOnlineMode = false
    isInitialized = false
    isInitializing = false
    connectionError = `Error al inicializar el sistema de base de datos: ${error instanceof Error ? error.message : String(error)}. Verifica tu conexión a internet.`
    return {
      success: false,
      online: false,
      error: connectionError,
      needsConfiguration: true,
    }
  } finally {
    isInitializing = false
  }
}

// Resto del código permanece igual...

// Función para verificar el estado de la conexión
export const getConnectionStatus = () => {
  return {
    isOnlineMode,
    isInitialized,
    isInitializing,
    lastSyncTime,
    connectionError,
    needsConfiguration: !areSupabaseCredentialsConfigured(),
  }
}

// Modificar la función toggleOnlineMode para que no permita cambiar al modo local
export const toggleOnlineMode = async (
  forceOnline: boolean,
): Promise<{
  success: boolean
  online: boolean
  error: string | null
}> => {
  // Si se intenta cambiar a modo local, devolver error
  if (!forceOnline) {
    return {
      success: false,
      online: isOnlineMode,
      error: "El modo local está deshabilitado. El sistema solo funciona en modo online.",
    }
  }

  // Si ya está en modo online, no hacer nada
  if (isOnlineMode) {
    return {
      success: true,
      online: true,
      error: null,
    }
  }

  // Intentar inicializar en modo online
  const result = await initializeDB()
  return {
    success: result.success,
    online: result.online,
    error: result.error,
  }
}

// Función para sincronizar datos locales con Supabase
export const syncWithSupabase = async (): Promise<{
  success: boolean
  error: string | null
}> => {
  if (!isInitialized) {
    return { success: false, error: "El sistema de base de datos no está inicializado" }
  }

  if (!isOnlineMode) {
    return { success: false, error: "No se puede sincronizar en modo local" }
  }

  try {
    console.log("Sincronizando datos con Supabase...")

    // Obtener datos locales
    const localData = await localDB.exportAllData()

    // Guardar productos en Supabase
    await supabaseDB.saveProducts(
      localData.products.map((p) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        price: p.price,
      })),
    )

    // Guardar inventario en Supabase
    await supabaseDB.saveInventory(
      localData.inventory.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    )

    // Guardar registros en Supabase
    for (const record of localData.records) {
      // Convertir el formato del registro para Supabase
      await supabaseDB.saveRecord({
        id: record.id,
        hotel_id: record.hotelId,
        hotel_name: record.hotelName,
        product_id: record.productId,
        product_name: record.productName,
        product_unit: record.productUnit,
        quantity: record.quantity,
        price: record.price,
        date: record.date.toISOString(),
        type: record.type,
      })
    }

    lastSyncTime = new Date()
    console.log("Sincronización completada:", lastSyncTime)

    return { success: true, error: null }
  } catch (error) {
    console.error("Error al sincronizar con Supabase:", error)
    return {
      success: false,
      error: `Error al sincronizar: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Modificar las funciones que interactúan con la base de datos para que requieran modo online

// Ejemplo para saveProduct
export const saveProduct = async (product: localDB.Product): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return false
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return false
  }

  try {
    // Guardar en Supabase
    await supabaseDB.saveProduct({
      id: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      min_stock: product.min_stock,
    })

    // También guardar en la base de datos local como respaldo
    await localDB.saveProduct(product)

    return true
  } catch (error) {
    console.error("Error al guardar producto:", error)
    return false
  }
}

// Modificar las demás funciones que interactúan con la base de datos para que requieran modo online

export const saveProducts = async (products: localDB.Product[]): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return false
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return false
  }

  try {
    // Guardar en Supabase
    await supabaseDB.saveProducts(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        price: p.price,
        min_stock: p.min_stock,
      })),
    )

    // También guardar en la base de datos local como respaldo
    await localDB.saveProducts(products)

    return true
  } catch (error) {
    console.error("Error al guardar productos:", error)
    return false
  }
}

export const getProducts = async (): Promise<localDB.Product[]> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return []
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return []
  }

  try {
    // Obtener de Supabase
    const supabaseProducts = await supabaseDB.getProducts()

    // Convertir al formato local
    const localFormatProducts = supabaseProducts.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      price: p.price,
      min_stock: p.min_stock || 0, // Ensure min_stock is included and has a default value
    }))

    // Actualizar la base de datos local como respaldo
    await localDB.saveProducts(localFormatProducts)

    return localFormatProducts
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

export const saveInventoryItem = async (item: localDB.InventoryItem): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return false
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return false
  }

  try {
    // Guardar en Supabase
    await supabaseDB.saveInventoryItem({
      product_id: item.productId,
      quantity: item.quantity,
    })

    // También guardar en la base de datos local como respaldo
    await localDB.saveInventoryItem(item)

    return true
  } catch (error) {
    console.error("Error al guardar item de inventario:", error)
    return false
  }
}

export const saveInventory = async (inventory: localDB.InventoryItem[]): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return false
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return false
  }

  try {
    // Guardar en Supabase
    await supabaseDB.saveInventory(
      inventory.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    )

    // También guardar en la base de datos local como respaldo
    await localDB.saveInventory(inventory)

    return true
  } catch (error) {
    console.error("Error al guardar inventario:", error)
    return false
  }
}

export const getInventory = async (): Promise<localDB.InventoryItem[]> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return []
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return []
  }

  try {
    // Obtener de Supabase
    const supabaseInventory = await supabaseDB.getInventory()

    // Convertir al formato local
    const localFormatInventory = supabaseInventory.map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
    }))

    // Actualizar la base de datos local como respaldo
    await localDB.saveInventory(localFormatInventory)

    return localFormatInventory
  } catch (error) {
    console.error("Error al obtener inventario:", error)
    return []
  }
}

// Update the saveRecord function to include username in the conversion to Supabase format
export const saveRecord = async (record: localDB.StockRecord): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return false
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return false
  }

  try {
    // Guardar en Supabase
    await supabaseDB.saveRecord({
      id: record.id,
      hotel_id: record.hotelId,
      hotel_name: record.hotelName,
      product_id: record.productId,
      product_name: record.productName,
      product_unit: record.productUnit,
      quantity: record.quantity,
      price: record.price,
      date: record.date.toISOString(),
      type: record.type,
      username: record.username, // Include username
    })

    // También guardar en la base de datos local como respaldo
    await localDB.saveRecord(record)

    return true
  } catch (error) {
    console.error("Error al guardar registro:", error)
    return false
  }
}

// Update the getRecords function to include username in the conversion from Supabase format
export const getRecords = async (): Promise<localDB.StockRecord[]> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return []
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return []
  }

  try {
    // Obtener de Supabase
    const supabaseRecords = await supabaseDB.getRecords()

    // Convertir al formato local
    const localFormatRecords = supabaseRecords.map((record) => ({
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
      username: record.username, // Include username
    }))

    // Actualizar la base de datos local como respaldo
    for (const record of localFormatRecords) {
      await localDB.saveRecord(record)
    }

    return localFormatRecords
  } catch (error) {
    console.error("Error al obtener registros:", error)
    return []
  }
}

// Añadir estas nuevas funciones después de la función getRecords

// Función para eliminar un registro
export const deleteRecord = async (recordId: number): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return false
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return false
  }

  try {
    // Primero obtenemos el registro para poder actualizar el inventario
    const supabase = supabaseDB.getSupabaseClient()
    if (!supabase) return false

    const { data: recordData, error: recordError } = await supabase
      .from("records")
      .select("*")
      .eq("id", recordId)
      .single()

    if (recordError || !recordData) {
      console.error("Error al obtener el registro a eliminar:", recordError)
      return false
    }

    // Obtener el inventario actual
    const inventory = await getInventory()

    // Actualizar el inventario (revertir el efecto del registro)
    const inventoryItem = inventory.find((i) => i.productId === recordData.product_id)
    if (inventoryItem) {
      // Si era una entrada, restamos; si era una salida, sumamos
      const updatedQuantity =
        recordData.type === "entrada"
          ? inventoryItem.quantity - recordData.quantity
          : inventoryItem.quantity + recordData.quantity

      await saveInventoryItem({
        productId: recordData.product_id,
        quantity: updatedQuantity,
      })
    }

    // Eliminar el registro de Supabase
    const { error: deleteError } = await supabase.from("records").delete().eq("id", recordId)

    if (deleteError) {
      console.error("Error al eliminar el registro:", deleteError)
      return false
    }

    // También eliminar de la base de datos local
    // Nota: Esto es una simplificación, en una implementación real
    // necesitaríamos una función específica en local-db.ts
    const localRecords = await localDB.getRecords()
    const updatedRecords = localRecords.filter((r) => r.id !== recordId)

    // Como no tenemos una función directa para eliminar, simulamos reescribiendo todos
    await localDB.clearDatabase()
    for (const record of updatedRecords) {
      await localDB.saveRecord(record)
    }

    return true
  } catch (error) {
    console.error("Error al eliminar registro:", error)
    return false
  }
}

// Update the updateRecord function to include username
export const updateRecord = async (record: localDB.StockRecord): Promise<boolean> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      console.error("No se pudo inicializar la base de datos:", result.error)
      return false
    }
  }

  if (!isOnlineMode) {
    console.error("El sistema solo funciona en modo online")
    return false
  }

  try {
    // Primero obtenemos el registro original para calcular el ajuste de inventario
    const supabase = supabaseDB.getSupabaseClient()
    if (!supabase) return false

    const { data: originalRecord, error: recordError } = await supabase
      .from("records")
      .select("*")
      .eq("id", record.id)
      .single()

    if (recordError || !originalRecord) {
      console.error("Error al obtener el registro original:", recordError)
      return false
    }

    // Obtener el inventario actual
    const inventory = await getInventory()

    // Actualizar el inventario (ajustar según los cambios)
    if (originalRecord.product_id === record.productId) {
      // Si es el mismo producto, solo ajustamos la cantidad
      const inventoryItem = inventory.find((i) => i.productId === record.productId)
      if (inventoryItem) {
        let newQuantity = inventoryItem.quantity

        // Revertir el efecto del registro original
        if (originalRecord.type === "entrada") {
          newQuantity -= originalRecord.quantity
        } else {
          newQuantity += originalRecord.quantity
        }

        // Aplicar el efecto del registro actualizado
        if (record.type === "entrada") {
          newQuantity += record.quantity
        } else {
          newQuantity -= record.quantity
        }

        await saveInventoryItem({
          productId: record.productId,
          quantity: newQuantity,
        })
      }
    } else {
      // Si cambió el producto, ajustamos ambos inventarios
      // Revertir el efecto en el producto original
      const originalInventoryItem = inventory.find((i) => i.productId === originalRecord.product_id)
      if (originalInventoryItem) {
        const originalNewQuantity =
          originalRecord.type === "entrada"
            ? originalInventoryItem.quantity - originalRecord.quantity
            : originalInventoryItem.quantity + originalRecord.quantity

        await saveInventoryItem({
          productId: originalRecord.product_id,
          quantity: originalNewQuantity,
        })
      }

      // Aplicar el efecto en el nuevo producto
      const newInventoryItem = inventory.find((i) => i.productId === record.productId)
      if (newInventoryItem) {
        const newQuantity =
          record.type === "entrada"
            ? newInventoryItem.quantity + record.quantity
            : newInventoryItem.quantity - record.quantity

        await saveInventoryItem({
          productId: record.productId,
          quantity: newQuantity,
        })
      }
    }

    // Guardar el registro actualizado en Supabase
    const { error: updateError } = await supabase
      .from("records")
      .update({
        hotel_id: record.hotelId,
        hotel_name: record.hotelName,
        product_id: record.productId,
        product_name: record.productName,
        product_unit: record.productUnit,
        quantity: record.quantity,
        price: record.price,
        date: record.date.toISOString(),
        type: record.type,
        username: record.username, // Include username
      })
      .eq("id", record.id)

    if (updateError) {
      console.error("Error al actualizar el registro:", updateError)
      return false
    }

    // Actualizar también en la base de datos local
    await localDB.saveRecord(record)

    return true
  } catch (error) {
    console.error("Error al actualizar registro:", error)
    return false
  }
}

// Function to create a backup of all data
export const createBackup = async (): Promise<{
  success: boolean
  data: any | null
  error: string | null
}> => {
  if (!isInitialized) {
    const result = await initializeDB()
    if (!result.success) {
      return {
        success: false,
        data: null,
        error: result.error || "No se pudo inicializar la base de datos",
      }
    }
  }

  if (!isOnlineMode) {
    return {
      success: false,
      data: null,
      error: "El sistema solo funciona en modo online",
    }
  }

  try {
    const data = await exportAllData()
    lastSyncTime = new Date()
    return { success: true, data, error: null }
  } catch (error) {
    console.error("Error al crear copia de seguridad:", error)
    return {
      success: false,
      data: null,
      error: `Error al crear copia de seguridad: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Configurar suscripciones en tiempo real
let inventorySubscription: any = null
let recordsSubscription: any = null

export const setupRealtimeSubscriptions = (
  onInventoryChange: (inventory: localDB.InventoryItem[]) => void,
  onRecordsChange: (records: localDB.StockRecord[]) => void,
) => {
  if (!isOnlineMode) return false

  try {
    // Limpiar suscripciones existentes
    if (inventorySubscription) {
      inventorySubscription.unsubscribe()
    }
    if (recordsSubscription) {
      recordsSubscription.unsubscribe()
    }

    // Suscribirse a cambios en el inventario
    inventorySubscription = supabaseDB.subscribeToInventory(async (supabaseInventory) => {
      // Convertir al formato local
      const localFormatInventory = supabaseInventory.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }))

      // Actualizar la base de datos local
      await localDB.saveInventory(localFormatInventory)

      // Notificar al componente
      onInventoryChange(localFormatInventory)
    })

    // Suscribirse a cambios en los registros
    recordsSubscription = supabaseDB.subscribeToRecords(async (supabaseRecords) => {
      // Convertir al formato local
      const localFormatRecords = supabaseRecords.map((record) => ({
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
      }))

      // Actualizar la base de datos local
      for (const record of localFormatRecords) {
        await localDB.saveRecord(record)
      }

      // Notificar al componente
      onRecordsChange(localFormatRecords)
    })

    return true
  } catch (error) {
    console.error("Error al configurar suscripciones en tiempo real:", error)
    return false
  }
}

// Limpiar suscripciones
export const cleanupRealtimeSubscriptions = () => {
  if (inventorySubscription) {
    inventorySubscription.unsubscribe()
    inventorySubscription = null
  }
  if (recordsSubscription) {
    recordsSubscription.unsubscribe()
    recordsSubscription = null
  }
}

// Hook personalizado para gestionar el estado de la conexión
export const useConnectionStatus = () => {
  const [status, setStatus] = useState({
    isOnlineMode: false,
    isInitialized: false,
    isInitializing: false,
    lastSyncTime: null as Date | null,
    connectionError: null as string | null,
    needsConfiguration: !areSupabaseCredentialsConfigured(),
  })

  useEffect(() => {
    // Actualizar el estado inicial
    setStatus(getConnectionStatus())

    // Actualizar el estado cada 2 segundos
    const interval = setInterval(() => {
      setStatus(getConnectionStatus())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return {
    ...status,
    toggleOnlineMode,
    syncWithSupabase,
    initializeDB,
  }
}

export const exportAllData = localDB.exportAllData
export const importAllData = localDB.importAllData
