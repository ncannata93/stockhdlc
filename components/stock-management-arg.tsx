"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  initializeDBArg,
  getProductsArg,
  getInventoryArg,
  getRecordsArg,
  saveProductArg,
  saveInventoryItemArg,
  saveRecordArg,
  updateRecordArg,
  deleteRecordArg,
  type ProductArg,
  type InventoryItemArg,
  type StockRecordArg,
} from "@/lib/db-manager-arg"
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit,
  ArrowUp,
  ArrowDown,
  Trash2,
  LogOut,
  User,
  Menu,
  X,
  Bell,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNotifications, NotificationsPanel } from "@/components/notification-system"
import LowStockAlert from "@/components/low-stock-alert"

// Lista de hoteles para Argentina (vacía por defecto, el usuario agrega los que necesite)
const PREDEFINED_HOTELS_ARG: string[] = []

export default function StockManagementArg() {
  const [activeTab, setActiveTab] = useState<"inventory" | "products" | "records" | "hotelSummary" | "hotels" | "admin">(
    "inventory",
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showFullError, setShowFullError] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false)

  // Datos de la aplicación
  const [products, setProducts] = useState<ProductArg[]>([])
  const [inventory, setInventory] = useState<InventoryItemArg[]>([])
  const [records, setRecords] = useState<StockRecordArg[]>([])
  const [customHotels, setCustomHotels] = useState<string[]>([])

  // Estados para formularios
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<ProductArg | null>(null)
  const [isAddingRecord, setIsAddingRecord] = useState(false)
  const [recordType, setRecordType] = useState<"entrada" | "salida">("entrada")
  const [newHotelName, setNewHotelName] = useState("")
  const [hotelToDelete, setHotelToDelete] = useState<string | null>(null)
  const [isConfirmingHotelDelete, setIsConfirmingHotelDelete] = useState(false)

  // Estados para administrador
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [isEditingRecord, setIsEditingRecord] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<StockRecordArg | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null)

  // Auth y notificaciones
  const { logout, user } = useAuth()
  const username = user?.username || "Usuario"
  const { notifications, addNotification, markAsRead, removeNotification, clearAllNotifications } = useNotifications()

  // Refs para cerrar menús al hacer clic fuera
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const notificationsPanelRef = useRef<HTMLDivElement>(null)

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
      if (notificationsPanelRef.current && !notificationsPanelRef.current.contains(event.target as Node)) {
        setNotificationsPanelOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Verificar stock bajo cuando cambia el inventario
  useEffect(() => {
    if (inventory.length > 0 && products.length > 0) {
      const lowStockProducts = products.filter((product) => {
        const inventoryItem = inventory.find((item) => item.productId === product.id)
        return inventoryItem && inventoryItem.quantity < product.min_stock
      })

      if (lowStockProducts.length > 0) {
        lowStockProducts.forEach((product) => {
          const inventoryItem = inventory.find((item) => item.productId === product.id)
          if (inventoryItem) {
            addNotification({
              type: "warning",
              title: "Alerta de Stock Bajo (ARG)",
              message: `${product.name}: ${inventoryItem.quantity} ${product.unit} (mínimo ${product.min_stock})`,
            })
          }
        })
      }
    }
  }, [inventory, products])

  // Conectar a Supabase
  useEffect(() => {
    const connectToSupabase = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await initializeDBArg()

        if (result.success) {
          setIsConnected(true)

          try {
            const [productsData, inventoryData, recordsData] = await Promise.all([
              getProductsArg(),
              getInventoryArg(),
              getRecordsArg(),
            ])

            setProducts(productsData)
            setInventory(inventoryData)
            setRecords(recordsData)
          } catch (dataError) {
            console.error("Error al cargar datos iniciales ARG:", dataError)
            setError(
              `Conexión establecida pero error al cargar datos: ${dataError instanceof Error ? dataError.message : String(dataError)}`,
            )
          }

          setIsLoading(false)
        } else {
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
      const newHotelInput = document.getElementById("newHotelInputArg")

      if (hotelSelect && newHotelInput) {
        if (hotelSelect.value === "nuevo") {
          newHotelInput.classList.remove("hidden")
          const input = document.getElementById("newHotelNameArg") as HTMLInputElement
          if (input) {
            input.required = true
            input.focus()
          }
        } else {
          newHotelInput.classList.add("hidden")
          const input = document.getElementById("newHotelNameArg") as HTMLInputElement
          if (input) {
            input.required = false
          }
        }
      }
    }

    if (isAddingRecord && recordType === "salida") {
      setTimeout(() => {
        const hotelSelect = document.querySelector('select[name="hotelName"]')
        if (hotelSelect) {
          hotelSelect.addEventListener("change", handleHotelSelectChange)
        }
      }, 100)
    }

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

  // Función para obtener la lista única de hoteles
  const getUniqueHotels = () => {
    const hotelsFromRecords = records
      .filter((record) => record.type === "salida" && record.hotelName)
      .map((record) => record.hotelName)
      .filter((hotel): hotel is string => hotel !== null)

    const allHotels = [...new Set([...PREDEFINED_HOTELS_ARG, ...customHotels, ...hotelsFromRecords])]
    return allHotels.sort((a, b) => a.localeCompare(b))
  }

  // Función para agregar un hotel personalizado
  const handleAddHotel = () => {
    if (newHotelName.trim() === "") {
      alert("El nombre del hotel no puede estar vacío")
      return
    }
    
    if (customHotels.some(h => h.toLowerCase() === newHotelName.trim().toLowerCase())) {
      alert("Este hotel ya existe")
      return
    }
    
    setCustomHotels([...customHotels, newHotelName.trim()])
    setNewHotelName("")
    
    // Guardar en localStorage para persistencia
    const updatedHotels = [...customHotels, newHotelName.trim()]
    localStorage.setItem("customHotelsArg", JSON.stringify(updatedHotels))
  }

  // Función para eliminar un hotel personalizado
  const handleDeleteHotel = (hotelName: string) => {
    // Verificar si el hotel tiene movimientos asociados
    const hasRecords = records.some(r => r.hotelName === hotelName)
    if (hasRecords) {
      alert("No se puede eliminar este hotel porque tiene movimientos asociados. Primero elimina o edita esos movimientos.")
      return
    }
    
    const updatedHotels = customHotels.filter(h => h !== hotelName)
    setCustomHotels(updatedHotels)
    localStorage.setItem("customHotelsArg", JSON.stringify(updatedHotels))
    setIsConfirmingHotelDelete(false)
    setHotelToDelete(null)
  }

  // Cargar hoteles personalizados de localStorage al iniciar
  useEffect(() => {
    const savedHotels = localStorage.getItem("customHotelsArg")
    if (savedHotels) {
      try {
        setCustomHotels(JSON.parse(savedHotels))
      } catch (e) {
        console.error("Error al cargar hoteles personalizados:", e)
      }
    }
  }, [])

  // Función para añadir un nuevo producto
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const newProduct: ProductArg = {
      id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      name: formData.get("name") as string,
      unit: formData.get("unit") as string,
      price: Number.parseFloat(formData.get("price") as string),
      min_stock: Number.parseInt(formData.get("min_stock") as string, 10),
    }

    try {
      const success = await saveProductArg(newProduct)
      if (success) {
        setProducts([...products, newProduct])
        const newInventoryItem: InventoryItemArg = {
          productId: newProduct.id,
          quantity: 0,
        }
        await saveInventoryItemArg(newInventoryItem)
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

    const updatedProduct: ProductArg = {
      id: currentProduct.id,
      name: formData.get("name") as string,
      unit: formData.get("unit") as string,
      price: Number.parseFloat(formData.get("price") as string),
      min_stock: Number.parseInt(formData.get("min_stock") as string, 10),
    }

    try {
      const success = await saveProductArg(updatedProduct)
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

  // Verificar contraseña de administrador
  const checkAdminPassword = () => {
    const correctPassword = "admin123"
    if (adminPassword === correctPassword) {
      setIsAdminMode(true)
      return true
    } else {
      alert("Contraseña incorrecta")
      return false
    }
  }

  // Editar un registro
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

    let hotelName = formData.get("hotelName") as string

    if (hotelName === "nuevo") {
      const newHotelNameInput = document.getElementById("newHotelNameArg") as HTMLInputElement
      if (newHotelNameInput && newHotelNameInput.value) {
        hotelName = newHotelNameInput.value
      } else {
        alert("Por favor ingresa el nombre del nuevo hotel")
        return
      }
    }

    const recordTypeValue = formData.get("recordType") as "entrada" | "salida"

    const updatedRecord: StockRecordArg = {
      ...currentRecord,
      productId,
      productName: product.name,
      productUnit: product.unit,
      quantity,
      price: product.price,
      hotelName: recordTypeValue === "salida" ? hotelName : null,
      type: recordTypeValue,
      username: username,
    }

    try {
      const success = await updateRecordArg(updatedRecord)
      if (success) {
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

  // Eliminar un registro
  const handleDeleteRecord = async (recordId: number) => {
    try {
      const success = await deleteRecordArg(recordId)
      if (success) {
        setRecords(records.filter((r) => r.id !== recordId))
        // Recargar inventario
        const inventoryData = await getInventoryArg()
        setInventory(inventoryData)
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

  // Añadir un registro (entrada o salida)
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

    let hotelName = formData.get("hotelName") as string

    if (hotelName === "nuevo") {
      const newHotelNameInput = document.getElementById("newHotelNameArg") as HTMLInputElement
      if (newHotelNameInput && newHotelNameInput.value) {
        hotelName = newHotelNameInput.value
      } else {
        alert("Por favor ingresa el nombre del nuevo hotel")
        return
      }
    }

    const newRecord: StockRecordArg = {
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
      username: username,
    }

    try {
      const success = await saveRecordArg(newRecord)
      if (success) {
        setRecords([newRecord, ...records])

        // Actualizar inventario
        const currentItem = inventory.find((i) => i.productId === productId)
        if (currentItem) {
          const newQuantity =
            recordType === "entrada" ? currentItem.quantity + quantity : currentItem.quantity - quantity

          const updatedItem: InventoryItemArg = {
            ...currentItem,
            quantity: newQuantity,
          }

          await saveInventoryItemArg(updatedItem)
          setInventory(inventory.map((i) => (i.productId === productId ? updatedItem : i)))

          // Verificar stock bajo
          if (recordType === "salida") {
            const updatedQuantity = currentItem.quantity - quantity
            const productInfo = products.find((p) => p.id === productId)

            if (productInfo && updatedQuantity < productInfo.min_stock) {
              addNotification({
                type: "warning",
                title: "Stock Bajo Detectado (ARG)",
                message: `${productInfo.name} ha caído por debajo del nivel mínimo (${updatedQuantity} < ${productInfo.min_stock})`,
              })
            }

            if (updatedQuantity <= 0) {
              addNotification({
                type: "warning",
                title: "¡Stock Agotado! (ARG)",
                message: `${productInfo?.name || "Un producto"} se ha agotado completamente`,
              })
            }
          }
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

  // Generar resumen por hotel
  const generateHotelSummary = () => {
    if (records.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">No hay registros de movimientos para generar el resumen.</div>
      )
    }

    const hotelRecords = records.filter((record) => record.type === "salida" && record.hotelName)

    if (hotelRecords.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No hay registros de salidas a hoteles para generar el resumen.
        </div>
      )
    }

    const hotels = [...new Set(hotelRecords.map((record) => record.hotelName))]
    const productIds = [...new Set(hotelRecords.map((record) => record.productId))]

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

    const grandTotal = Object.values(summary).reduce((acc, hotel) => acc + hotel.total, 0)

    return (
      <div>
        {/* Versión móvil */}
        <div className="md:hidden">
          {hotels.map((hotel) => {
            if (!hotel) return null
            return (
              <div key={hotel} className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-3 border-b border-gray-200 bg-sky-50">
                  <h4 className="font-medium">{hotel}</h4>
                  <p className="text-sm text-gray-500">Total: ${summary[hotel].total.toLocaleString()}</p>
                </div>
                <div className="p-3">
                  {Object.entries(summary[hotel])
                    .filter(([key]) => key !== "total")
                    .map(([productId, data]) => (
                      <div key={productId} className="py-2 border-b border-gray-100 last:border-0">
                        <div className="flex justify-between">
                          <span>{data.productName}</span>
                          <span>
                            {data.quantity} {data.productUnit}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 text-right">${data.total.toLocaleString()}</div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}

          <div className="bg-sky-50 p-4 rounded-lg border border-sky-200 mt-4">
            <h4 className="font-medium text-sky-800 mb-2">Total General</h4>
            <p className="text-xl font-bold text-sky-900">${grandTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Versión desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-sky-50">
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
              <tr className="bg-sky-50">
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
        </div>
      </div>
    )
  }

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-sky-500 mb-4" />
        <h2 className="text-xl font-medium text-gray-700">Conectando con Supabase...</h2>
        <p className="text-gray-500 mt-2">Por favor espere mientras se establece la conexión.</p>
      </div>
    )
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-xl md:text-2xl font-bold mb-2">STOCK ARGENTINA</h1>
        <h2 className="text-lg md:text-xl mb-4">Sistema de Gestión de Stock</h2>

        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Error de conexión</h3>
              <p className="text-red-700 mb-2">No se pudo conectar con la base de datos de Stock Argentina.</p>

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
              className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar conexión
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Interfaz principal
  if (isConnected) {
    return (
      <div className="p-2 md:p-4">
        {/* Header para móvil */}
        <div className="md:hidden flex flex-col mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold text-sky-700">STOCK ARGENTINA</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                className="relative p-1 rounded-full hover:bg-gray-100"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 rounded-full hover:bg-gray-100">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <h2 className="text-lg mb-2">Sistema de Gestión de Stock</h2>

          {/* Menú móvil */}
          {mobileMenuOpen && (
            <div
              ref={mobileMenuRef}
              className="absolute top-16 right-2 bg-white shadow-lg rounded-lg z-50 w-48 border border-gray-200"
            >
              <div className="p-2 border-b border-gray-200">
                <div className="flex items-center text-gray-700 mb-1">
                  <User className="h-4 w-4 mr-2" />
                  <span className="font-medium">{username}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center text-sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          {/* Panel de notificaciones móvil */}
          {notificationsPanelOpen && (
            <div
              ref={notificationsPanelRef}
              className="absolute top-16 right-2 bg-white shadow-lg rounded-lg z-50 w-64 border border-gray-200"
            >
              <NotificationsPanel
                notifications={notifications}
                markAsRead={markAsRead}
                removeNotification={removeNotification}
                clearAllNotifications={clearAllNotifications}
              />
            </div>
          )}
        </div>

        {/* Header para desktop */}
        <div className="hidden md:flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-sky-700">STOCK ARGENTINA</h1>
            <h2 className="text-xl mb-4">Sistema de Gestión de Stock</h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsPanel
              notifications={notifications}
              markAsRead={markAsRead}
              removeNotification={removeNotification}
              clearAllNotifications={clearAllNotifications}
            />
            <div className="flex items-center text-gray-700">
              <User className="h-4 w-4 mr-2" />
              <span className="font-medium">{username}</span>
            </div>
            <button
              onClick={() => logout()}
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Tabs de navegación para móvil */}
        <div className="md:hidden overflow-x-auto pb-2 mb-4">
          <div className="flex border-b border-gray-200 min-w-max">
            <button
              className={`px-3 py-2 font-medium whitespace-nowrap ${
                activeTab === "inventory"
                  ? "text-sky-600 border-b-2 border-sky-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("inventory")}
            >
              Inventario
            </button>
            <button
              className={`px-3 py-2 font-medium whitespace-nowrap ${
                activeTab === "products"
                  ? "text-sky-600 border-b-2 border-sky-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("products")}
            >
              Productos
            </button>
            <button
              className={`px-3 py-2 font-medium whitespace-nowrap ${
                activeTab === "records"
                  ? "text-sky-600 border-b-2 border-sky-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("records")}
            >
              Movimientos
            </button>
            <button
              className={`px-3 py-2 font-medium whitespace-nowrap ${
                activeTab === "hotelSummary"
                  ? "text-sky-600 border-b-2 border-sky-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("hotelSummary")}
            >
              Resumen
            </button>
            <button
              className={`px-3 py-2 font-medium whitespace-nowrap ${
                activeTab === "hotels" ? "text-sky-600 border-b-2 border-sky-600" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("hotels")}
            >
              Hoteles
            </button>
            <button
              className={`px-3 py-2 font-medium whitespace-nowrap ${
                activeTab === "admin" ? "text-sky-600 border-b-2 border-sky-600" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("admin")}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Tabs de navegación para desktop */}
        <div className="hidden md:flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "inventory"
                ? "text-sky-600 border-b-2 border-sky-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("inventory")}
          >
            Inventario
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "products"
                ? "text-sky-600 border-b-2 border-sky-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Productos
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "records" ? "text-sky-600 border-b-2 border-sky-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("records")}
          >
            Movimientos
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "hotelSummary"
                ? "text-sky-600 border-b-2 border-sky-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("hotelSummary")}
          >
            Resumen Hoteles
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "hotels" ? "text-sky-600 border-b-2 border-sky-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("hotels")}
          >
            Hoteles
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "admin" ? "text-sky-600 border-b-2 border-sky-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("admin")}
          >
            Administracion
          </button>
        </div>

        {/* Alerta de stock bajo */}
        <LowStockAlert products={products} inventory={inventory} />

        {/* Contenido según la pestaña activa */}
        {activeTab === "inventory" && (
          <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
              <h3 className="text-lg font-medium mb-2 md:mb-0">Inventario Actual</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAddingRecord(true)
                    setRecordType("entrada")
                  }}
                  className="flex-1 md:flex-none px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                >
                  <ArrowDown className="h-4 w-4 mr-1" />
                  Entrada
                </button>
                <button
                  onClick={() => {
                    setIsAddingRecord(true)
                    setRecordType("salida")
                  }}
                  className="flex-1 md:flex-none px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Salida
                </button>
              </div>
            </div>

            {/* Tabla de inventario para móvil */}
            <div className="md:hidden">
              {inventory.map((item) => {
                const product = products.find((p) => p.id === item.productId)
                const isLowStock = product && item.quantity < product.min_stock

                return (
                  <div
                    key={item.productId}
                    className={`mb-3 p-3 rounded-lg border ${isLowStock ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium">{getProductName(item.productId)}</h4>
                      {isLowStock ? (
                        <span className="text-red-600 font-medium flex items-center text-sm">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Stock bajo
                        </span>
                      ) : (
                        <span className="text-green-600 text-sm">OK</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Cantidad:</span>
                        <span className="ml-1 font-medium">
                          {item.quantity} {getProductUnit(item.productId)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Mínimo:</span>
                        <span className="ml-1 font-medium">
                          {product?.min_stock || "N/A"} {getProductUnit(item.productId)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tabla de inventario para desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-sky-50">
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
                <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
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
                        <div id="newHotelInputArg" className="mt-2 hidden">
                          <input
                            type="text"
                            id="newHotelNameArg"
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
                className="px-3 py-1 bg-sky-600 text-white rounded-md hover:bg-sky-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Producto
              </button>
            </div>

            {/* Tabla de productos para móvil */}
            <div className="md:hidden">
              {products.map((product) => (
                <div key={product.id} className="mb-3 p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <button
                      onClick={() => {
                        setCurrentProduct(product)
                        setIsEditingProduct(true)
                      }}
                      className="text-sky-600 hover:text-sky-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Unidad:</span>
                      <span className="ml-1">{product.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Precio:</span>
                      <span className="ml-1">${product.price.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock Mínimo:</span>
                      <span className="ml-1">{product.min_stock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla de productos para desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-sky-50">
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
                          className="text-sky-600 hover:text-sky-800 mr-2"
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
                <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
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
                      <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
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
                <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
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
                      <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
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

            {/* Tabla de registros para móvil */}
            <div className="md:hidden">
              {records.map((record) => (
                <div key={record.id} className="mb-3 p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.type === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.type === "entrada" ? "Entrada" : "Salida"}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => {
                          setCurrentRecord(record)
                          setIsEditingRecord(true)
                        }}
                        className="text-sky-600 hover:text-sky-800 p-1"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setRecordToDelete(record.id)
                          setIsConfirmingDelete(true)
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-1">
                    <h4 className="font-medium">{record.productName}</h4>
                    <p className="text-sm">
                      {record.quantity} {record.productUnit}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Hotel:</span>
                      <span className="ml-1">{record.hotelName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Usuario:</span>
                      <span className="ml-1">{record.username || "Sistema"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla de registros para desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Fecha</th>
                    <th className="py-2 px-4 border-b text-left">Tipo</th>
                    <th className="py-2 px-4 border-b text-left">Producto</th>
                    <th className="py-2 px-4 border-b text-left">Cantidad</th>
                    <th className="py-2 px-4 border-b text-left">Hotel</th>
                    <th className="py-2 px-4 border-b text-left">Usuario</th>
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
                      <td className="py-2 px-4 border-b">{record.username || "Sistema"}</td>
                      <td className="py-2 px-4 border-b">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setCurrentRecord(record)
                              setIsEditingRecord(true)
                            }}
                            className="text-sky-600 hover:text-sky-800 p-1"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRecordToDelete(record.id)
                              setIsConfirmingDelete(true)
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
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

        {activeTab === "hotelSummary" && (
          <div>
            <h3 className="text-lg font-medium mb-4">Resumen de Gastos por Hotel</h3>
            <div className="overflow-x-auto">{generateHotelSummary()}</div>
          </div>
        )}

        {activeTab === "hotels" && (
          <div>
            <h3 className="text-lg font-medium mb-4">Gestion de Hoteles</h3>
            
            {/* Formulario para agregar hotel */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <h4 className="font-medium mb-3">Agregar Nuevo Hotel</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newHotelName}
                  onChange={(e) => setNewHotelName(e.target.value)}
                  placeholder="Nombre del hotel"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddHotel()
                    }
                  }}
                />
                <button
                  onClick={handleAddHotel}
                  className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
            </div>

            {/* Lista de hoteles */}
            {customHotels.length > 0 ? (
              <div>
                <h4 className="font-medium mb-3 text-gray-700">Hoteles Registrados ({customHotels.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {customHotels.map((hotel) => (
                    <div key={hotel} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <span className="text-sm font-medium">{hotel}</span>
                      <button
                        onClick={() => {
                          setHotelToDelete(hotel)
                          setIsConfirmingHotelDelete(true)
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar hotel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">No hay hoteles registrados</p>
                <p className="text-gray-400 text-sm">Agrega hoteles usando el formulario de arriba</p>
              </div>
            )}
          </div>
        )}

        {/* Modal de confirmacion para eliminar hotel */}
        {isConfirmingHotelDelete && hotelToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">Confirmar Eliminacion</h3>
              <p className="text-gray-600 mb-6">
                Estas seguro de que deseas eliminar el hotel <strong>{hotelToDelete}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsConfirmingHotelDelete(false)
                    setHotelToDelete(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteHotel(hotelToDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
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
                  className="w-full py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
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

                {/* Tabla de registros para móvil (admin) */}
                <div className="md:hidden">
                  {records.map((record) => (
                    <div key={record.id} className="mb-3 p-3 rounded-lg border border-gray-200 bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.type === "entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.type === "entrada" ? "Entrada" : "Salida"}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setCurrentRecord(record)
                              setIsEditingRecord(true)
                            }}
                            className="text-sky-600 hover:text-sky-800"
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
                      </div>
                      <div className="mb-1">
                        <h4 className="font-medium">{record.productName}</h4>
                        <p className="text-sm">
                          {record.quantity} {record.productUnit}
                        </p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500">Hotel:</span>
                          <span className="ml-1">{record.hotelName || "-"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Usuario:</span>
                          <span className="ml-1">{record.username || "Sistema"}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tabla de registros para desktop (admin) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-sky-50">
                      <tr>
                        <th className="py-2 px-4 border-b text-left">Fecha</th>
                        <th className="py-2 px-4 border-b text-left">Tipo</th>
                        <th className="py-2 px-4 border-b text-left">Producto</th>
                        <th className="py-2 px-4 border-b text-left">Cantidad</th>
                        <th className="py-2 px-4 border-b text-left">Hotel</th>
                        <th className="py-2 px-4 border-b text-left">Usuario</th>
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
                          <td className="py-2 px-4 border-b">{record.username || "Sistema"}</td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setCurrentRecord(record)
                                  setIsEditingRecord(true)
                                }}
                                className="text-sky-600 hover:text-sky-800"
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

          </div>
        )}

        {/* Modal para editar registro (disponible globalmente) */}
        {isEditingRecord && currentRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
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
                    <option value="nuevo">+ Anadir nuevo hotel</option>
                  </select>
                  <div id="newHotelInputArg" className="mt-2 hidden">
                    <input
                      type="text"
                      id="newHotelNameArg"
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
                  <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmacion para eliminar registro */}
        {isConfirmingDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4 text-red-600">Confirmar Eliminacion</h3>
              <p className="text-gray-600 mb-4">
                Estas seguro de que deseas eliminar este registro? Esta accion tambien actualizara el inventario y
                no se puede deshacer.
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
                  onClick={handleDeleteRecord}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
