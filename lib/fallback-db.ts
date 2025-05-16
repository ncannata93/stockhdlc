// Base de datos de respaldo mínima para el modo de emergencia
// Proporciona funcionalidad básica sin depender de IndexedDB o Supabase

// Almacenamiento en memoria para datos
let memoryProducts = [
  { id: 1, name: "Leche", unit: "litros", price: 1200, min_stock: 5 },
  { id: 2, name: "Cafe", unit: "kg", price: 5000, min_stock: 3 },
  { id: 3, name: "azucar", unit: "kg", price: 1800, min_stock: 10 },
  { id: 4, name: "jabon", unit: "caja", price: 3500, min_stock: 5 },
  { id: 5, name: "papel higienico", unit: "bolson", price: 4200, min_stock: 2 },
  { id: 6, name: "shampoo", unit: "caja", price: 2800, min_stock: 5 },
]

let memoryInventory = [
  { productId: 1, quantity: 10 },
  { productId: 2, quantity: 5 },
  { productId: 3, quantity: 15 },
  { productId: 4, quantity: 8 },
  { productId: 5, quantity: 3 },
  { productId: 6, quantity: 7 },
]

let memoryRecords = []

// Tipos
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
}

// Funciones para productos
export const getProducts = async (): Promise<Product[]> => {
  return [...memoryProducts]
}

export const saveProduct = async (product: Product): Promise<boolean> => {
  const index = memoryProducts.findIndex((p) => p.id === product.id)
  if (index >= 0) {
    memoryProducts[index] = product
  } else {
    memoryProducts.push(product)
  }
  return true
}

export const saveProducts = async (products: Product[]): Promise<boolean> => {
  products.forEach((product) => {
    const index = memoryProducts.findIndex((p) => p.id === product.id)
    if (index >= 0) {
      memoryProducts[index] = product
    } else {
      memoryProducts.push(product)
    }
  })
  return true
}

// Funciones para inventario
export const getInventory = async (): Promise<InventoryItem[]> => {
  return [...memoryInventory]
}

export const saveInventoryItem = async (item: InventoryItem): Promise<boolean> => {
  const index = memoryInventory.findIndex((i) => i.productId === item.productId)
  if (index >= 0) {
    memoryInventory[index] = item
  } else {
    memoryInventory.push(item)
  }
  return true
}

export const saveInventory = async (inventory: InventoryItem[]): Promise<boolean> => {
  inventory.forEach((item) => {
    const index = memoryInventory.findIndex((i) => i.productId === item.productId)
    if (index >= 0) {
      memoryInventory[index] = item
    } else {
      memoryInventory.push(item)
    }
  })
  return true
}

// Funciones para registros
export const getRecords = async (): Promise<StockRecord[]> => {
  return [...memoryRecords].sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const saveRecord = async (record: StockRecord): Promise<boolean> => {
  const index = memoryRecords.findIndex((r) => r.id === record.id)
  if (index >= 0) {
    memoryRecords[index] = record
  } else {
    memoryRecords.push(record)
  }
  return true
}

// Exportar/Importar datos
export const exportAllData = async () => {
  return {
    products: memoryProducts,
    inventory: memoryInventory,
    records: memoryRecords,
  }
}

export const importAllData = async (data: {
  products: Product[]
  inventory: InventoryItem[]
  records: StockRecord[]
}): Promise<boolean> => {
  memoryProducts = [...data.products]
  memoryInventory = [...data.inventory]
  memoryRecords = [...data.records]
  return true
}

// Función para inicializar con datos por defecto
export const initializeWithDefaultData = async (): Promise<boolean> => {
  // Productos ya están inicializados

  // Asegurarse de que el inventario esté inicializado para todos los productos
  memoryProducts.forEach((product) => {
    if (!memoryInventory.some((item) => item.productId === product.id)) {
      memoryInventory.push({
        productId: product.id,
        quantity: 0,
      })
    }
  })

  return true
}
