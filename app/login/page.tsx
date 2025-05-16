"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, User, Key, AlertTriangle, Info } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const { signIn, isAuthenticated, createUser } = useAuth()

  // Si el usuario ya está autenticado, redirigir a la página principal
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/stock")
    }
  }, [isAuthenticated, router])

  // Función para crear un usuario de prueba
  const handleCreateTestUser = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setMessage(null)

      // Crear un usuario de prueba
      const testUsername = "test"
      const testPassword = "test123"

      const result = await createUser(testUsername, testPassword)

      if (result.success) {
        setMessage(`Usuario de prueba creado: ${testUsername} / ${testPassword}`)
        setUsername(testUsername)
        setPassword(testPassword)
      } else {
        if (result.error === "El usuario ya existe") {
          setMessage(`El usuario de prueba ya existe. Puedes iniciar sesión con: ${testUsername} / ${testPassword}`)
          setUsername(testUsername)
          setPassword(testPassword)
        } else {
          setError(`Error al crear usuario de prueba: ${result.error}`)
        }
      }
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para iniciar sesión
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      const result = await signIn(username, password)

      if (result.success) {
        router.push("/stock")
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">HOTELES DE LA COSTA</h1>
            <h2 className="text-lg text-gray-600">Sistema de Gestión de Stock</h2>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 flex items-start">
              <Info className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <p className="text-green-700">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
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
                  "Iniciar sesión"
                )}
              </button>

              <button
                type="button"
                onClick={handleCreateTestUser}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Procesando...
                  </>
                ) : (
                  "Crear usuario de prueba"
                )}
              </button>
            </div>
          </form>

          {/* Se ha eliminado la información del usuario administrador por defecto por razones de seguridad */}
        </div>
      </div>
    </div>
  )
}
