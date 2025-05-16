// Tipos para la base de datos local
export type Product = {
  id: number
  name: string
  unit: string
  price: number
  min_stock: number
}

export type InventoryItem = {
  productId: number
  quantity: number
}

// Update the StockRecord type to include username
export type StockRecord = {
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
  username: string | null // Add username field
}

// Nombre de la base de datos
const DB_NAME = "hoteles-stock-db"
const DB_VERSION = 1

// Nombres de los almacenes
const STORES = {
  PRODUCTS: "products",
  INVENTORY: "inventory",
  RECORDS: "records",
}

// Función para abrir la conexión a la base de datos
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error("Error al abrir la base de datos:", event)
      reject(new Error("No se pudo abrir la base de datos"))
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Crear almacenes si no existen
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        db.createObjectStore(STORES.PRODUCTS, { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        db.createObjectStore(STORES.INVENTORY, { keyPath: "productId" })
      }

      if (!db.objectStoreNames.contains(STORES.RECORDS)) {
        const recordsStore = db.createObjectStore(STORES.RECORDS, { keyPath: "id" })
        // Crear índice para ordenar por fecha
        recordsStore.createIndex("date", "date", { unique: false })
      }
    }
  })
}

// Función genérica para guardar datos
export async function saveData<T>(storeName: string, data: T): Promise<boolean> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (event) => {
        console.error(`Error al guardar en ${storeName}:`, event)
        reject(new Error(`Error al guardar en ${storeName}`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error(`Error en saveData (${storeName}):`, error)
    return false
  }
}

// Función genérica para guardar múltiples datos
export async function saveMultipleData<T>(storeName: string, dataArray: T[]): Promise<boolean> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)

      let successCount = 0
      dataArray.forEach((item) => {
        const request = store.put(item)
        request.onsuccess = () => {
          successCount++
          if (successCount === dataArray.length) {
            resolve(true)
          }
        }
        request.onerror = (event) => {
          console.error(`Error al guardar en ${storeName}:`, event)
          reject(new Error(`Error al guardar en ${storeName}`))
        }
      })

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error(`Error en saveMultipleData (${storeName}):`, error)
    return false
  }
}

// Función genérica para obtener todos los datos
export async function getAllData<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result as T[]
        resolve(result)
      }

      request.onerror = (event) => {
        console.error(`Error al obtener datos de ${storeName}:`, event)
        reject(new Error(`Error al obtener datos de ${storeName}`))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error(`Error en getAllData (${storeName}):`, error)
    return []
  }
}

// Función para obtener registros ordenados por fecha
export async function getRecordsOrderedByDate(): Promise<StockRecord[]> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.RECORDS, "readonly")
      const store = transaction.objectStore(STORES.RECORDS)
      const index = store.index("date")

      // Corregido: usar "prev" en lugar de "desc" para orden descendente
      const request = index.openCursor(null, "prev")

      const records: StockRecord[] = []

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue
        if (cursor) {
          // Convertir la fecha de string a Date
          const record = cursor.value
          if (typeof record.date === "string") {
            record.date = new Date(record.date)
          }
          records.push(record)
          cursor.continue()
        } else {
          resolve(records)
        }
      }

      request.onerror = (event) => {
        console.error("Error al obtener registros ordenados:", event)
        reject(new Error("Error al obtener registros ordenados"))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error("Error en getRecordsOrderedByDate:", error)
    return []
  }
}

// Funciones específicas para productos
export async function saveProduct(product: Product): Promise<boolean> {
  return saveData<Product>(STORES.PRODUCTS, product)
}

export async function saveProducts(products: Product[]): Promise<boolean> {
  return saveMultipleData<Product>(STORES.PRODUCTS, products)
}

export async function getProducts(): Promise<Product[]> {
  return getAllData<Product>(STORES.PRODUCTS)
}

// Funciones específicas para inventario
export async function saveInventoryItem(item: InventoryItem): Promise<boolean> {
  return saveData<InventoryItem>(STORES.INVENTORY, item)
}

export async function saveInventory(inventory: InventoryItem[]): Promise<boolean> {
  return saveMultipleData<InventoryItem>(STORES.INVENTORY, inventory)
}

export async function getInventory(): Promise<InventoryItem[]> {
  return getAllData<InventoryItem>(STORES.INVENTORY)
}

// Funciones específicas para registros
export async function saveRecord(record: StockRecord): Promise<boolean> {
  // Asegurarse de que la fecha se guarde correctamente
  const recordToSave = {
    ...record,
    date: record.date instanceof Date ? record.date : new Date(record.date),
  }
  return saveData<StockRecord>(STORES.RECORDS, recordToSave)
}

export async function getRecords(): Promise<StockRecord[]> {
  return getRecordsOrderedByDate()
}

// Función para exportar todos los datos
export async function exportAllData(): Promise<{
  products: Product[]
  inventory: InventoryItem[]
  records: StockRecord[]
}> {
  const products = await getProducts()
  const inventory = await getInventory()
  const records = await getRecords()

  return {
    products,
    inventory,
    records,
  }
}

// Función para importar todos los datos
export async function importAllData(data: {
  products: Product[]
  inventory: InventoryItem[]
  records: StockRecord[]
}): Promise<boolean> {
  try {
    await saveProducts(data.products)
    await saveInventory(data.inventory)

    // Asegurarse de que las fechas se guarden correctamente
    const recordsWithDates = data.records.map((record) => ({
      ...record,
      date: record.date instanceof Date ? record.date : new Date(record.date),
    }))
    await saveMultipleData<StockRecord>(STORES.RECORDS, recordsWithDates)

    return true
  } catch (error) {
    console.error("Error al importar datos:", error)
    return false
  }
}

// Función para limpiar la base de datos (útil para pruebas o reinicio)
export async function clearDatabase(): Promise<boolean> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PRODUCTS, STORES.INVENTORY, STORES.RECORDS], "readwrite")

      let completedStores = 0
      const totalStores = 3

      const checkCompletion = () => {
        completedStores++
        if (completedStores === totalStores) {
          resolve(true)
        }
      }

      const productsStore = transaction.objectStore(STORES.PRODUCTS)
      const inventoryStore = transaction.objectStore(STORES.INVENTORY)
      const recordsStore = transaction.objectStore(STORES.RECORDS)

      const clearProducts = productsStore.clear()
      clearProducts.onsuccess = checkCompletion
      clearProducts.onerror = (event) => {
        console.error("Error al limpiar productos:", event)
        reject(new Error("Error al limpiar productos"))
      }

      const clearInventory = inventoryStore.clear()
      clearInventory.onsuccess = checkCompletion
      clearInventory.onerror = (event) => {
        console.error("Error al limpiar inventario:", event)
        reject(new Error("Error al limpiar inventario"))
      }

      const clearRecords = recordsStore.clear()
      clearRecords.onsuccess = checkCompletion
      clearRecords.onerror = (event) => {
        console.error("Error al limpiar registros:", event)
        reject(new Error("Error al limpiar registros"))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error("Error al limpiar la base de datos:", error)
    return false
  }
}
