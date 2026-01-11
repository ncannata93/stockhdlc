"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { AlertTriangle, Key, Shield, User, Lock, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { usernameToEmail } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function UserManagement() {
  const [error, setError] = useState<string | null>(null)
  const [resetPasswordEmail, setResetPasswordEmail] = useState("")
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Estados para cambiar contraseña de usuario específico
  const [userIdentifier, setUserIdentifier] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Estado para mostrar detalles de depuración
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Función para enviar un correo de restablecimiento de contraseña
  const sendPasswordResetEmail = async () => {
    if (!resetPasswordEmail) {
      setError("Por favor, ingresa un correo electrónico")
      return
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError("Cliente Supabase no disponible")
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error("Error al enviar correo de restablecimiento:", error)
        setError(`No se pudo enviar el correo: ${error.message}`)
        return
      }

      setResetPasswordSuccess(`Se ha enviado un correo de restablecimiento a ${resetPasswordEmail}`)
      setResetPasswordEmail("")
    } catch (err) {
      console.error("Error al enviar correo de restablecimiento:", err)
      setError("Error al enviar el correo de restablecimiento")
    }
  }

  // Función para cambiar la contraseña de un usuario específico
  const changeUserPassword = async () => {
    if (!userIdentifier) {
      setError("Por favor, ingresa un correo electrónico o nombre de usuario")
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }

    setError(null)
    setChangePasswordSuccess(null)
    setDebugInfo(null)
    setIsChangingPassword(true)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError("Cliente Supabase no disponible")
        setIsChangingPassword(false)
        return
      }

      // Determinar si es un correo electrónico o un nombre de usuario
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userIdentifier)

      // Si es un nombre de usuario, convertirlo a correo electrónico
      const email = isEmail ? userIdentifier : usernameToEmail(userIdentifier)

      // Guardar información de depuración
      setDebugInfo(`Intentando cambiar contraseña para: ${email}`)

      // Método directo: Usar la función RPC que acabamos de crear en la base de datos
      const { data, error: updateError } = await supabase.rpc("admin_update_user_password", {
        user_email: email,
        new_password: newPassword,
      })

      // Actualizar información de depuración
      if (updateError) {
        setDebugInfo((prevDebug) => `${prevDebug}\nError: ${JSON.stringify(updateError)}`)
      } else {
        setDebugInfo((prevDebug) => `${prevDebug}\nRespuesta: ${JSON.stringify(data)}`)
      }

      if (updateError) {
        console.error("Error al actualizar contraseña:", updateError)
        setError(`No se pudo cambiar la contraseña: ${updateError.message}`)
        setIsChangingPassword(false)
        return
      }

      // Verificar la respuesta de la función mejorada
      if (data && typeof data === "object") {
        if (data.success === false) {
          setError(`Error: ${data.error || "No se pudo actualizar la contraseña"}`)
          setIsChangingPassword(false)
          return
        }
      } else if (data === false) {
        setError("No se encontró el usuario especificado")
        setIsChangingPassword(false)
        return
      }

      setChangePasswordSuccess(`Contraseña cambiada con éxito para ${userIdentifier}`)
      setUserIdentifier("")
      setNewPassword("")
      setIsChangingPassword(false)
      return
    } catch (err) {
      console.error("Error al cambiar contraseña:", err)
      setError("Error al procesar la solicitud")
      setDebugInfo((prevDebug) => `${prevDebug}\nExcepción: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Función para verificar si un usuario existe
  const checkUserExists = async () => {
    if (!userIdentifier) {
      setError("Por favor, ingresa un correo electrónico o nombre de usuario")
      return
    }

    setError(null)
    setDebugInfo(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError("Cliente Supabase no disponible")
        return
      }

      // Determinar si es un correo electrónico o un nombre de usuario
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userIdentifier)

      // Si es un nombre de usuario, convertirlo a correo electrónico
      const email = isEmail ? userIdentifier : usernameToEmail(userIdentifier)

      // Intentar obtener información del usuario
      const { data, error: adminError } = await supabase.rpc("check_user_exists", {
        user_email: email,
      })

      if (adminError) {
        setDebugInfo(`Error al verificar usuario: ${JSON.stringify(adminError)}`)
        setError("No se pudo verificar si el usuario existe. La función check_user_exists puede no estar disponible.")
        return
      }

      if (data === true) {
        setDebugInfo(`Usuario encontrado: ${email}`)
      } else {
        setDebugInfo(`Usuario NO encontrado: ${email}`)
        setError(`No se encontró ningún usuario con el correo: ${email}`)
      }
    } catch (err) {
      console.error("Error al verificar usuario:", err)
      setError("Error al verificar si el usuario existe")
      setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Si no está autenticado, mostrar formulario de autenticación
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <button onClick={() => router.push("/admin")} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Volver
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {resetPasswordSuccess && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
          <p>{resetPasswordSuccess}</p>
        </div>
      )}

      {changePasswordSuccess && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 text-green-600 mt-0.5" />
          <p>{changePasswordSuccess}</p>
        </div>
      )}

      {/* Sección para cambiar contraseña de usuario específico */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Lock className="h-5 w-5 mr-2 text-purple-600" />
          Cambiar Contraseña de Usuario
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo o Nombre de Usuario</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="usuario o correo@ejemplo.com"
                value={userIdentifier}
                onChange={(e) => setUserIdentifier(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={checkUserExists}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
                title="Verificar si el usuario existe"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {userIdentifier && !userIdentifier.includes("@") && (
              <p className="text-xs text-gray-500 mt-1">Se usará el correo: {usernameToEmail(userIdentifier)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {newPassword && newPassword.length < 6 && (
              <p className="text-xs text-red-500 mt-1">La contraseña debe tener al menos 6 caracteres</p>
            )}
          </div>
          <button
            onClick={changeUserPassword}
            disabled={isChangingPassword}
            className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center"
          >
            {isChangingPassword ? (
              <>Procesando...</>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Cambia la contraseña de un usuario específico ingresando su correo electrónico o nombre de usuario.
        </p>

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
      </div>

      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Key className="h-5 w-5 mr-2 text-blue-600" />
          Enviar Correo de Restablecimiento
        </h2>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={resetPasswordEmail}
            onChange={(e) => setResetPasswordEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={sendPasswordResetEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Key className="h-4 w-4 mr-2" />
            Enviar Correo
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Se enviará un correo electrónico con instrucciones para restablecer la contraseña.
        </p>
      </div>

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-green-600" />
          Crear Nuevos Usuarios
        </h2>
        <p className="text-gray-600 mb-4">Puedes crear nuevos usuarios desde las páginas de creación de usuarios.</p>
        <div className="flex space-x-3">
          <a
            href="/admin/create-user"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
          >
            Crear con Nombre de Usuario
          </a>
          <a
            href="/admin/create-user-alt"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 inline-block"
          >
            Crear con Email
          </a>
        </div>
      </div>

      <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <Shield className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800 mb-1">Gestión directa de contraseñas habilitada</h3>
            <p className="text-green-700">
              Ahora puedes cambiar directamente las contraseñas de los usuarios sin necesidad de enviar correos
              electrónicos. Esta funcionalidad utiliza una función personalizada en la base de datos que permite
              actualizar contraseñas de forma segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
