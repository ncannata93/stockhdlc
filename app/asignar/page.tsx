import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import AsignarClientPage from "../asignacion-simple/page"

export const metadata: Metadata = {
  title: "Asignar - Hoteles de la Costa",
  description: "Asignación de empleados",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  )
}

export default function AsignarPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AsignarClientPage />
    </Suspense>
  )
}
