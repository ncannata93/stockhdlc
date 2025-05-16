"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Check,
  ChevronsUpDown,
  Hotel,
  Package,
  Pencil,
  Save,
  X,
  PlusCircle,
  MinusCircle,
  Lock,
  LogOut,
  Plus,
  DollarSign,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Cloud,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  type Product,
  type InventoryItem as ProductStock,
  type StockRecord,
  saveProduct,
  saveProducts,
  getProducts,
  saveInventory,
  getInventory,
  saveRecord,
  getRecords,
  exportAllData,
  importAllData,
  saveInventoryItem,
  useConnectionStatus,
  initializeDB,
  createBackup,
  setupRealtimeSubscriptions,
  cleanupRealtimeSubscriptions,
  syncWithSupabase,
} from "@/lib/db-manager"

// Datos de ejemplo
const hotels = [
  { id: 1, name: "Jaguel" },
  { id: 2, name: "Monaco" },
  { id: 3, name: "Mallak" },
  { id: 4, name: "Argentina" },
  { id: 5, name: "Falkner" },
  { id: 6, name: "Stromboli" },
  { id: 7, name: "San Miguel" },
  { id: 8, name: "Colores" },
  { id: 9, name: "Puntarenas" },
  { id: 10, name: "Tupe" },
  { id: 11, name: "Munich" },
  { id: 12, name: "Tiburones" },
  { id: 13, name: "Barlovento" },
  { id: 14, name: "Carama" },
]

// Contraseña para acceder a la función de agregar stock
const ADMIN_PASSWORD = "Qw425540" // En una aplicación real, esto debería estar en el servidor

// Función para formatear precio
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount)
}

// Productos por defecto
const defaultProducts: Product[] = [
  { id: 1, name: "Leche", unit: "litros", price: 1200 },
  { id: 2, name: "Cafe", unit: "kg", price: 5000 },
  { id: 3, name: "azucar", unit: "kg", price: 1800 },
  { id: 4, name: "jabon", unit: "caja", price: 3500 },
  { id: 5, name: "papel higienico", unit: "bolson", price: 4200 },
  { id: 6, name: "shampoo", unit: "caja", price: 2800 },
]

