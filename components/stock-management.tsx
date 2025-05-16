"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  initializeDB,
  getProducts,
  getInventory,
  getRecords,
  saveProduct,
  saveInventoryItem,
  saveRecord,
} from "@/lib/db-manager"
import { Loader2, AlertTriangle, RefreshCw, Database, Key, Plus, Edit, ArrowUp, ArrowDown, Trash2 } from "lucide-react"
import type { Product, InventoryItem, StockRecord } from "@/lib/local-db"

// Lista predefinida de hoteles
const PREDEFINED_HOTELS = [
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

// Componente StockManagement actualizado para mostrar la interfaz completa
export default function StockManagement() {
  // Añadir "admin" a los tipos de pestañas activas
  const [activeTab, setActiveTab] = useState<"inventory" | "products" | "records" | "hotelSummary" | "admin">(
    "inventory",
  )

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showFullError, setShowFullError] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Datos de la aplicación
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [records, setRecords] = useState<StockRecord[]>([])

  // Estado para la interfaz
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")

  // Estados para formularios
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [isAddingRecord, setIsAddingRecord] = useState(false)
  const [recordType, setRecordType] = useState<"entrada" | "salida">("entrada")

  // Añadir estos estados para la funcionalidad de administrador
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [isEditingRecord, setIsEditingRecord] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<StockRecord | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null)

  // Cargar las credenciales guardadas al inicio
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem("supabaseUrl") || ""
      const savedKey = localStorage.getItem("supabaseKey") || ""
      setSupabaseUrl(savedUrl)
      setSupabaseKey(savedKey)
    } catch (error) {
      console.error("Error al cargar credenciales:", error)
    }
  }, [])

  useEffect(() => {
    const connectToSupabase = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log("Intentando conectar a Supabase...")
        const result = await initializeDB()

        if (result.success) {
          console.log("Conexión exitosa a Supabase")
          setIsConnected(true)

          // Cargar datos iniciales
          try {
            const [productsData, inventoryData, recordsData] = await Promise.all([
              getProducts(),
              getInventory(),
              getRecords(),
            ])

            setProducts(productsData)
            setInventory(inventoryData)
            setRecords(recordsData)
            console.log("Datos iniciales cargados con éxito")
          } catch (dataError) {
            console.error("Error al cargar datos iniciales:", dataError)
            setError(
              `Conexión establecida pero error al cargar datos: ${dataError instanceof Error ? dataError.message : String(dataError)}`,
            )
          }

          setIsLoading(false)
        } else {
          console.error("Error al conectar a Supabase:", result.error)
          setError(result.error || "Error desconocido al conectar con Supabase")
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Excepción al conectar a Supabase:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
        setIsLoading(false)
      }
    }

    connectToSupabase()
  }, [retryCount])

  // Función para manejar el cambio en el select de hotel
  useEffect(() => {
    const handleHotelSelectChange = () => {
      const hotelSelect = document.querySelector('select[name="hotelName"]') as HTMLSelectElement
      const newHotelInput = document.getElementById("newHotelInput")

      if (hotelSelect && newHotelInput) {
        if (hotelSelect.value === "nuevo") {
          newHotelInput.classList.remove("hidden")
          const input = document.getElementById("newHotelName") as HTMLInputElement
          if (input) {
            input.required = true
            input.focus()
          }
        } else {
          newHotelInput.classList.add("hidden")
          const input = document.getElementById("newHotelName") as HTMLInputElement
          if (input) {
            input.required = false
          }
        }
      }
    }

    // Añadir el event listener cuando se abre el modal
    if (isAddingRecord && recordType === "salida") {
      setTimeout(() => {
        const hotelSelect = document.querySelector('select[name="hotelName"]')
        if (hotelSelect) {
          hotelSelect.addEventListener("change", handleHotelSelectChange)
        }
      }, 100)
    }

    // Limpiar el event listener
    return () => {
      const hotelSelect = document.querySelector('select[name="hotelName"]')
      if (hotelSelect) {
        hotelSelect.removeEventListener("change", handleHotelSelectChange)
      }
    }
  }, [isAddingRecord, recordType])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleResetConfig = () => {
    try {
      localStorage.removeItem("supabaseUrl")
      localStorage.removeItem("supabaseKey")
      // Eliminar también la bandera de modo local si existe
      localStorage.removeItem("useLocalMode")
      setSupabaseUrl("")
      setSupabaseKey("")
      alert("Configuración reiniciada. Se intentará reconectar.")
      handleRetry()
    } catch (error) {
      alert("Error al reiniciar configuración: " + error)
    }
  }

  const handleSaveConfig = () => {
    try {
      if (!supabaseUrl || !supabaseKey) {
        alert("Por favor ingresa ambos valores")
        return
      }

      localStorage.setItem("supabaseUrl", supabaseUrl)
      localStorage.setItem("supabaseKey", supabaseKey)
      alert("Configuración guardada. Reintentando conexión...")
      handleRetry()
    } catch (error) {
      alert("Error al guardar configuración: " + error)
    }
  }

  // Función para obtener el nombre del producto por ID
  const getProductName = (productId: number) => {
    const product = products.find((p) => p.id === productId)
    return product ? product.name : "Producto desconocido"
  }

  // Función para obtener la unidad del producto por ID
  const getProductUnit = (productId: number) => {
    const product = products.find((p) => p.id === productId)
    return product ? product.unit : ""
  }

  // Función para obtener la cantidad en inventario por ID de producto
  const getInventoryQuantity = (productId: number) => {
    const item = inventory.find((i) => i.productId === productId)
    return item ? item.quantity : 0
  }

  // Función para obtener la lista única de hoteles de los registros existentes y la lista predefinida
  const getUniqueHotels = () => {
    // Obtener hoteles de los registros existentes
    const hotelsFromRecords = records
      .filter((record) => record.type === "salida" && record.hotelName)
      .map((record) => record.hotelName)
      .filter((hotel): hotel is string => hotel !== null)

    // Combinar con la lista predefinida y eliminar duplicados
    const allHotels = [...new Set([...PREDEFINED_HOTELS, ...hotelsFromRecords])]

    // Ordenar alfabéticamente
    return allHotels.sort((a, b) => a.localeCompare(b))
  }

  // Función para añadir un nuevo producto
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const newProduct: Product = {
      id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      name: formData.get("name") as string,
      unit: formData.get("unit") as string,
      price: Number.parseFloat(formData.get("price") as string),
      min_stock: Number.parseInt(formData.get("min_stock") as string, 10),
    }

    try {
      const success = await saveProduct(newProduct)
      if (success) {
        setProducts([...products, newProduct])
        // Inicializar inventario para este producto
        const newInventoryItem: InventoryItem = {
          productId: newProduct.id,
          quantity: 0,
        }
        await saveInventoryItem(newInventoryItem)
        setInventory([...inventory, newInventoryItem])
        setIsAddingProduct(false)
        form.reset()
      } else {
        alert("Error al guardar el producto")
      }
    } catch (error) {
      console.error("Error al guardar producto:", error)
      alert(`Error al guardar el producto: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Función para editar un producto
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProduct) return

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const updatedProduct: Product = {
      id: currentProduct.id,
      name: formData.get("name") as string,
      unit: formData.get("unit") as string,
      price: Number.parseFloat(formData.get("price") as string),
      min_stock: Number.parseInt(formData.get("min_stock") as string, 10),
    }

    try {
      const success = await saveProduct(updatedProduct)
      if (success) {
        setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)))
        setIsEditingProduct(false)
        setCurrentProduct(null)
      } else {
        alert("Error al actualizar el producto")
      }
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      alert(`Error al actualizar el producto: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Añadir esta función para verificar la contraseña de administrador
  const checkAdminPassword = () => {
    // En una aplicación real, esto debería ser más seguro
    // Por ejemplo, usando una verificación en el servidor
    const correctPassword = "admin123" // Cambia esto a una contraseña más segura

    if (adminPassword === correctPassword) {
      setIsAdminMode(true)
      return true
    } else {
      alert("Contraseña incorrecta")
      return false
    }
  }

  // Añadir esta función para editar un registro
  const handleEditRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentRecord) return

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const productId = Number.parseInt(formData.get("productId") as string, 10)
    const quantity = Number.parseInt(formData.get("quantity") as string, 10)
    const product = products.find((p) => p.id === productId)

    if (!product) {
      alert("Producto no encontrado")
      return
    }

    // Manejar el nombre del hotel
    let hotelName = formData.get("hotelName") as string

    // Si se seleccionó "nuevo", usar el valor del campo de texto
    if (hotelName === "nuevo") {
      const newHotelNameInput = document.getElementById("newHotelName") as HTMLInputElement
      if (newHotelNameInput && newHotelNameInput.value) {
        hotelName = newHotelNameInput.value
      } else {
        alert("Por favor ingresa el nombre del nuevo hotel")
        return
      }
    }

    const recordType = formData.get("recordType") as "entrada" | "salida"

    const updatedRecord: StockRecord = {
      ...currentRecord,
      productId,
      productName: product.name,
      productUnit: product.unit,
      quantity,
      price: product.price,
      hotelName: recordType === "salida" ? hotelName : null,
      type: recordType,
    }

    try {
      // Importar la función updateRecord desde db-manager
      const { updateRecord } = await import("@/lib/db-manager")

      const success = await updateRecord(updatedRecord)
      if (success) {
        // Actualizar la lista de registros
        setRecords(records.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)))
        setIsEditingRecord(false)
        setCurrentRecord(null)
      } else {
        alert("Error al actualizar el registro")
      }
    } catch (error) {
      console.error("Error al actualizar registro:", error)
      alert(`Error al actualizar el registro: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Añadir esta función para eliminar un registro
  const handleDeleteRecord = async (recordId: number) => {
    try {
      // Importar la función deleteRecord desde db-manager
      const { deleteRecord } = await import("@/lib/db-manager")

      const success = await deleteRecord(recordId)
      if (success) {
        // Actualizar la lista de registros
        setRecords(records.filter((r) => r.id !== recordId))
        setIsConfirmingDelete(false)
        setRecordToDelete(null)
      } else {
        alert("Error al eliminar el registro")
      }
    } catch (error) {
      console.error("Error al eliminar registro:", error)
      alert(`Error al eliminar el registro: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Función para añadir un registro (entrada o salida)
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const productId = Number.parseInt(formData.get("productId") as string, 10)
    const quantity = Number.parseInt(formData.get("quantity") as string, 10)
    const product = products.find((p) => p.id === productId)

    if (!product) {
      alert("Producto no encontrado")
      return
    }

    // Manejar el nombre del hotel
    let hotelName = formData.get("hotelName") as string

    // Si se seleccionó "nuevo", usar el valor del campo de texto
    if (hotelName === "nuevo") {
      const newHotelNameInput = document.getElementById("newHotelName") as HTMLInputElement
      if (newHotelNameInput && newHotelNameInput.value) {
        hotelName = newHotelNameInput.value
      } else {
        alert("Por favor ingresa el nombre del nuevo hotel")
        return
      }
    }

    const newRecord: StockRecord = {
      id: records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1,
      hotelId: null,
      hotelName: hotelName || null,
      productId,
      productName: product.name,
      productUnit: product.unit,
      quantity,
      price: product.price,
      date: new Date(),
      type: recordType,
    }

    try {
      const success = await saveRecord(newRecord)
      if (success) {
        setRecords([newRecord, ...records])

        // Actualizar inventario
        const currentItem = inventory.find((i) => i.productId === productId)
        if (currentItem) {
          const newQuantity =
            recordType === "entrada" ? currentItem.quantity + quantity : currentItem.quantity - quantity

          const updatedItem: InventoryItem = {
            ...currentItem,
            quantity: newQuantity,
          }

          await saveInventoryItem(updatedItem)
          setInventory(inventory.map((i) => (i.productId === productId ? updatedItem : i)))
        }

        setIsAddingRecord(false)
        form.reset()
      } else {
        alert("Error al guardar el registro")
      }
    } catch (error) {
      console.error("Error al guardar registro:", error)
      alert(`Error al guardar el registro: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Añadir la función generateHotelSummary antes de la función de renderizado (return)
  // Añadir esta función antes del return final
  const generateHotelSummary = () => {
    // Si no hay registros, mostrar mensaje
    if (records.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">No hay registros de movimientos para generar el resumen.</div>
      )
    }

    // Filtrar solo los registros de salida (los que van a hoteles)
    const hotelRecords = records.filter((record) => record.type === "salida" && record.hotelName)

    if (hotelRecords.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No hay registros de salidas a hoteles para generar el resumen.
        </div>
      )
    }

    // Obtener lista única de hoteles
    const hotels = [...new Set(hotelRecords.map((record) => record.hotelName))]

    // Obtener lista única de productos
    const productIds = [...new Set(hotelRecords.map((record) => record.productId))]

    // Crear estructura para el resumen
    const summary: {
      [hotelName: string]: {
        [productId: number]: {
          quantity: number
          total: number
          productName: string
          productUnit: string
        }
        total: number
      }
    } = {}

    // Inicializar estructura
    hotels.forEach((hotel) => {
      if (hotel) {
        summary[hotel] = { total: 0 }
        productIds.forEach((productId) => {
          const product = products.find((p) => p.id === productId)
          if (product) {
            summary[hotel][productId] = {
              quantity: 0,
              total: 0,
              productName: product.name,
              productUnit: product.unit,
            }
          }
        })
      }
    })

    // Calcular totales
    hotelRecords.forEach((record) => {
      if (record.hotelName) {
        const hotel = record.hotelName
        const productId = record.productId
        const total = record.quantity * record.price

        if (!summary[hotel][productId]) {
          summary[hotel][productId] = {
            quantity: 0,
            total: 0,
            productName: record.productName,
            productUnit: record.productUnit,
          }
        }

        summary[hotel][productId].quantity += record.quantity
        summary[hotel][productId].total += total
        summary[hotel].total += total
      }
    })

    // Calcular totales por producto (para todas las columnas)
    const productTotals: {
      [productId: number]: {
        quantity: number
        total: number
        productName: string
      }
    } = {}

    productIds.forEach((productId) => {
      const product = products.find((p) => p.id === productId)
      if (product) {
        productTotals[productId] = {
          quantity: 0,
          total: 0,
          productName: product.name,
        }

        hotels.forEach((hotel) => {
          if (hotel && summary[hotel][productId]) {
            productTotals[productId].quantity += summary[hotel][productId].quantity
            productTotals[productId].total += summary[hotel][productId].total
          }
        })
      }
    })

    // Calcular gran total
    const grandTotal = Object.values(summary).reduce((acc, hotel) => acc + hotel.total, 0)

    return (
      <div>
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 border-b text-left">Hotel / Producto</th>
              {productIds.map((productId) => {
                const product = products.find((p) => p.id === productId)
                return (
                  <th key={productId} className="py-2 px-4 border-b text-left">
                    {product ? product.name : `Producto ${productId}`}
                  </th>
                )
              })}
              <th className="py-2 px-4 border-b text-left font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => {
              if (!hotel) return null
              return (
                <tr key={hotel}>
                  <td className="py-2 px-4 border-b font-medium">{hotel}</td>
                  {productIds.map((productId) => {
                    const productSummary = summary[hotel][productId]
                    if (!productSummary) {
                      return (
                        <td key={productId} className="py-2 px-4 border-b">
                          -
                        </td>
                      )
                    }
                    return (
                      <td key={productId} className="py-2 px-4 border-b">
                        <div>
                          {productSummary.quantity} {productSummary.productUnit}
                        </div>
                        <div className="text-gray-600">${productSummary.total.toLocaleString()}</div>
                      </td>
                    )
                  })}
                  <td className="py-2 px-4 border-b font-bold">${summary[hotel].total.toLocaleString()}</td>
                </tr>
              )
            })}
            {/* Fila de totales */}
            <tr className="bg-gray-50">
              <td className="py-2 px-4 border-b font-bold">TOTAL</td>
              {productIds.map((productId) => (
                <td key={productId} className="py-2 px-4 border-b font-bold">
                  <div>
                    {productTotals[productId].quantity} {products.find((p) => p.id === productId)?.unit || ""}
                  </div>
                  <div>${productTotals[productId].total.toLocaleString()}</div>
                </td>
              ))}
              <td className="py-2 px-4 border-b font-bold text-lg">${grandTotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {/* Resumen visual */}
        <div className="mt-8">
          <h4 className="text-md font-medium mb-4">Distribución de Gastos por Hotel</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gráfico de barras simple */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              {hotels.map((hotel) => {
                if (!hotel) return null
                const percentage = (summary[hotel].total / grandTotal) * 100
                return (
                  <div key={hotel} className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span>{hotel}</span>
                      <span>
                        ${summary[hotel].total.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Top productos */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium mb-2">Top Productos por Gasto</h5>
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left">Producto</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(productTotals)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .slice(0, 5)
                    .map(([productId, data]) => (
                      <tr key={productId}>
                        <td>{data.productName}</td>
                        <td className="text-right">${data.total.toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar pantalla de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-700">Conectando con Supabase...</h2>
        <p className="text-gray-500 mt-2">Por favor espere mientras se establece la conexión.</p>
      </div>
    )
  }

  // Mostrar pantalla de error
  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">HOTELES DE LA COSTA</h1>
        <h2 className="text-xl mb-6">Sistema de Gestión de Stock</h2>

        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Error de conexión</h3>
              <p className="text-red-700 mb-2">No se pudo conectar con Supabase. Esto puede deberse a:</p>
              <ul className="list-disc pl-5 mb-4 text-red-700">
                <li>Problemas de conexión a internet</li>
                <li>Credenciales de Supabase incorrectas o no configuradas</li>
                <li>El servidor de Supabase no está disponible temporalmente</li>
              </ul>

              {showFullError && (
                <div className="bg-red-100 p-3 rounded-md mb-4 overflow-auto max-h-40">
                  <pre className="text-xs text-red-800 whitespace-pre-wrap">{error}</pre>
                </div>
              )}

              <button
                onClick={() => setShowFullError(!showFullError)}
                className="text-red-700 underline text-sm mb-4 block"
              >
                {showFullError ? "Ocultar detalles técnicos" : "Mostrar detalles técnicos"}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar conexión
            </button>

            <button
              onClick={handleResetConfig}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Reiniciar configuración
            </button>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Configuración de Supabase
          </h3>
          <p className="text-yellow-700 mb-4">
            Configura las credenciales de Supabase para conectarte a tu base de datos:
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="supabaseUrl" className="block text-sm font-medium text-yellow-700 mb-1 flex items-center">
                <Database className="h-4 w-4 mr-1" />
                URL de Supabase
              </label>
              <input
                type="text"
                id="supabaseUrl"
                className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
                placeholder="https://tu-proyecto.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
              <p className="text-xs text-yellow-600 mt-1">Ejemplo: https://abcdefghijklm.supabase.co</p>
            </div>

            <div>
              <label htmlFor="supabaseKey" className="block text-sm font-medium text-yellow-700 mb-1 flex items-center">
                <Key className="h-4 w-4 mr-1" />
                Clave anónima de Supabase (anon key)
              </label>
              <input
                type="text"
                id="supabaseKey"
                className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
                placeholder="eyJ0eXAiOiJKV1QiLCJhbGci..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
              <p className="text-xs text-yellow-600 mt-1">
                Comienza con "eyJ..." - Puedes encontrarla en la configuración de tu proyecto en Supabase
              </p>
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Guardar configuración y reconectar
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Si los problemas persisten, contacta al administrador del sistema.</p>
        </div>
      </div>
    )
  }

  // Si está conectado, mostrar la interfaz completa
  if (isConnected) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">HOTELES DE LA COSTA</h1>
        <h2 className="text-xl mb-4">Sistema de Gestión de Stock</h2>

        {/* Tabs de navegación */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "inventory"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("inventory")}
          >
            Inventario
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "products"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Productos
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "records" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("records")}
          >
            Movimientos
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "hotelSummary"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("hotelSummary")}
          >
            Resumen Hoteles
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "admin" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("admin")}
          >
            Administración
          </button>
        </div>

        {/* Contenido según la pestaña activa */}
        {activeTab === "inventory" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Inventario Actual</h3>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setIsAddingRecord(true)
                    setRecordType("entrada")
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                  <ArrowDown className="h-4 w-4 mr-1" />
                  Entrada
                </button>
                <button
                  onClick={() => {
                    setIsAddingRecord(true)
                    setRecordType("salida")
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Salida
                </button>
              </div>
            </div>

            {/* Tabla de inventario */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Producto</th>
                    <th className="py-2 px-4 border-b text-left">Cantidad</th>
                    <th className="py-2 px-4 border-b text-left">Unidad</th>
                    <th className="py-2 px-4 border-b text-left">Stock Mínimo</th>
                    <th className="py-2 px-4 border-b text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const product = products.find((p) => p.id === item.productId)
                    const isLowStock = product && item.quantity < product.min_stock

                    return (
                      <tr key={item.productId} className={isLowStock ? "bg-red-50" : ""}>
                        <td className="py-2 px-4 border-b">{getProductName(item.productId)}</td>
                        <td className="py-2 px-4 border-b">{item.quantity}</td>
                        <td className="py-2 px-4 border-b">{getProductUnit(item.productId)}</td>
                        <td className="py-2 px-4 border-b">{product?.min_stock || "N/A"}</td>
                        <td className="py-2 px-4 border-b">
                          {isLowStock ? (
                            <span className="text-red-600 font-medium flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Stock bajo
                            </span>
                          ) : (
                            <span className="text-green-600">OK</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal para añadir registro */}
            {isAddingRecord && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium mb-4">
                    {recordType === "entrada" ? "Registrar Entrada" : "Registrar Salida"}
                  </h3>
                  <form onSubmit={handleAddRecord}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <select name="productId" className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                        <option value="">Seleccionar producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    {recordType === "salida" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hotel</label>
                        <div className="flex gap-2">
                          <select
                            name="hotelName"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            defaultValue=""
                            required
                          >
                            <option value="">Seleccionar hotel...</option>
                            {getUniqueHotels().map((hotel) => (
                              <option key={hotel} value={hotel}>
                                {hotel}
                              </option>
                            ))}
                            <option value="nuevo">+ Añadir nuevo hotel</option>
                          </select>
                        </div>
                        <div id="newHotelInput" className="mt-2 hidden">
                          <input
                            type="text"
                            id="newHotelName"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Nombre del nuevo hotel"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingRecord(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className={`px-4 py-2 text-white rounded-md ${
                          recordType === "entrada" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Lista de Productos</h3>
              <button
                onClick={() => setIsAddingProduct(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Producto
              </button>
            </div>

            {/* Tabla de productos */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">Nombre</th>
                    <th className="py-2 px-4 border-b text-left">Unidad</th>
                    <th className="py-2 px-4 border-b text-left">Precio</th>
                    <th className="py-2 px-4 border-b text-left">Stock Mínimo</th>
                    <th className="py-2 px-4 border-b text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="py-2 px-4 border-b">{product.id}</td>
                      <td className="py-2 px-4 border-b">{product.name}</td>
                      <td className="py-2 px-4 border-b">{product.unit}</td>
                      <td className="py-2 px-4 border-b">${product.price.toLocaleString()}</td>
                      <td className="py-2 px-4 border-b">{product.min_stock}</td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => {
                            setCurrentProduct(product)
                            setIsEditingProduct(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal para añadir producto */}
            {isAddingProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium mb-4">Añadir Nuevo Producto</h3>
                  <form onSubmit={handleAddProduct}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        name="name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                      <input
                        type="text"
                        name="unit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                      <input
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                      <input
                        type="number"
                        name="min_stock"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal para editar producto */}
            {isEditingProduct && currentProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium mb-4">Editar Producto</h3>
                  <form onSubmit={handleEditProduct}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={currentProduct.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                      <input
                        type="text"
                        name="unit"
                        defaultValue={currentProduct.unit}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                      <input
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        defaultValue={currentProduct.price}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                      <input
                        type="number"
                        name="min_stock"
                        min="0"
                        defaultValue={currentProduct.min_stock}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProduct(false)
                          setCurrentProduct(null)
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Actualizar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "records" && (
          <div>
            <h3 className="text-lg font-medium mb-4">Historial de Movimientos</h3>

            {/* Tabla de registros */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Fecha</th>
                    <th className="py-2 px-4 border-b text-left">Tipo</th>
                    <th className="py-2 px-4 border-b text-left">Producto</th>
                    <th className="py-2 px-4 border-b text-left">Cantidad</th>
                    <th className="py-2 px-4 border-b text-left">Hotel</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="py-2 px-4 border-b">
                        {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.type === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.type === "entrada" ? "Entrada" : "Salida"}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">{record.productName}</td>
                      <td className="py-2 px-4 border-b">
                        {record.quantity} {record.productUnit}
                      </td>
                      <td className="py-2 px-4 border-b">{record.hotelName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "hotelSummary" && (
          <div>
            <h3 className="text-lg font-medium mb-4">Resumen de Gastos por Hotel</h3>

            {/* Resumen por hotel */}
            <div className="overflow-x-auto">{generateHotelSummary()}</div>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            <h3 className="text-lg font-medium mb-4">Panel de Administración</h3>

            {!isAdminMode ? (
              <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-md mx-auto">
                <h4 className="text-lg font-medium mb-4">Acceso de Administrador</h4>
                <p className="text-gray-600 mb-4">
                  Ingresa la contraseña de administrador para acceder a las funciones avanzadas.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  onClick={() => checkAdminPassword()}
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Acceder
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Precaución:</strong> Las modificaciones y eliminaciones afectan directamente al
                        inventario. Estas acciones no se pueden deshacer.
                      </p>
                    </div>
                  </div>
                </div>

                <h4 className="text-md font-medium mb-2">Historial de Movimientos</h4>
                <p className="text-gray-600 mb-4">Aquí puedes editar o eliminar registros de entradas y salidas.</p>

                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 border-b text-left">Fecha</th>
                        <th className="py-2 px-4 border-b text-left">Tipo</th>
                        <th className="py-2 px-4 border-b text-left">Producto</th>
                        <th className="py-2 px-4 border-b text-left">Cantidad</th>
                        <th className="py-2 px-4 border-b text-left">Hotel</th>
                        <th className="py-2 px-4 border-b text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td className="py-2 px-4 border-b">
                            {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-4 border-b">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.type === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {record.type === "entrada" ? "Entrada" : "Salida"}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b">{record.productName}</td>
                          <td className="py-2 px-4 border-b">
                            {record.quantity} {record.productUnit}
                          </td>
                          <td className="py-2 px-4 border-b">{record.hotelName || "-"}</td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setCurrentRecord(record)
                                  setIsEditingRecord(true)
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setRecordToDelete(record.id)
                                  setIsConfirmingDelete(true)
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal para editar registro */}
            {isEditingRecord && currentRecord && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium mb-4">Editar Registro</h3>
                  <form onSubmit={handleEditRecord}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Registro</label>
                      <select
                        name="recordType"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue={currentRecord.type}
                        required
                      >
                        <option value="entrada">Entrada</option>
                        <option value="salida">Salida</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <select
                        name="productId"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue={currentRecord.productId}
                        required
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        defaultValue={currentRecord.quantity}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hotel (solo para salidas)</label>
                      <select
                        name="hotelName"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue={currentRecord.hotelName || ""}
                      >
                        <option value="">Seleccionar hotel...</option>
                        {getUniqueHotels().map((hotel) => (
                          <option key={hotel} value={hotel}>
                            {hotel}
                          </option>
                        ))}
                        <option value="nuevo">+ Añadir nuevo hotel</option>
                      </select>
                      <div id="newHotelInput" className="mt-2 hidden">
                        <input
                          type="text"
                          id="newHotelName"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Nombre del nuevo hotel"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingRecord(false)
                          setCurrentRecord(null)
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal de confirmación para eliminar */}
            {isConfirmingDelete && recordToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium mb-4">Confirmar Eliminación</h3>
                  <p className="text-gray-700 mb-6">
                    ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer y afectará al
                    inventario.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setIsConfirmingDelete(false)
                        setRecordToDelete(null)
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(recordToDelete)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Este punto no debería alcanzarse normalmente
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h2 className="text-xl font-medium text-gray-700">Estado desconocido</h2>
      <p className="text-gray-500 mt-2">Por favor recarga la página.</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Recargar página
      </button>
    </div>
  )
}
