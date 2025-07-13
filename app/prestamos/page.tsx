"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import PrestamosClientPage from "./client-page"

export default function PrestamosPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  if (!isLoading && !isAuthenticated) {
    router.push("/login")
  }

  return <PrestamosClientPage />
}
