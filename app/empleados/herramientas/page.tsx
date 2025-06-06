import ProtectedRoute from "@/components/protected-route"
import HerramientasClient from "./client-page"

export default function HerramientasPage() {
  return (
    <ProtectedRoute>
      <HerramientasClient />
    </ProtectedRoute>
  )
}
