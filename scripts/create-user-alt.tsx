"use client"

import type React from "react"
import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function CreateUserAlt() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setIsLoading(true)

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Por favor ingrese un correo electrónico válido")
      setIsLoading(false)
      return
    }

    // Validar contraseña
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

      console.log("Creando usuario con email:", email)

      // Crear usuario con Supabase Auth usando directamente el email
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        console.error("Error completo de Supabase:", JSON.stringify(signUpError))

        if (signUpError.message.includes("already")) {
          setError("Este correo electrónico ya está en uso")
        } else if (signUpError.message.includes("password")) {
          setError("La contraseña no cumple con los requisitos de seguridad")
        } else {
          setError(`Error: ${signUpError.message}`)
        }

        setIsLoading(false)
        return
      }

      setMessage(`Usuario creado con éxito: ${email}`)
      setEmail("")
      setPassword("")
    } catch (err) {
      console.error("Error al crear usuario:", err)
      setError("Error al crear usuario. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Crear Usuario (Método Alternativo)</h1>
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Volver
            </button>
          </div>
          <p className="text-gray-600 mb-4 text-center">
            Use esta página para crear usuarios directamente con correo electrónico
          </p>

          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">La contraseña debe tener al menos 6 caracteres</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Creando..." : "Crear Usuario"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
