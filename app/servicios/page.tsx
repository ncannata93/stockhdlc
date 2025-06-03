import { Suspense } from "react"
import ServiceClientPage from "./client-page"
import LoadingScreen from "@/components/loading-screen"

export default function ServiciosPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ServiceClientPage />
    </Suspense>
  )
}
