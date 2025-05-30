import ProtectedRoute from "@/components/protected-route"
import ServiciosClient from "./client-page"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function ServiciosPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-700">Cargando servicios...</h2>
            </div>
          </div>
        }
      >
        <ServiciosClient />
      </Suspense>
    </ProtectedRoute>
  )
}
