import ProtectedRoute from "@/components/protected-route"
import EmpleadosClient from "./client-page"

export default function EmpleadosPage() {
  return (
    <ProtectedRoute>
      <EmpleadosClient />
    </ProtectedRoute>
  )
}
