import { Suspense } from "react"
import ServiceClientPage from "./client-page"

function ServicePageFallback() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando servicios...</p>
      </div>
    </div>
  )
}

export default function ServiciosPage() {
  return (
    <Suspense fallback={<ServicePageFallback />}>
      <ServiceClientPage />
    </Suspense>
  )
}
