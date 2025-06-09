import { Suspense } from "react"
import AsignacionSimpleApp from "@/components/empleados/asignacion-simple-app"

export const metadata = {
  title: "Asignar Empleado - Hoteles de la Costa",
  description: "Asignación rápida de empleados",
  manifest: "/manifest.json",
  themeColor: "#1e40af",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
}

export default function AsignacionAppPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <AsignacionSimpleApp />
      </Suspense>
    </div>
  )
}
