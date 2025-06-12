import { Suspense } from "react"
import StockClientPage from "./client-page"
import LoadingScreen from "@/components/loading-screen"
import { RouteGuard } from "@/components/route-guard"

export default function StockPage() {
  return (
    <RouteGuard requiredModule="stock">
      <Suspense fallback={<LoadingScreen />}>
        <StockClientPage />
      </Suspense>
    </RouteGuard>
  )
}
