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
  const [isInitializing, setIsInitializing] = useState(false)

  const initializeFirebaseApp = async () => {
    if (isInitializing) {
      console.log("Ya hay una inicialización en progreso, esperando...")
      // Esperar a que termine la inicialización actual
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!isInitializing) {
            clearInterval(checkInterval)
            resolve(true)
          }
        }, 100)
      })

      // Verificar el estado después de la espera
      const status = getFirebaseStatus()
      return {
        success: status.isInitialized,
        error: status.error,
      }
    }

    setIsInitializing(true)
    console.log("Iniciando inicialización de Firebase...")

    try {
      const result = await initializeFirebase()

      // Actualizar el estado basado en el resultado
      setIsFirebaseInitialized(result.success)
      setIsFirebaseError(!result.success)
      setErrorMessage(result.error)

      console.log("Resultado de inicialización:", result)
      return result
    } catch (error) {
      console.error("Error al inicializar Firebase:", error)
      setIsFirebaseInitialized(false)
      setIsFirebaseError(true)
      const errorMsg = error instanceof Error ? error.message : "Error inesperado al inicializar Firebase"
      setErrorMessage(errorMsg)

      return { success: false, error: errorMsg }
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    // Intentar inicializar Firebase al montar el componente
    const init = async () => {
      console.log("Inicializando Firebase automáticamente al montar el componente")
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
      if (status.isInitialized !== isFirebaseInitialized || status.error !== errorMessage) {
        console.log("Actualizando estado de Firebase:", status)
        setIsFirebaseInitialized(status.isInitialized)
        setIsFirebaseError(!status.isInitialized && status.error !== null)
        setErrorMessage(status.error)
      }
    }, 2000)

    // Forzar una actualización del estado después de un tiempo
    const timeout = setTimeout(() => {
      const status = getFirebaseStatus()
      if (!status.isInitialized) {
        console.log("Tiempo de espera agotado para inicialización de Firebase")
        setIsFirebaseInitialized(false)
        setIsFirebaseError(true)
        setErrorMessage(status.error || "Tiempo de espera agotado")
      }
    }, 10000)

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
