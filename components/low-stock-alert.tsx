"use client"

import { useState } from "react"
import { AlertTriangle, X, ArrowDown } from "lucide-react"
import type { Product, InventoryItem } from "@/lib/local-db"

type LowStockProductInfo = {
  id: number
  name: string
  unit: string
  quantity: number
  min_stock: number
  deficit: number
}

interface LowStockAlertProps {
  products: Product[]
  inventory: InventoryItem[]
}

export default function LowStockAlert({ products, inventory }: LowStockAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Identificar productos con stock bajo
  const lowStockProducts: LowStockProductInfo[] = products
    .map((product) => {
      const inventoryItem = inventory.find((item) => item.productId === product.id)
      if (!inventoryItem) return null

      const quantity = inventoryItem.quantity
      const deficit = product.min_stock - quantity

      if (quantity < product.min_stock) {
        return {
          id: product.id,
          name: product.name,
          unit: product.unit,
          quantity,
          min_stock: product.min_stock,
          deficit,
        }
      }
      return null
    })
    .filter((item): item is LowStockProductInfo => item !== null)
    .sort((a, b) => b.deficit - a.deficit) // Ordenar por mayor déficit primero

  // Si no hay productos con stock bajo o se ha descartado la alerta, no mostrar nada
  if (lowStockProducts.length === 0 || isDismissed) return null

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
      <div className="p-3 flex justify-between items-center">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800 text-sm md:text-base">
              {lowStockProducts.length === 1
                ? "1 producto con stock bajo"
                : `${lowStockProducts.length} productos con stock bajo`}
            </h3>
            <p className="text-xs md:text-sm text-amber-700">Es necesario reabastecer estos productos pronto</p>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-amber-700 hover:text-amber-900 mr-2"
            aria-label={isExpanded ? "Contraer detalles" : "Expandir detalles"}
          >
            <ArrowDown className={`h-5 w-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-amber-700 hover:text-amber-900"
            aria-label="Descartar alerta"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-amber-200 p-3">
          {/* Versión móvil */}
          <div className="md:hidden">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="py-2 border-b border-amber-100 last:border-0">
                <div className="font-medium text-amber-800">{product.name}</div>
                <div className="grid grid-cols-3 text-xs text-amber-700">
                  <div>
                    <span className="text-amber-600">Actual:</span>{" "}
                    <span className="font-medium">
                      {product.quantity} {product.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-600">Mínimo:</span>{" "}
                    <span className="font-medium">
                      {product.min_stock} {product.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-600">Déficit:</span>{" "}
                    <span className="font-medium">
                      {product.deficit} {product.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Versión desktop */}
          <div className="hidden md:block">
            <table className="min-w-full">
              <thead>
                <tr className="text-amber-800 text-left text-sm">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2">Stock Actual</th>
                  <th className="pb-2">Mínimo</th>
                  <th className="pb-2">Déficit</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id} className="text-amber-700">
                    <td className="py-1">{product.name}</td>
                    <td className="py-1">
                      {product.quantity} {product.unit}
                    </td>
                    <td className="py-1">
                      {product.min_stock} {product.unit}
                    </td>
                    <td className="py-1 font-medium">
                      {product.deficit} {product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
