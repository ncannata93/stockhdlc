"use client"

import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import StockClientPage from "./client-page"

export default function StockPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">
            {isLoading ? "Verificando autenticación..." : "Redirigiendo..."}
          </h2>
        </div>
      </div>
    )
  }

  return <StockClientPage />
}
