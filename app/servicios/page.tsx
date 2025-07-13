"use client"

import { useEffect } from "react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import ServiciosClientPage from "./client-page"

export default function ServiciosPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  return <ServiciosClientPage />
}
