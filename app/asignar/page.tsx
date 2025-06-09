import { Suspense } from "react"
import AsignacionSimple from "@/components/empleados/asignacion-simple"

export default function AsignacionRapidaPage() {
  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <Suspense fallback={<div>Cargando...</div>}>
        <AsignacionSimple />
      </Suspense>
    </div>
  )
}
