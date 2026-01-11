"use client"

import { useState, useEffect } from "react"
import { isSupabaseAvailable } from "@/lib/supabase"
import { AlertCircle, CheckCircle, Database } from "lucide-react"

export function SupabaseDebug() {
  const [status, setStatus] = useState<{
    available: boolean
    error: string | null
    loading: boolean
  }>({
    available: false,
    error: null,
    loading: true,
  })

  useEffect(() => {
    checkSupabaseStatus()
  }, [])

  const checkSupabaseStatus = async () => {
    setStatus({ available: false, error: null, loading: true })

    try {
      const result = await isSupabaseAvailable()
      setStatus({
        available: result.available,
        error: result.error,
        loading: false,
      })
    } catch (error) {
      setStatus({
        available: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        loading: false,
      })
    }
  }

  if (status.loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Database className="h-4 w-4 animate-spin" />
        <span>Verificando conexión a Supabase...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {status.available ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Supabase conectado</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-600">Supabase desconectado: {status.error}</span>
        </>
      )}
      <button onClick={checkSupabaseStatus} className="ml-2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
        Verificar
      </button>
    </div>
  )
}
