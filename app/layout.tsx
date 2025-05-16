import type React from "react"
import { Providers } from "./providers"
import "./globals.css"

export const metadata = {
  title: "Hoteles de la Costa - Sistema de Gestión",
  description: "Sistema de gestión para Hoteles de la Costa",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
