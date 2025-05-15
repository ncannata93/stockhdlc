"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { initializeFirebase, getFirebaseStatus } from "@/lib/firebase"

// Contexto para Firebase
type FirebaseContextType = {
  isFirebaseInitialized: boolean
  isFirebaseError: boolean
  errorMessage: string | null
  initializeFirebaseApp: () => Promise<{ success: boolean; error: string | null }>
}

const FirebaseContext = createContext<FirebaseContextType>({
  isFirebaseInitialized: false,
  isFirebaseError: false,
  errorMessage: null,
  initializeFirebaseApp: async () => ({ success: false, error: "Contexto no inicializado" }),
})

export const useFirebase = () => useContext(FirebaseContext)

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false)
  const [isFirebaseError, setIsFirebaseError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const initializeFirebaseApp = async () => {
    try {
      const result = await initializeFirebase()

      // Actualizar el estado basado en el resultado
      setIsFirebaseInitialized(result.success)
      setIsFirebaseError(!result.success)
      setErrorMessage(result.error)

      return result
    } catch (error) {
      console.error("Error al inicializar Firebase:", error)
      setIsFirebaseInitialized(false)
      setIsFirebaseError(true)
      setErrorMessage("Error inesperado al inicializar Firebase")

      return { success: false, error: "Error inesperado al inicializar Firebase" }
    }
  }

  useEffect(() => {
    // Intentar inicializar Firebase al montar el componente
    const init = async () => {
      try {
        await initializeFirebaseApp()
      } catch (error) {
        console.error("Error al inicializar Firebase:", error)
        setIsFirebaseInitialized(false)
        setIsFirebaseError(true)
        setErrorMessage("Error al inicializar Firebase")
      }
    }

    init()

    // Verificar el estado de Firebase periódicamente
    const interval = setInterval(() => {
      const status = getFirebaseStatus()
      setIsFirebaseInitialized(status.isInitialized)
      setIsFirebaseError(!status.isInitialized && status.error !== null)
      setErrorMessage(status.error)
    }, 2000)

    // Forzar una actualización del estado después de un tiempo
    const timeout = setTimeout(() => {
      const status = getFirebaseStatus()
      if (!status.isInitialized) {
        setIsFirebaseInitialized(false)
        setIsFirebaseError(true)
        setErrorMessage(status.error || "Tiempo de espera agotado")
      }
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <FirebaseContext.Provider
      value={{
        isFirebaseInitialized,
        isFirebaseError,
        errorMessage,
        initializeFirebaseApp,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}
