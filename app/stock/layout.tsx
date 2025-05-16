import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/lib/auth-context"

export const metadata: Metadata = {
  title: "Gestión de Stock - Hoteles de la Costa",
  description: "Sistema de gestión de inventario para Hoteles de la Costa",
}

export default function StockLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="stock-system">
      <AuthProvider>{children}</AuthProvider>
    </div>
  )
}
