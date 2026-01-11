"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)
  const router = useRouter()

  // Verificar si hay un hash en la URL (token de restablecimiento)
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          setError("Cliente Supabase no disponible")
          setIsProcessing(false)
          return
        }

        // Verificar si hay un token de recuperación en la URL
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error al verificar sesión:", error)
          setError("No se pudo verificar el token de restablecimiento")
        } else if (!data.session) {
          setError("Token de restablecimiento inválido o expirado")
        }

        setIsProcessing(false)
      } catch (err) {
        console.error("Error al procesar token:", err)
        setError("Error al procesar el token de restablecimiento")
        setIsProcessing(false)
      }
    }

    checkResetToken()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    // Validar contraseñas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError("Cliente Supabase no disponible")
        setIsLoading(false)
        return
      }

      // Actualizar la contraseña
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        console.error("Error al restablecer contraseña:", error)
        setError(`No se pudo restablecer la contraseña: ${error.message}`)
        setIsLoading(false)
        return
      }

      setSuccess("Contraseña restablecida con éxito")
      setPassword("")
      setConfirmPassword("")

      // Redirigir al login después de unos segundos
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      console.error("Error al restablecer contraseña:", err)
      setError("Error al restablecer la contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Verificando token de restablecimiento...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Restablecer Contraseña</h1>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">{success}</p>
              <p className="text-green-700 mt-2">Serás redirigido a la página de inicio de sesión...</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Procesando...
                </>
              ) : (
                "Restablecer Contraseña"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
