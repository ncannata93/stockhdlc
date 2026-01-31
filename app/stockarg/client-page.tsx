"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Importar dinámicamente el componente StockManagementArg
const StockManagementArg = dynamic(() => import("@/components/stock-management-arg"), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
      <h2 className="text-xl font-medium text-gray-700">Cargando componente...</h2>
    </div>
  ),
})

export default function StockArgClientPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-700">Cargando...</h2>
          </div>
        }
      >
        <StockManagementArg />
      </Suspense>
    </div>
  )
}
