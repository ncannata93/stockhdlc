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

// Función para inicializar el sistema de base de datos
export const initializeDB = async (
  forceOnlineMode = false,
): Promise<{
  success: boolean
  online: boolean
  error: string | null
}> => {
  if (isInitializing) {
    console.log("Ya hay una inicialización en progreso, esperando...")
    // Esperar a que termine la inicialización actual
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(checkInterval)
          resolve(true)
        }
      }, 100)
    })
  }

  isInitializing = true
  console.log("Inicializando sistema de base de datos...")

  try {
    // Intentar inicializar Supabase primero si se fuerza el modo online
    if (forceOnlineMode) {
      console.log("Forzando modo online, intentando conectar con Supabase...")
      try {
        const supabaseAvailable = await supabaseDB.isSupabaseAvailable()

        if (supabaseAvailable) {
          console.log("Supabase disponible, usando modo online")
          isOnlineMode = true
          isInitialized = true
          isInitializing = false
          return { success: true, online: true, error: null }
        } else {
          console.error("Error al conectar con Supabase")
          isOnlineMode = false
          isInitialized = true
          isInitializing = false
          return {
            success: true,
            online: false,
            error: `No se pudo conectar con Supabase. Usando modo local.`,
          }
        }
      } catch (error) {
        console.error("Error inesperado al conectar con Supabase:", error)
        isOnlineMode = false
        isInitialized = true
        isInitializing = false
        return {
          success: true,
          online: false,
          error: `Error inesperado al conectar con Supabase: ${error instanceof Error ? error.message : String(error)}. Usando modo local.`,
        }
      }
    } else {
      // Intentar inicializar Supabase, pero no forzar
      console.log("Intentando conectar con Supabase...")
      try {
        const supabaseAvailable = await supabaseDB.isSupabaseAvailable()

        if (supabaseAvailable) {
          console.log("Supabase disponible, usando modo online")
          isOnlineMode = true
          isInitialized = true
          isInitializing = false
          return { success: true, online: true, error: null }
        } else {
          console.log("Supabase no disponible, usando modo local")
          isOnlineMode = false
          isInitialized = true
          isInitializing = false
          return {
            success: true,
            online: false,
            error: null, // No mostramos error al usuario si no se forzó el modo online
          }
        }
      } catch (error) {
        console.log("Error al conectar con Supabase, usando modo local:", error)
        isOnlineMode = false
        isInitialized = true
        isInitializing = false
        return {
          success: true,
          online: false,
          error: null, // No mostramos error al usuario si no se forzó el modo online
        }
      }
    }
  } catch (error) {
    console.error("Error al inicializar el sistema de base de datos:", error)
    isOnlineMode = false
    isInitialized = true
    isInitializing = false
    return {
      success: true, // Aún consideramos exitoso porque podemos usar el modo local
      online: false,
      error: null, // No mostramos error al usuario para no interrumpir la experiencia
    }
  }
}

// Función para verificar el estado de la conexión
export const getConnectionStatus = () => {
  return {
    isOnlineMode,
    isInitialized,
    isInitializing,
    lastSyncTime,
  }
}

// Función para cambiar entre modo online y local
export const toggleOnlineMode = async (
  forceOnline: boolean,
): Promise<{
  success: boolean
  online: boolean
  error: string | null
}> => {
  if (forceOnline === isOnlineMode) {
    return {
      success: true,
      online: isOnlineMode,
      error: null,
    }
  }

  return initializeDB(forceOnline)
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

// Funciones para productos
export const saveProduct = async (product: localDB.Product): Promise<boolean> => {
  if (!isInitialized) {
    await initializeDB()
  }

  try {
    // Guardar en la base de datos local primero
    const localResult = await localDB.saveProduct(product)

    // Si estamos en modo online, también guardar en Supabase
    if (isOnlineMode) {
      await supabaseDB.saveProduct({
        id: product.id,
        name: product.name,
        unit: product.unit,
        price: product.price,
      })
    }

    return localResult
  } catch (error) {
    console.error("Error al guardar producto:", error)
    return false
  }
}

export const saveProducts = async (products: localDB.Product[]): Promise<boolean> => {
  if (!isInitialized) {
    await initializeDB()
  }

  try {
    // Guardar en la base de datos local primero
    const localResult = await localDB.saveProducts(products)

    // Si estamos en modo online, también guardar en Supabase
    if (isOnlineMode) {
      await supabaseDB.saveProducts(
        products.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          price: p.price,
        })),
      )
    }

    return localResult
  } catch (error) {
    console.error("Error al guardar productos:", error)
    return false
  }
}

