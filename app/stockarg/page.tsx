import { Suspense } from "react"
import StockArgClientPage from "./client-page"

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  )
}

export default function StockArgPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StockArgClientPage />
    </Suspense>
  )
}
