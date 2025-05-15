"use client"

import { useState, useEffect } from "react"
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

// Tipo para productos
type Product = {
  id: number
  name: string
  unit: string
  price: number // Precio por unidad
}

// Contraseña para acceder a la función de agregar stock
const ADMIN_PASSWORD = "Qw425540" // En una aplicación real, esto debería estar en el servidor

// Tipos
type StockRecord = {
  id: number
  hotel: (typeof hotels)[0] | null
  product: Product
  quantity: number
  price: number // Precio al momento de la transacción
  date: Date
  type: "entrada" | "salida"
}

type ProductStock = {
  productId: number
  quantity: number
}

// Función para formatear precio
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount)
}

export default function StockManagement() {
  // Estado para productos
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: "Leche", unit: "litros", price: 1200 },
    { id: 2, name: "Cafe", unit: "kg", price: 5000 },
    { id: 3, name: "azucar", unit: "kg", price: 1800 },
    { id: 4, name: "jabon", unit: "caja", price: 3500 },
    { id: 5, name: "papel higienico", unit: "bolson", price: 4200 },
    { id: 6, name: "shampoo", unit: "caja", price: 2800 },
  ])

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

  // Inicializar el inventario
  useEffect(() => {
    const initialInventory = products.map((product) => ({
      productId: product.id,
      quantity: 0,
    }))
    setInventory(initialInventory)
  }, [products])

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
  const updateInventory = (productId: number, quantity: number, isAddition: boolean) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: isAddition ? item.quantity + quantity : item.quantity - quantity }
          : item,
      ),
    )
  }

  // Función para actualizar el precio de un producto
  const updateProductPrice = (productId: number, newPrice: number) => {
    setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, price: newPrice } : product)))
  }

  // Manejar el registro de retiro de stock
  const handleWithdrawal = () => {
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

      const newRecord: StockRecord = {
        id: Date.now(),
        hotel: selectedHotel,
        product: selectedProduct,
        quantity,
        price: selectedProduct.price, // Guardar el precio actual
        date: new Date(),
        type: "salida",
      }

      // Actualizar el inventario (restar)
      updateInventory(selectedProduct.id, quantity, false)

      // Agregar el registro
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
    }
  }

  // Manejar el registro de entrada de stock
  const handleStockAddition = () => {
    if (selectedStockProduct && stockQuantity > 0) {
      // Actualizar el precio del producto si ha cambiado
      if (currentPrice !== selectedStockProduct.price) {
        updateProductPrice(selectedStockProduct.id, currentPrice)
      }

      const newRecord: StockRecord = {
        id: Date.now(),
        hotel: null, // No hay hotel asociado a una entrada de stock
        product: { ...selectedStockProduct, price: currentPrice },
        quantity: stockQuantity,
        price: currentPrice, // Guardar el precio actual
        date: new Date(),
        type: "entrada",
      }

      // Actualizar el inventario (sumar)
      updateInventory(selectedStockProduct.id, stockQuantity, true)

      // Agregar el registro
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
    }
  }

  // Manejar la creación de un nuevo producto
  const handleAddNewProduct = () => {
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

    // Crear el nuevo producto
    const newProductId = Math.max(...products.map((p) => p.id), 0) + 1
    const newProduct: Product = {
      id: newProductId,
      name: newProductName,
      unit: newProductUnit,
      price: newProductPrice,
    }

    // Actualizar la lista de productos
    setProducts([...products, newProduct])

    // Añadir el producto al inventario con stock inicial 0
    setInventory([...inventory, { productId: newProductId, quantity: 0 }])

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
  }

  const startEditing = (record: StockRecord) => {
    setEditingRecord(record.id)
    setEditHotel(record.hotel)
    setEditProduct(record.product)
    setEditQuantity(record.quantity)
    setEditPrice(record.price)
  }

  const cancelEditing = () => {
    setEditingRecord(null)
  }

  const saveEdit = (recordId: number) => {
    const recordToEdit = records.find((r) => r.id === recordId)

    if (!recordToEdit || !editProduct || editQuantity <= 0 || editPrice <= 0) return

    // Si es un registro de salida, necesitamos verificar el hotel
    if (recordToEdit.type === "salida" && !editHotel) return

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
    if (recordToEdit.product.id === editProduct.id) {
      // Si es el mismo producto, solo ajustamos la cantidad
      if (recordToEdit.type === "entrada") {
        updateInventory(editProduct.id, Math.abs(quantityDifference), quantityDifference > 0)
      } else {
        updateInventory(editProduct.id, Math.abs(quantityDifference), quantityDifference < 0)
      }
    } else {
      // Si cambió el producto, revertimos la operación original y aplicamos la nueva
      if (recordToEdit.type === "entrada") {
        updateInventory(recordToEdit.product.id, recordToEdit.quantity, false)
        updateInventory(editProduct.id, editQuantity, true)
      } else {
        updateInventory(recordToEdit.product.id, recordToEdit.quantity, true)
        updateInventory(editProduct.id, editQuantity, false)
      }
    }

    // Si es una entrada y cambió el precio, actualizar el precio del producto
    if (recordToEdit.type === "entrada" && editPrice !== recordToEdit.price) {
      updateProductPrice(editProduct.id, editPrice)
    }

    // Actualizar el registro
    setRecords(
      records.map((record) =>
        record.id === recordId
          ? {
              ...record,
              hotel: recordToEdit.type === "salida" ? editHotel : null,
              product: { ...editProduct, price: editPrice },
              quantity: editQuantity,
              price: editPrice,
            }
          : record,
      ),
    )

    setEditingRecord(null)
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
      .filter((record) => record.type === "salida" && record.hotel)
      .forEach((record) => {
        if (record.hotel) {
          const hotelId = record.hotel.id
          const productId = record.product.id
          const cost = record.quantity * record.price

          if (!totals[hotelId][productId]) {
            totals[hotelId][productId] = {
              quantity: 0,
              totalCost: 0,
              price: record.price,
              unit: record.product.unit,
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
      .filter((record) => record.type === "salida" && record.hotel)
      .forEach((record) => {
        if (record.hotel) {
          const cost = record.quantity * record.price
          hotelTotals[record.hotel.id] += cost
          grandTotal += cost

          if (!productTotals[record.product.id]) {
            productTotals[record.product.id] = { quantity: 0, totalCost: 0 }
          }
          productTotals[record.product.id].quantity += record.quantity
          productTotals[record.product.id].totalCost += cost
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
    if (activeTab === "add-stock") {
      setActiveTab("register")
    }
  }

  const totals = calculateTotals()
  const { hotelTotals, productTotals, grandTotal } = calculateHotelTotals()

  return (
    <>
      <div className="flex flex-col items-start mb-6">
        <h1 className="text-3xl font-bold text-gray-800">HOTELES DE LA COSTA</h1>
        <h2 className="text-xl text-gray-600">Sistema de Gestión de Stock</h2>
        {isAuthenticated && (
          <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2 self-end">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión de administrador
          </Button>
        )}
      </div>

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
                                {record.type === "salida" ? record.hotel?.name : "Entrada de Stock"}
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
                              {record.product.unit} de {record.product.name}
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
                        Precio actual: <span className="font-medium">{formatCurrency(selectedStockProduct.price)}</span>
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
                                    {record.type === "salida" ? record.hotel?.name : "Entrada de Stock"}
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
                                  {record.product.unit} de {record.product.name} a {formatCurrency(record.price)} c/u
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
    </>
  )
}