export const getProducts = async (): Promise<localDB.Product[]> => {
  if (!isInitialized) {
    await initializeDB()
  }

  try {
    if (isOnlineMode) {
      // Intentar obtener de Supabase primero
      const supabaseProducts = await supabaseDB.getProducts()

      if (supabaseProducts.length > 0) {
        // Convertir al formato local
        const localFormatProducts = supabaseProducts.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          price: p.price,
        }))

        // Actualizar la base de datos local con los datos de Supabase
        await localDB.saveProducts(localFormatProducts)
        return localFormatProducts
      }
    }

    // Si no estamos en modo online o no hay datos en Supabase, usar la base de datos local
    return await localDB.getProducts()
  } catch (error) {
    console.error("Error al obtener productos:", error)
    // En caso de error, intentar obtener de la base de datos local
    return await localDB.getProducts()
  }
}

// Funciones para inventario
export const saveInventoryItem = async (item: localDB.InventoryItem): Promise<boolean> => {
  if (!isInitialized) {
    await initializeDB()
  }

  try {
    // Guardar en la base de datos local primero
    const localResult = await localDB.saveInventoryItem(item)

    // Si estamos en modo online, también guardar en Supabase
    if (isOnlineMode) {
      await supabaseDB.saveInventoryItem({
        product_id: item.productId,
        quantity: item.quantity,
      })
    }

    return localResult
  } catch (error) {
    console.error("Error al guardar item de inventario:", error)
    return false
  }
}

export const saveInventory = async (inventory: localDB.InventoryItem[]): Promise<boolean> => {
  if (!isInitialized) {
    await initializeDB()
  }

  try {
    // Guardar en la base de datos local primero
    const localResult = await localDB.saveInventory(inventory)

    // Si estamos en modo online, también guardar en Supabase
    if (isOnlineMode) {
      await supabaseDB.saveInventory(
        inventory.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      )
    }

    return localResult
  } catch (error) {
    console.error("Error al guardar inventario:", error)
    return false
  }
}

export const getInventory = async (): Promise<localDB.InventoryItem[]> => {
  if (!isInitialized) {
    await initializeDB()
  }

  try {
    if (isOnlineMode) {
      // Intentar obtener de Supabase primero
      const supabaseInventory = await supabaseDB.getInventory()

      if (supabaseInventory.length > 0) {
        // Convertir al formato local
        const localFormatInventory = supabaseInventory.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
        }))

        // Actualizar la base de datos local con los datos de Supabase
        await localDB.saveInventory(localFormatInventory)
        return localFormatInventory
      }
    }

    // Si no estamos en modo online o no hay datos en Supabase, usar la base de datos local
    return await localDB.getInventory()
  } catch (error) {
    console.error("Error al obtener inventario:", error)
    // En caso de error, intentar obtener de la base de datos local
    return await localDB.getInventory()
  }
}

// Funciones para registros
export const saveRecord = async (record: localDB.StockRecord): Promise<boolean> => {
  if (!isInitialized) {
    await initializeDB()
  }

  try {
    // Guardar en la base de datos local primero
    const localResult = await localDB.saveRecord(record)

    // Si estamos en modo online, también guardar en Supabase
    if (isOnlineMode) {
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

    return localResult
  } catch (error) {
    console.error("Error al guardar registro:", error)
    return false
  }
}

export const getRecords = async (): Promise<localDB.StockRecord[]> => {
  if (!isInitialized) {
    await initializeDB()
  }

  try {
    if (isOnlineMode) {
      // Intentar obtener de Supabase primero
      const supabaseRecords = await supabaseDB.getRecords()

      if (supabaseRecords.length > 0) {
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

        // Actualizar la base de datos local con los datos de Supabase
        for (const record of localFormatRecords) {
          await localDB.saveRecord(record)
        }

        return localFormatRecords
      }
    }

    // Si no estamos en modo online o no hay datos en Supabase, usar la base de datos local
    return await localDB.getRecords()
  } catch (error) {
    console.error("Error al obtener registros:", error)
    // En caso de error, intentar obtener de la base de datos local
    return await localDB.getRecords()
  }
}

// Function to create a backup of all data
export const createBackup = async (): Promise<{
  success: boolean
  data: any | null
  error: string | null
}> => {
  if (!isInitialized) {
    await initializeDB()
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