export default function StockManagement() {
  // Referencia para el timeout que fuerza la salida del estado de carga
  const forceTimeoutRef = useRef<number | null>(null)

  // Estado de conexión
  const connectionStatus = useConnectionStatus()
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [backupError, setBackupError] = useState<string | null>(null)
  const [backupStatus, setSyncStatus] = useState<"idle" | "creating" | "success" | "error">("idle")

  // Estado para productos
  const [products, setProducts] = useState<Product[]>([])

  // Estados para el formulario de retiro
  const [selectedHotel, setSelectedHotel] = useState<(typeof hotels)[0] | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [hotelOpen, setHotelOpen] = useState(false)
  const [productOpen, setProductOpen] = useState(false)

  // Estados para el formulario de entrada de stock
  const [selectedStockProduct, setSelectedStockProduct] = useState<Product | null>(null)
  const [stockQuantity, setStockQuantity] = useState<number>(1)
  const [stockProductOpen, setStockProductOpen] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number>(0)

  // Estados para registros y edición
  const [records, setRecords] = useState<StockRecord[]>([])

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")
  const [editingRecord, setEditingRecord] = useState<number | null>(null)
  const [editHotel, setEditHotel] = useState<(typeof hotels)[0] | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [editPrice, setEditPrice] = useState<number>(0)
  const [editHotelOpen, setEditHotelOpen] = useState(false)
  const [editProductOpen, setEditProductOpen] = useState(false)

  // Estado para el inventario
  const [inventory, setInventory] = useState<ProductStock[]>([])
  const [showStockError, setShowStockError] = useState(false)

  // Estados para la autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState(false)
  const [activeTab, setActiveTab] = useState("register")

  // Estados para agregar nuevo producto
  const [newProductName, setNewProductName] = useState("")
  const [newProductUnit, setNewProductUnit] = useState("")
  const [newProductPrice, setNewProductPrice] = useState<number>(0)
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [newProductError, setNewProductError] = useState("")

  // Estados para la aplicación
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImportExportDialog, setShowImportExportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // Función para sincronizar con Supabase
  const handleSyncWithSupabase = async () => {
    if (!connectionStatus.isOnlineMode) {
      setBackupError("No se puede sincronizar en modo local. Activa el modo online primero.")
      return
    }

    setSyncStatus("creating")
    setBackupError(null)

    try {
      const result = await syncWithSupabase()
      if (result.success) {
        setSyncStatus("success")
        setTimeout(() => {
          setSyncStatus("idle")
        }, 3000)
      } else {
        setSyncStatus("error")
        setBackupError(result.error || "Error al sincronizar con Supabase")
      }
    } catch (error) {
      setSyncStatus("error")
      setBackupError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Función para crear una copia de seguridad
  const handleCreateBackup = async () => {
    setBackupError(null)
    setSyncStatus("creating")

    try {
      const result = await createBackup()
      if (result.success && result.data) {
        setSyncStatus("success")

        // Descargar la copia de seguridad automáticamente
        const jsonData = JSON.stringify(result.data, null, 2)
        const blob = new Blob([jsonData], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `hoteles-stock-backup-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()

        // Limpiar
        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          setSyncStatus("idle")
        }, 3000)
      } else {
        setSyncStatus("error")
        setBackupError(result.error || "Error al crear la copia de seguridad")
      }
    } catch (error) {
      setSyncStatus("error")
      setBackupError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Función para cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Cargando datos iniciales...")

      // Inicializar la base de datos
      const dbResult = await initializeDB()
      if (!dbResult.success) {
        console.error("Error al inicializar la base de datos:", dbResult.error)
        setError(`Error al inicializar la base de datos: ${dbResult.error}`)
      }

      // Cargar productos
      let loadedProducts = await getProducts()
      console.log("Productos cargados:", loadedProducts.length)

      // Si no hay productos, usar los productos por defecto
      if (loadedProducts.length === 0) {
        console.log("No hay productos, usando productos por defecto")
        loadedProducts = defaultProducts
        await saveProducts(defaultProducts)
      }

      setProducts(loadedProducts)

      // Cargar inventario
      let loadedInventory = await getInventory()
      console.log("Inventario cargado:", loadedInventory.length)

      // Si no hay inventario, inicializar con los productos cargados
      if (loadedInventory.length === 0) {
        console.log("No hay inventario, inicializando con productos cargados")
        loadedInventory = loadedProducts.map((product) => ({
          productId: product.id,
          quantity: 0,
        }))
        await saveInventory(loadedInventory)
      }

      setInventory(loadedInventory)

      // Cargar registros
      const loadedRecords = await getRecords()
      console.log("Registros cargados:", loadedRecords.length)

      // Convertir las fechas de string a Date si es necesario
      const recordsWithDates = loadedRecords.map((record) => ({
        ...record,
        date: record.date instanceof Date ? record.date : new Date(record.date),
      }))

      setRecords(recordsWithDates)

      console.log("Datos iniciales cargados correctamente")
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error)
      setError("Error al cargar datos. Por favor, recarga la página.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Configurar suscripciones en tiempo real cuando se cambia a modo online
  useEffect(() => {
    if (connectionStatus.isOnlineMode) {
      setupRealtimeSubscriptions(
        // Callback para actualizar el inventario cuando cambia en Supabase
        (updatedInventory) => {
          setInventory(updatedInventory)
        },
        // Callback para actualizar los registros cuando cambian en Supabase
        (updatedRecords) => {
          setRecords(updatedRecords)
        },
      )
    }

    return () => {
      cleanupRealtimeSubscriptions()
    }
  }, [connectionStatus.isOnlineMode])

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    loadInitialData()

    // Asegurar que siempre salga del estado de carga después de un tiempo
    forceTimeoutRef.current = window.setTimeout(() => {
      if (isLoading) {
        console.log("Forzando salida del estado de carga")
        setIsLoading(false)
        setError("Tiempo de carga excedido. Por favor, recarga la página.")
      }
    }, 5000)

    return () => {
      if (forceTimeoutRef.current) {
        window.clearTimeout(forceTimeoutRef.current)
        forceTimeoutRef.current = null
      }
    }
  }, [loadInitialData])

  // Inicializar el inventario si no existe para nuevos productos
  useEffect(() => {
    const initializeInventory = async () => {
      if (products.length > 0 && !isLoading) {
        const newInventory = [...inventory]
        let hasChanges = false

        products.forEach((product) => {
          if (!inventory.some((item) => item.productId === product.id)) {
            newInventory.push({
              productId: product.id,
              quantity: 0,
            })
            hasChanges = true
          }
        })

        if (hasChanges) {
          setInventory(newInventory)
          await saveInventory(newInventory)
        }
      }
    }

    initializeInventory()
  }, [products, inventory, isLoading])

  // Actualizar el precio actual cuando se selecciona un producto
  useEffect(() => {
    if (selectedStockProduct) {
      setCurrentPrice(selectedStockProduct.price)
    }
  }, [selectedStockProduct])

  // Función para obtener el stock actual de un producto
  const getProductStock = (productId: number): number => {
    const productStock = inventory.find((item) => item.productId === productId)
    return productStock ? productStock.quantity : 0
  }

  // Función para actualizar el inventario
  const updateInventory = async (productId: number, quantity: number, isAddition: boolean) => {
    const newInventory = inventory.map((item) =>
      item.productId === productId
        ? { ...item, quantity: isAddition ? item.quantity + quantity : item.quantity - quantity }
        : item,
    )

    setInventory(newInventory)
    await saveInventory(newInventory)
  }

  // Función para actualizar el precio de un producto
  const updateProductPrice = async (productId: number, newPrice: number) => {
    const newProducts = products.map((product) =>
      product.id === productId ? { ...product, price: newPrice } : product,
    )

    setProducts(newProducts)
    await saveProducts(newProducts)
  }

  // Manejar el registro de retiro de stock
  const handleWithdrawal = async () => {
    if (selectedHotel && selectedProduct && quantity > 0) {
      // Verificar si hay suficiente stock
      const currentStock = getProductStock(selectedProduct.id)

      if (quantity > currentStock) {
        setShowStockError(true)
        setTimeout(() => {
          setShowStockError(false)
        }, 3000)
        return
      }

      try {
        // Actualizar el inventario (restar)
        await updateInventory(selectedProduct.id, quantity, false)

        // Crear el nuevo registro
        const newRecord: StockRecord = {
          id: Date.now(),
          hotelId: selectedHotel.id,
          hotelName: selectedHotel.name,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productUnit: selectedProduct.unit,
          quantity,
          price: selectedProduct.price,
          date: new Date(),
          type: "salida",
        }

        // Guardar el registro
        await saveRecord(newRecord)

        // Actualizar el estado local
        setRecords([newRecord, ...records])

        // Mostrar confirmación
        setConfirmationMessage(
          `${selectedHotel.name} ha retirado ${quantity} ${selectedProduct.unit} de ${
            selectedProduct.name
          } (${formatCurrency(quantity * selectedProduct.price)})`,
        )
        setShowConfirmation(true)

        // Reset form after 3 seconds
        setTimeout(() => {
          setShowConfirmation(false)
        }, 3000)

        // Limpiar el formulario
        setSelectedProduct(null)
        setQuantity(1)
      } catch (error) {
        console.error("Error al registrar retiro:", error)
        setError("Error al registrar retiro. Por favor, intenta nuevamente.")
      }
    }
  }

  // Manejar el registro de entrada de stock
  const handleStockAddition = async () => {
    if (selectedStockProduct && stockQuantity > 0) {
      try {
        // Actualizar el precio del producto si ha cambiado
        if (currentPrice !== selectedStockProduct.price) {
          await updateProductPrice(selectedStockProduct.id, currentPrice)
        }

        // Crear el nuevo registro
        const newRecord: StockRecord = {
          id: Date.now(),
          hotelId: null,
          hotelName: null,
          productId: selectedStockProduct.id,
          productName: selectedStockProduct.name,
          productUnit: selectedStockProduct.unit,
          quantity: stockQuantity,
          price: currentPrice,
          date: new Date(),
          type: "entrada",
        }

        // Actualizar el inventario (sumar)
        await updateInventory(selectedStockProduct.id, stockQuantity, true)

        // Guardar el registro
        await saveRecord(newRecord)

        // Actualizar el estado local
        setRecords([newRecord, ...records])

        // Mostrar confirmación
        setConfirmationMessage(
          `Se han agregado ${stockQuantity} ${selectedStockProduct.unit} de ${
            selectedStockProduct.name
          } al inventario (${formatCurrency(currentPrice)} c/u)`,
        )
        setShowConfirmation(true)

        // Reset form after 3 seconds
        setTimeout(() => {
          setShowConfirmation(false)
        }, 3000)

        // Limpiar el formulario
        setSelectedStockProduct(null)
        setStockQuantity(1)
        setCurrentPrice(0)
      } catch (error) {
        console.error("Error al agregar stock:", error)
        setError("Error al agregar stock. Por favor, intenta nuevamente.")
      }
    }
  }

  // Manejar la creación de un nuevo producto
  const handleAddNewProduct = async () => {
    // Validar que los campos no estén vacíos
    if (!newProductName.trim() || !newProductUnit.trim() || newProductPrice <= 0) {
      setNewProductError("Todos los campos son obligatorios y el precio debe ser mayor a cero")
      return
    }

    // Validar que no exista un producto con el mismo nombre
    if (products.some((p) => p.name.toLowerCase() === newProductName.toLowerCase())) {
      setNewProductError("Ya existe un producto con ese nombre")
      return
    }

    try {
      // Crear el nuevo producto
      const newProductId = Math.max(...products.map((p) => p.id), 0) + 1
      const newProduct: Product = {
        id: newProductId,
        name: newProductName,
        unit: newProductUnit,
        price: newProductPrice,
      }

      // Guardar el nuevo producto
      await saveProduct(newProduct)

      // Actualizar la lista de productos localmente
      setProducts([...products, newProduct])

      // Añadir el producto al inventario con stock inicial 0
      const newInventoryItem: ProductStock = { productId: newProductId, quantity: 0 }
      await saveInventoryItem(newInventoryItem)

      // Actualizar el inventario localmente
      setInventory([...inventory, newInventoryItem])

      // Mostrar confirmación
      setConfirmationMessage(
        `Se ha creado el nuevo producto: ${newProductName} (${formatCurrency(newProductPrice)} por ${newProductUnit})`,
      )
      setShowConfirmation(true)

      // Reset form after 3 seconds
      setTimeout(() => {
        setShowConfirmation(false)
      }, 3000)

      // Limpiar el formulario
      setNewProductName("")
      setNewProductUnit("")
      setNewProductPrice(0)
      setNewProductError("")
      setShowNewProductForm(false)
    } catch (error) {
      console.error("Error al crear nuevo producto:", error)
      setNewProductError("Error al crear el producto. Por favor, intenta nuevamente.")
    }
  }

  const startEditing = (record: StockRecord) => {
    const hotel = record.hotelId ? hotels.find((h) => h.id === record.hotelId) || null : null
    const product: Product = {
      id: record.productId,
      name: record.productName,
      unit: record.productUnit,
      price: record.price,
    }

    setEditingRecord(record.id)
    setEditHotel(hotel)
    setEditProduct(product)
    setEditQuantity(record.quantity)
    setEditPrice(record.price)
  }

  const cancelEditing = () => {
    setEditingRecord(null)
  }

  const saveEdit = async (recordId: number) => {
    const recordToEdit = records.find((r) => r.id === recordId)

    if (!recordToEdit || !editProduct || editQuantity <= 0 || editPrice <= 0) return

    // Si es un registro de salida, necesitamos verificar el hotel
    if (recordToEdit.type === "salida" && !editHotel) return

    try {
      // Calcular la diferencia de cantidad para actualizar el inventario
      const quantityDifference = editQuantity - recordToEdit.quantity

      // Para registros de salida, verificar si hay suficiente stock
      if (recordToEdit.type === "salida" && quantityDifference > 0) {
        const currentStock = getProductStock(editProduct.id)
        if (quantityDifference > currentStock) {
          setShowStockError(true)
          setTimeout(() => {
            setShowStockError(false)
          }, 3000)
          return
        }
      }

      // Actualizar el inventario
      if (recordToEdit.productId === editProduct.id) {
        // Si es el mismo producto, solo ajustamos la cantidad
        if (recordToEdit.type === "entrada") {
          await updateInventory(editProduct.id, Math.abs(quantityDifference), quantityDifference > 0)
        } else {
          await updateInventory(editProduct.id, Math.abs(quantityDifference), quantityDifference < 0)
        }
      } else {
        // Si cambió el producto, revertimos la operación original y aplicamos la nueva
        if (recordToEdit.type === "entrada") {
          await updateInventory(recordToEdit.productId, recordToEdit.quantity, false)
          await updateInventory(editProduct.id, editQuantity, true)
        } else {
          await updateInventory(recordToEdit.productId, recordToEdit.quantity, true)
          await updateInventory(editProduct.id, editQuantity, false)
        }
      }

      // Si es una entrada y cambió el precio, actualizar el precio del producto
      if (recordToEdit.type === "entrada" && editPrice !== recordToEdit.price) {
        await updateProductPrice(editProduct.id, editPrice)
      }

      // Actualizar el registro
      const updatedRecord: StockRecord = {
        ...recordToEdit,
        hotelId: recordToEdit.type === "salida" ? editHotel?.id || null : null,
        hotelName: recordToEdit.type === "salida" ? editHotel?.name || null : null,
        productId: editProduct.id,
        productName: editProduct.name,
        productUnit: editProduct.unit,
        quantity: editQuantity,
        price: editPrice,
      }

      // Guardar el registro actualizado
      await saveRecord(updatedRecord)

      // Actualizar el registro localmente
      const newRecords = records.map((record) => (record.id === recordId ? updatedRecord : record))
      setRecords(newRecords)

      setEditingRecord(null)
    } catch (error) {
      console.error("Error al editar registro:", error)
      setError("Error al editar registro. Por favor, intenta nuevamente.")
    }
  }

  // Función para exportar datos
  const handleExportData = async () => {
    try {
      const data = await exportAllData()

      // Convertir a JSON
      const jsonData = JSON.stringify(data, null, 2)

      // Crear un blob y un enlace de descarga
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `hoteles-stock-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      setShowImportExportDialog(false)
    } catch (error) {
      console.error("Error al exportar datos:", error)
      setError("Error al exportar datos. Por favor, intenta nuevamente.")
    }
  }

  // Función para importar datos
  const handleImportData = async () => {
    if (!importFile) {
      setImportError("Por favor, selecciona un archivo para importar.")
      return
    }

    try {
      const fileContent = await importFile.text()
      const data = JSON.parse(fileContent)

      // Validar el formato del archivo
      if (!data.products || !data.inventory || !data.records) {
        setImportError("El archivo no tiene el formato correcto.")
        return
      }

      // Importar los datos
      const result = await importAllData(data)

      if (result) {
        // Recargar los datos
        await loadInitialData()
        setShowImportExportDialog(false)

        // Mostrar confirmación
        setConfirmationMessage("Datos importados correctamente.")
        setShowConfirmation(true)
        setTimeout(() => {
          setShowConfirmation(false)
        }, 3000)
      } else {
        setImportError("Error al importar los datos. Por favor, intenta nuevamente.")
      }
    } catch (error) {
      console.error("Error al importar datos:", error)
      setImportError("Error al procesar el archivo. Asegúrate de que sea un archivo JSON válido.")
    }
  }

  // Calcular totales por hotel y producto
  const calculateTotals = () => {
    const totals: Record<
      string,
      Record<string, { quantity: number; totalCost: number; price: number; unit: string }>
    > = {}

    // Inicializar la estructura de datos
    hotels.forEach((hotel) => {
      totals[hotel.id] = {}
      products.forEach((product) => {
        totals[hotel.id][product.id] = { quantity: 0, totalCost: 0, price: product.price, unit: product.unit }
      })
    })

    // Sumar las cantidades y costos (solo para registros de salida)
    records
      .filter((record) => record.type === "salida" && record.hotelId)
      .forEach((record) => {
        if (record.hotelId) {
          const hotelId = record.hotelId
          const productId = record.productId
          const cost = record.quantity * record.price

          if (!totals[hotelId][productId]) {
            totals[hotelId][productId] = {
              quantity: 0,
              totalCost: 0,
              price: record.price,
              unit: record.productUnit,
            }
          }

          totals[hotelId][productId].quantity += record.quantity
          totals[hotelId][productId].totalCost += cost
        }
      })

    return totals
  }

  // Calcular el total gastado por hotel
  const calculateHotelTotals = () => {
    const hotelTotals: Record<string, number> = {}
    const productTotals: Record<string, { quantity: number; totalCost: number }> = {}
    let grandTotal = 0

    // Inicializar totales por hotel
    hotels.forEach((hotel) => {
      hotelTotals[hotel.id] = 0
    })

    // Inicializar totales por producto
    products.forEach((product) => {
      productTotals[product.id] = { quantity: 0, totalCost: 0 }
    })

    // Sumar los costos por hotel y producto
    records
      .filter((record) => record.type === "salida" && record.hotelId)
      .forEach((record) => {
        if (record.hotelId) {
          const cost = record.quantity * record.price
          hotelTotals[record.hotelId] += cost
          grandTotal += cost

          if (!productTotals[record.productId]) {
            productTotals[record.productId] = { quantity: 0, totalCost: 0 }
          }
          productTotals[record.productId].quantity += record.quantity
          productTotals[record.productId].totalCost += cost
        }
      })

    return { hotelTotals, productTotals, grandTotal }
  }

  // Manejar el cambio de pestaña
  const handleTabChange = (value: string) => {
    // Si intenta acceder a la pestaña de agregar stock y no está autenticado
    if ((value === "add-stock" || value === "summary") && !isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    setActiveTab(value)
  }

  // Verificar la contraseña
  const handleAuthentication = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setShowAuthDialog(false)
      setAuthError(false)
      setPassword("")
      setActiveTab("add-stock")
    } else {
      setAuthError(true)
    }
  }

  // Cerrar sesión
  const handleLogout = () => {
    setIsAuthenticated(false)
    if (activeTab === "add-stock" || activeTab === "summary") {
      setActiveTab("register")
    }
  }

  const totals = calculateTotals()
  const { hotelTotals, productTotals, grandTotal } = calculateHotelTotals()

  // Mostrar pantalla de carga mientras se inicializan los datos
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-700">Cargando datos...</h2>
        <p className="text-gray-500 mt-2">Por favor espere mientras se cargan los datos del sistema.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-start mb-6">
        <h1 className="text-3xl font-bold text-gray-800">HOTELES DE LA COSTA</h1>
        <h2 className="text-xl text-gray-600">Sistema de Gestión de Stock</h2>
        <div className="flex justify-between w-full mt-2">
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={cn(
                "flex items-center",
                connectionStatus.isOnlineMode ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700",
              )}
              onClick={() => setShowBackupDialog(true)}
            >
              {connectionStatus.isOnlineMode ? (
                <>
                  <Cloud className="h-3 w-3 mr-1" />
                  Datos sincronizados en la nube
                </>
              ) : (
                <>
                  <HardDrive className="h-3 w-3 mr-1" />
                  Datos guardados localmente
                </>
              )}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setShowImportExportDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Importar/Exportar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowBackupDialog(true)}>
              <Download className="h-4 w-4 mr-1" />
              Crear copia de seguridad
            </Button>
          </div>
          {isAuthenticated && (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión de administrador
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {backupStatus === "success" && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500 mr-2" />
          <AlertDescription className="text-green-800">Copia de seguridad creada correctamente.</AlertDescription>
        </Alert>
      )}

      {backupStatus === "error" && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
          <AlertDescription className="text-red-800">Error al crear la copia de seguridad.</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="register">Registrar Retiro</TabsTrigger>
          <TabsTrigger value="add-stock" className="relative">
            {!isAuthenticated && <Lock className="h-3 w-3 absolute right-2 top-2" />}
            Agregar Stock
          </TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="summary" className="relative">
            {!isAuthenticated && <Lock className="h-3 w-3 absolute right-2 top-2" />}
            Resumen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Retiro de Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel">Hotel</Label>
                  <Popover open={hotelOpen} onOpenChange={setHotelOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={hotelOpen}
                        className="w-full justify-between"
                      >
                        {selectedHotel ? selectedHotel.name : "Seleccionar hotel..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar hotel..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron hoteles.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-72">
                              {hotels.map((hotel) => (
                                <CommandItem
                                  key={hotel.id}
                                  value={hotel.name}
                                  onSelect={() => {
                                    setSelectedHotel(hotel)
                                    setHotelOpen(false)
                                  }}
                                >
                                  <Hotel className="mr-2 h-4 w-4" />
                                  {hotel.name}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      selectedHotel?.id === hotel.id ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Producto</Label>
                  <Popover open={productOpen} onOpenChange={setProductOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={productOpen}
                        className="w-full justify-between"
                      >
                        {selectedProduct ? selectedProduct.name : "Seleccionar producto..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar producto..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron productos.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-72">
                              {products.map((product) => {
                                const stock = getProductStock(product.id)
                                return (
                                  <CommandItem
                                    key={product.id}
                                    value={product.name}
                                    onSelect={() => {
                                      setSelectedProduct(product)
                                      setProductOpen(false)
                                    }}
                                    disabled={stock <= 0}
                                  >
                                    <Package className="mr-2 h-4 w-4" />
                                    <div className="flex-1">
                                      {product.name}
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        (Stock: {stock} {product.unit} - {formatCurrency(product.price)} c/u)
                                      </span>
                                    </div>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        selectedProduct?.id === product.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                )
                              })}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedProduct && (
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-sm">
                      Stock disponible:{" "}
                      <span className="font-medium">
                        {getProductStock(selectedProduct.id)} {selectedProduct.unit}
                      </span>
                    </p>
                    <p className="text-sm mt-1">
                      Precio unitario: <span className="font-medium">{formatCurrency(selectedProduct.price)}</span>
                    </p>
                    {quantity > 0 && (
                      <p className="text-sm mt-1">
                        Total: <span className="font-medium">{formatCurrency(quantity * selectedProduct.price)}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct ? getProductStock(selectedProduct.id) : 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleWithdrawal}
                  className="w-full"
                  disabled={
                    !selectedHotel ||
                    !selectedProduct ||
                    quantity <= 0 ||
                    (selectedProduct && quantity > getProductStock(selectedProduct.id))
                  }
                >
                  Registrar Retiro
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-4">
              {showConfirmation && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">{confirmationMessage}</AlertDescription>
                </Alert>
              )}

              {showStockError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    No hay suficiente stock disponible para realizar esta operación.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Últimos Movimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  {records.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay registros de movimientos</p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {records.slice(0, 5).map((record) => (
                          <div key={record.id} className="p-3 border rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">
                                {record.type === "salida" ? record.hotelName : "Entrada de Stock"}
                              </div>
                              <Badge variant={record.type === "entrada" ? "outline" : "secondary"}>
                                {record.type === "entrada" ? (
                                  <PlusCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <MinusCircle className="h-3 w-3 mr-1" />
                                )}
                                {record.type === "entrada" ? "Entrada" : "Salida"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {record.type === "entrada" ? "Se agregaron" : "Se retiraron"} {record.quantity}{" "}
                              {record.productUnit} de {record.productName}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {record.date.toLocaleString()} - {formatCurrency(record.quantity * record.price)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="add-stock">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Lock className="h-10 w-10 text-gray-400 mb-4" />
              <h2 className="text-xl font-medium text-gray-700">Acceso restringido</h2>
              <p className="text-gray-500 mt-2">Debes iniciar sesión como administrador para acceder a esta función.</p>
              <Button className="mt-4" onClick={() => setShowAuthDialog(true)}>
                Iniciar sesión
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Agregar Stock</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stockProduct">Producto</Label>
                      <Popover open={stockProductOpen} onOpenChange={setStockProductOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={stockProductOpen}
                            className="w-full justify-between"
                          >
                            {selectedStockProduct ? selectedStockProduct.name : "Seleccionar producto..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar producto..." />
                            <CommandList>
                              <CommandEmpty>No se encontraron productos.</CommandEmpty>
                              <CommandGroup>
                                <ScrollArea className="h-72">
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      value={product.name}
                                      onSelect={() => {
                                        setSelectedStockProduct(product)
                                        setCurrentPrice(product.price)
                                        setStockProductOpen(false)
                                      }}
                                    >
                                      <Package className="mr-2 h-4 w-4" />
                                      {product.name}
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          selectedStockProduct?.id === product.id ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </ScrollArea>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {selectedStockProduct && (
                      <div className="p-2 bg-gray-50 rounded-md">
                        <p className="text-sm">
                          Stock actual:{" "}
                          <span className="font-medium">
                            {getProductStock(selectedStockProduct.id)} {selectedStockProduct.unit}
                          </span>
                        </p>
                        <p className="text-sm mt-1">
                          Precio actual:{" "}
                          <span className="font-medium">{formatCurrency(selectedStockProduct.price)}</span>
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">Cantidad a agregar</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="1"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(Number.parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentPrice">Precio por {selectedStockProduct?.unit || "unidad"}</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="currentPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          className="pl-8"
                          value={currentPrice}
                          onChange={(e) => setCurrentPrice(Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Si el precio ha cambiado, actualícelo aquí. Se aplicará a todo el stock nuevo.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleStockAddition}
                      className="w-full"
                      disabled={!selectedStockProduct || stockQuantity <= 0 || currentPrice <= 0}
                    >
                      Agregar al Inventario
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Agregar Nuevo Producto</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowNewProductForm(!showNewProductForm)}>
                      {showNewProductForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                      {showNewProductForm ? "Cancelar" : "Nuevo Producto"}
                    </Button>
                  </CardHeader>
                  {showNewProductForm && (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newProductName">Nombre del Producto</Label>
                        <Input
                          id="newProductName"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          placeholder="Ej: Detergente"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newProductUnit">Unidad de Medida</Label>
                        <Input
                          id="newProductUnit"
                          value={newProductUnit}
                          onChange={(e) => setNewProductUnit(e.target.value)}
                          placeholder="Ej: litros, kg, cajas"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newProductPrice">Precio por unidad</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="newProductPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            className="pl-8"
                            value={newProductPrice}
                            onChange={(e) => setNewProductPrice(Number.parseFloat(e.target.value) || 0)}
                            placeholder="Ej: 1500"
                          />
                        </div>
                      </div>

                      {newProductError && <p className="text-sm text-red-500">{newProductError}</p>}

                      <Button onClick={handleAddNewProduct} className="w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Crear Producto
                      </Button>
                    </CardContent>
                  )}
                </Card>
              </div>

              <div className="space-y-4">
                {showConfirmation && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">{confirmationMessage}</AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Inventario Actual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead className="text-right">Stock Disponible</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => {
                          const stock = getProductStock(product.id)
                          return (
                            <TableRow key={product.id}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{product.unit}</TableCell>
                              <TableCell>{formatCurrency(product.price)}</TableCell>
                              <TableCell className="text-right font-medium">{stock}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay registros de movimientos</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {records.map((record) => (
                      <div key={record.id} className="p-3 border rounded-md">
                        {editingRecord === record.id ? (
                          <div className="space-y-3">
                            {record.type === "salida" && (
                              <div className="space-y-2">
                                <Label>Hotel</Label>
                                <Popover open={editHotelOpen} onOpenChange={setEditHotelOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                      {editHotel ? editHotel.name : "Seleccionar hotel..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Buscar hotel..." />
                                      <CommandList>
                                        <CommandEmpty>No se encontraron hoteles.</CommandEmpty>
                                        <CommandGroup>
                                          <ScrollArea className="h-72">
                                            {hotels.map((hotel) => (
                                              <CommandItem
                                                key={hotel.id}
                                                value={hotel.name}
                                                onSelect={() => {
                                                  setEditHotel(hotel)
                                                  setEditHotelOpen(false)
                                                }}
                                              >
                                                <Hotel className="mr-2 h-4 w-4" />
                                                {hotel.name}
                                                <Check
                                                  className={cn(
                                                    "ml-auto h-4 w-4",
                                                    editHotel?.id === hotel.id ? "opacity-100" : "opacity-0",
                                                  )}
                                                />
                                              </CommandItem>
                                            ))}
                                          </ScrollArea>
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Producto</Label>
                              <Popover open={editProductOpen} onOpenChange={setEditProductOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" role="combobox" className="w-full justify-between">
                                    {editProduct ? editProduct.name : "Seleccionar producto..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                  <Command>
                                    <CommandInput placeholder="Buscar producto..." />
                                    <CommandList>
                                      <CommandEmpty>No se encontraron productos.</CommandEmpty>
                                      <CommandGroup>
                                        <ScrollArea className="h-72">
                                          {products.map((product) => (
                                            <CommandItem
                                              key={product.id}
                                              value={product.name}
                                              onSelect={() => {
                                                setEditProduct(product)
                                                setEditPrice(product.price)
                                                setEditProductOpen(false)
                                              }}
                                            >
                                              <Package className="mr-2 h-4 w-4" />
                                              {product.name}
                                              <Check
                                                className={cn(
                                                  "ml-auto h-4 w-4",
                                                  editProduct?.id === product.id ? "opacity-100" : "opacity-0",
                                                )}
                                              />
                                            </CommandItem>
                                          ))}
                                        </ScrollArea>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="space-y-2">
                              <Label>Cantidad</Label>
                              <Input
                                type="number"
                                min="1"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(Number.parseInt(e.target.value) || 0)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Precio por unidad</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="pl-8"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(Number.parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </div>

                            <div className="flex space-x-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => saveEdit(record.id)}
                                disabled={
                                  (record.type === "salida" && !editHotel) ||
                                  !editProduct ||
                                  editQuantity <= 0 ||
                                  editPrice <= 0
                                }
                              >
                                <Save className="h-4 w-4 mr-1" /> Guardar
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>
                                <X className="h-4 w-4 mr-1" /> Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">
                                    {record.type === "salida" ? record.hotelName : "Entrada de Stock"}
                                  </div>
                                  <Badge variant={record.type === "entrada" ? "outline" : "secondary"}>
                                    {record.type === "entrada" ? (
                                      <PlusCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                      <MinusCircle className="h-3 w-3 mr-1" />
                                    )}
                                    {record.type === "entrada" ? "Entrada" : "Salida"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {record.type === "entrada" ? "Se agregaron" : "Se retiraron"} {record.quantity}{" "}
                                  {record.productUnit} de {record.productName} a {formatCurrency(record.price)} c/u
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {record.date.toLocaleString()} - Total:{" "}
                                  {formatCurrency(record.quantity * record.price)}
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => startEditing(record)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Inventario Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead className="text-right">Stock Disponible</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const stock = getProductStock(product.id)
                      const totalValue = stock * product.price
                      return (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.unit}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell className="text-right font-medium">{stock}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(totalValue)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen por Hotel y Producto</CardTitle>
              </CardHeader>
              <CardContent>
                {records.filter((r) => r.type === "salida").length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay datos para mostrar</p>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hotel</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unitario</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hotels.map((hotel) =>
                          products.map((product) => {
                            const data = totals[hotel.id]?.[product.id]
                            if (!data || data.quantity === 0) return null

                            return (
                              <TableRow key={`${hotel.id}-${product.id}`}>
                                <TableCell>{hotel.name}</TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {data.quantity} {data.unit}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(data.price)}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(data.totalCost)}
                                </TableCell>
                              </TableRow>
                            )
                          }),
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Resumen de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Por Hotel</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hotel</TableHead>
                          <TableHead className="text-right">Total Gastado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hotels.map((hotel) => {
                          const total = hotelTotals[hotel.id] || 0
                          if (total === 0) return null

                          return (
                            <TableRow key={hotel.id}>
                              <TableCell>{hotel.name}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow>
                          <TableCell className="font-bold">TOTAL GENERAL</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(grandTotal)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Por Producto</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad Total</TableHead>
                          <TableHead className="text-right">Total Gastado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => {
                          const data = productTotals[product.id]
                          if (!data || data.quantity === 0) return null

                          return (
                            <TableRow key={product.id}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell className="text-right">
                                {data.quantity} {product.unit}
                              </TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(data.totalCost)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo de autenticación */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Autenticación requerida</DialogTitle>
            <DialogDescription>Ingrese la contraseña de administrador para acceder a esta función.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese la contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAuthentication()
                  }
                }}
              />
              {authError && <p className="text-sm text-red-500">Contraseña incorrecta. Intente nuevamente.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAuthentication}>Acceder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de copia de seguridad */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración de conexión</DialogTitle>
            <DialogDescription>Seleccione el modo de almacenamiento y sincronice sus datos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Modo de conexión</h3>
              <div className="flex flex-col gap-4">
                <div
                  className={cn(
                    "p-4 border rounded-md cursor-pointer flex items-center gap-3",
                    connectionStatus.isOnlineMode ? "border-green-500 bg-green-50" : "border-gray-200",
                  )}
                  onClick={() => connectionStatus.toggleOnlineMode(true)}
                >
                  <Cloud
                    className={cn("h-6 w-6", connectionStatus.isOnlineMode ? "text-green-500" : "text-gray-400")}
                  />
                  <div>
                    <h4 className="font-medium">Modo Online</h4>
                    <p className="text-sm text-muted-foreground">
                      Los datos se guardan en la nube y están disponibles en todos los dispositivos.
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-4 border rounded-md cursor-pointer flex items-center gap-3",
                    !connectionStatus.isOnlineMode ? "border-blue-500 bg-blue-50" : "border-gray-200",
                  )}
                  onClick={() => connectionStatus.toggleOnlineMode(false)}
                >
                  <HardDrive
                    className={cn("h-6 w-6", !connectionStatus.isOnlineMode ? "text-blue-500" : "text-gray-400")}
                  />
                  <div>
                    <h4 className="font-medium">Modo Local</h4>
                    <p className="text-sm text-muted-foreground">
                      Los datos se guardan localmente en este dispositivo.
                    </p>
                  </div>
                </div>
              </div>

              {backupError && (
                <Alert className="mt-4 bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                  <AlertDescription className="text-red-800">{backupError}</AlertDescription>
                </Alert>
              )}

              {connectionStatus.isOnlineMode && (
                <div className="mt-4">
                  <Button onClick={handleSyncWithSupabase} disabled={backupStatus === "creating"} className="w-full">
                    {backupStatus === "creating" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 mr-2" />
                        Sincronizar datos con la nube
                      </>
                    )}
                  </Button>

                  {connectionStatus.lastSyncTime && (
                    <p className="text-xs text-center mt-2 text-muted-foreground">
                      Última sincronización: {connectionStatus.lastSyncTime.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Crear copia de seguridad local</h3>
              <p className="text-sm text-muted-foreground">
                Cree una copia de seguridad de todos los datos del sistema. Se descargará un archivo que puede guardar
                para restaurar posteriormente.
              </p>
              <Button onClick={handleCreateBackup} className="w-full" disabled={backupStatus === "creating"}>
                {backupStatus === "creating" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando copia de seguridad...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Crear copia de seguridad local
                  </>
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de importación/exportación */}
      <Dialog open={showImportExportDialog} onOpenChange={setShowImportExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar/Exportar Datos</DialogTitle>
            <DialogDescription>Guarde sus datos o cargue datos previamente guardados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Exportar Datos</h3>
              <p className="text-sm text-muted-foreground">
                Guarde todos los datos del sistema en un archivo para respaldo o transferencia.
              </p>
              <Button onClick={handleExportData} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar Datos
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Importar Datos</h3>
              <p className="text-sm text-muted-foreground">
                Cargue datos previamente exportados. Esto reemplazará todos los datos actuales.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="importFile">Archivo de datos</Label>
                <Input
                  id="importFile"
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                {importError && <p className="text-sm text-red-500">{importError}</p>}
              </div>
              <Button onClick={handleImportData} className="w-full mt-2" disabled={!importFile}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Datos
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportExportDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
