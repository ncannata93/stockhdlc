import * as supabaseDB from "@/lib/supabase"

// Productos por defecto
const defaultProducts = [
  { id: 1, name: "Leche", unit: "litros", price: 1200, min_stock: 5 },
  { id: 2, name: "Cafe", unit: "kg", price: 5000, min_stock: 2 },
  { id: 3, name: "azucar", unit: "kg", price: 1800, min_stock: 3 },
  { id: 4, name: "jabon", unit: "caja", price: 3500, min_stock: 10 },
  { id: 5, name: "papel higienico", unit: "bolson", price: 4200, min_stock: 5 },
  { id: 6, name: "shampoo", unit: "caja", price: 2800, min_stock: 8 },
]

// Función para sembrar datos iniciales en la base de datos
export const seedInitialData = async (): Promise<boolean> => {
  try {
    console.log("Verificando si se necesita sembrar datos iniciales...")

    // Verificar si ya hay productos en la base de datos
    const existingProducts = await supabaseDB.getProducts()

    if (existingProducts.length > 0) {
      console.log("Ya existen productos en la base de datos, no es necesario sembrar datos")
      return true
    }

    console.log("No hay productos en la base de datos, sembrando datos iniciales...")

    // Guardar productos
    const productsResult = await supabaseDB.saveProducts(defaultProducts)

    if (!productsResult) {
      console.error("Error al sembrar productos")
      return false
    }

    // Inicializar inventario con cantidad 0 para cada producto
    const initialInventory = defaultProducts.map((product) => ({
      product_id: product.id,
      quantity: 0,
    }))

    const inventoryResult = await supabaseDB.saveInventory(initialInventory)

    if (!inventoryResult) {
      console.error("Error al sembrar inventario")
      return false
    }

    console.log("Datos iniciales sembrados correctamente")
    return true
  } catch (error) {
    console.error("Error al sembrar datos iniciales:", error)
    return false
  }
}
