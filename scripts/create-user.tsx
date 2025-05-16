"use client"

import type React from "react"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { usernameToEmail } from "@/lib/auth-context"
import { Loader2, CheckCircle, AlertTriangle, User, Key, ArrowLeft, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function CreateUserPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [createdUsers, setCreatedUsers] = useState<
    { username: string; email: string; password: string; isAdmin: boolean }[]
  >([])
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const { createUser } = useAuth()

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setDebugInfo(null)
    setIsLoading(true)

    // Validar nombre de usuario con reglas más estrictas
    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      setError("El nombre de usuario solo puede contener letras, números, puntos y guiones bajos")
      setIsLoading(false)
      return
    }

    // Sanitizar el nombre de usuario para asegurar compatibilidad con correo electrónico
    const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9_.]/g, "")
    if (sanitizedUsername !== username.toLowerCase()) {
      setError("El nombre de usuario contiene caracteres no permitidos")
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
      // Primero intentar crear el usuario localmente
      const localResult = await createUser(username, password, isAdmin)

      if (localResult.success) {
        setMessage(`Usuario "${username}" creado con éxito${isAdmin ? " (con permisos de administrador)" : ""}`)

        // Añadir a la lista de usuarios creados
        setCreatedUsers((prev) => [
          ...prev,
          {
            username,
            email: usernameToEmail(username),
            password,
            isAdmin,
          },
        ])

        setUsername("")
        setPassword("")
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      // Si falla la creación local, intentar con Supabase
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError("Cliente Supabase no disponible")
        setIsLoading(false)
        return
      }

      // Convertir nombre de usuario a formato de correo electrónico
      const email = usernameToEmail(username)
      setDebugInfo(`Intentando crear usuario con email: ${email}`)

      // Verificar si el usuario ya existe
      const { data: userStatus, error: checkError } = await supabase.rpc("check_user_status", {
        user_email: email,
      })

      if (checkError) {
        setDebugInfo((prev) => `${prev}\nError al verificar usuario existente: ${JSON.stringify(checkError)}`)
      } else if (userStatus && userStatus.exists) {
        setError(`El usuario con correo ${email} ya existe`)
        setIsLoading(false)
        setDebugInfo((prev) => `${prev}\nUsuario existente encontrado: ${JSON.stringify(userStatus)}`)
        return
      }

      // Crear usuario con Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username, // Guardar el nombre de usuario original en los metadatos
            isAdmin: isAdmin, // Guardar si es administrador
          },
          // Deshabilitar la confirmación por correo electrónico
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      // Guardar información de depuración
      setDebugInfo((prev) => `${prev}\nRespuesta de signUp: ${JSON.stringify(data)}`)

      // Mejorar el manejo de errores
      if (signUpError) {
        console.error("Error completo de Supabase:", JSON.stringify(signUpError))
        setDebugInfo((prev) => `${prev}\nError de signUp: ${JSON.stringify(signUpError)}`)

        if (signUpError.message.includes("invalid")) {
          setError(
            `El formato de correo generado (${email}) no es válido para Supabase. Por favor, use otro nombre de usuario.`,
          )
        } else if (signUpError.message.includes("already")) {
          setError("Este nombre de usuario ya está en uso")
        } else if (signUpError.message.includes("password")) {
          setError("La contraseña no cumple con los requisitos de seguridad (mínimo 6 caracteres)")
        } else {
          setError(`Error: ${signUpError.message}`)
        }

        setIsLoading(false)
        return
      }

      // Confirmar el usuario automáticamente
      const { data: confirmData, error: confirmError } = await supabase.rpc("admin_confirm_user", {
        user_email: email,
      })

      if (confirmError) {
        setDebugInfo((prev) => `${prev}\nError al confirmar usuario: ${JSON.stringify(confirmError)}`)
        console.warn("Error al confirmar automáticamente el usuario:", confirmError)
      } else {
        setDebugInfo((prev) => `${prev}\nConfirmación automática: ${JSON.stringify(confirmData)}`)
      }

      // Crear entrada en la tabla user_profiles si no se creó automáticamente
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle()

      if (profileError) {
        setDebugInfo((prev) => `${prev}\nError al verificar perfil: ${JSON.stringify(profileError)}`)
      } else if (!profileData) {
        // El perfil no existe, crearlo manualmente
        const { error: insertError } = await supabase.from("user_profiles").insert([
          {
            user_id: data?.user?.id,
            username: username,
            email: email,
            is_admin: isAdmin,
            created_at: new Date().toISOString(),
          },
        ])

        if (insertError) {
          setDebugInfo((prev) => `${prev}\nError al crear perfil: ${JSON.stringify(insertError)}`)
        } else {
          setDebugInfo((prev) => `${prev}\nPerfil creado manualmente`)
        }
      } else {
        setDebugInfo((prev) => `${prev}\nPerfil ya existe: ${JSON.stringify(profileData)}`)
      }

      // Añadir a la lista de usuarios creados
      setCreatedUsers((prev) => [
        ...prev,
        {
          username,
          email,
          password,
          isAdmin,
        },
      ])

      setMessage(`Usuario "${username}" creado con éxito${isAdmin ? " (con permisos de administrador)" : ""}`)
      setUsername("")
      setPassword("")
      setIsAdmin(false)
    } catch (err) {
      console.error("Error al crear usuario:", err)
      setError("Error al crear usuario. Por favor, inténtalo de nuevo.")
      setDebugInfo((prev) => `${prev}\nExcepción: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Crear Usuario</h1>
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Volver
            </button>
          </div>

          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <p className="text-green-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
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
              <p className="text-xs text-gray-500 mt-1">Solo letras, números y guiones bajos (_)</p>
              {username && !username.includes("@") && (
                <p className="text-xs text-gray-500 mt-1">Se creará con el correo: {usernameToEmail(username)}</p>
              )}
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
              <p className="text-xs text-gray-500 mt-1">La contraseña debe tener al menos 6 caracteres</p>
            </div>

            <div className="flex items-center mb-4">
              <input
                id="isAdmin"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isAdmin" className="ml-2 flex items-center text-sm text-gray-700">
                <Shield className="h-4 w-4 text-blue-500 mr-1" />
                Crear como administrador
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Creando...
                </>
              ) : (
                "Crear Usuario"
              )}
            </button>
          </form>

          {/* Información de depuración */}
          {debugInfo && (
            <div className="mt-4">
              <button onClick={() => setShowDebug(!showDebug)} className="text-sm text-gray-500 underline">
                {showDebug ? "Ocultar información de depuración" : "Mostrar información de depuración"}
              </button>
              {showDebug && (
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                  {debugInfo}
                </pre>
              )}
            </div>
          )}

          {/* Lista de usuarios creados */}
          {createdUsers.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-2">Usuarios creados en esta sesión:</h2>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contraseña
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {createdUsers.map((user, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{user.password}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {user.isAdmin ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Usuario
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Guarda esta información. Las contraseñas se muestran solo para facilitar las pruebas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
