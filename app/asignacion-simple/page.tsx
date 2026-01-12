import { Suspense } from "react"
import AsignacionSimple from "@/components/empleados/asignacion-simple"
import { Card, CardContent } from "@/components/ui/card"

export default function AsignacionSimplePage() {
  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <Card className="border-2 border-blue-400">
        <CardContent className="pt-6">
          <Suspense fallback={<div>Cargando...</div>}>
            <AsignacionSimple />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
