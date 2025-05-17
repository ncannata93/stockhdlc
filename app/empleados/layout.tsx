import type { ReactNode } from "react"
import ProtectedRoute from "@/components/protected-route"
import { MainNavigation } from "@/components/main-navigation"

export default function EmpleadosLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowRedirect={false}>
      <div className="flex flex-col min-h-screen">
        <MainNavigation />
        <div className="flex-1">{children}</div>
      </div>
    </ProtectedRoute>
  )
}
