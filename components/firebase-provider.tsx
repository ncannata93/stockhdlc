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
    const result = await initializeFirebase()

    // Actualizar el estado basado en el resultado
    setIsFirebaseInitialized(result.success)
    setIsFirebaseError(!result.success)
    setErrorMessage(result.error)

    return result
  }

  useEffect(() => {
    // Intentar inicializar Firebase al montar el componente
    const init = async () => {
      await initializeFirebaseApp()
    }

    init()

    // Verificar el estado de Firebase periódicamente
    const interval = setInterval(() => {
      const status = getFirebaseStatus()
      setIsFirebaseInitialized(status.isInitialized)
      setIsFirebaseError(!status.isInitialized && status.error !== null)
      setErrorMessage(status.error)
    }, 2000)

    return () => clearInterval(interval)
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
