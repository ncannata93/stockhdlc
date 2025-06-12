import { Suspense } from "react"
import EmpleadosClientPage from "./client-page"
import LoadingScreen from "@/components/loading-screen"
import { RouteGuard } from "@/components/route-guard"

export default function EmpleadosPage() {
  return (
    <RouteGuard requiredModule="empleados">
      <Suspense fallback={<LoadingScreen />}>
        <EmpleadosClientPage />
      </Suspense>
    </RouteGuard>
  )
}
