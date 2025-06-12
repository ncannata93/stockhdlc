"use client"

import { Loader2, Waves } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function LoadingScreen({ message = "Cargando..." }: { message?: string }) {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState(message)

  useEffect(() => {
    const messages = [
      "Conectando con la base de datos...",
      "Cargando información de hoteles...",
      "Preparando módulos...",
      "Verificando permisos...",
      "¡Casi listo!",
    ]

    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      if (progress <= 100) {
        setLoadingProgress(progress)

        // Cambiar mensaje según el progreso
        if (progress < 20) {
          setLoadingMessage(messages[0])
        } else if (progress < 40) {
          setLoadingMessage(messages[1])
        } else if (progress < 60) {
          setLoadingMessage(messages[2])
        } else if (progress < 80) {
          setLoadingMessage(messages[3])
        } else {
          setLoadingMessage(messages[4])
        }
      } else {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden p-6 relative">
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-50 animate-pulse"></div>
            <Image
              src="/logo-hoteles-costa.svg"
              alt="Hoteles de la Costa"
              width={180}
              height={180}
              className="relative z-10 drop-shadow-lg animate-float"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Sistema de Gestión</h1>
        <h2 className="text-lg text-center text-gray-600 mb-6">Hoteles de la Costa</h2>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>

        <p className="text-xs text-right text-gray-500 mb-4">{loadingProgress}%</p>

        <div className="flex items-center justify-center mt-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <p className="text-sm text-gray-600">{loadingMessage}</p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <Waves className="w-full h-12 text-blue-100 opacity-30" />
        </div>

        <div className="text-xs text-center text-gray-400 mt-6">v1.2.0 • © 2025 Hoteles de la Costa</div>
      </div>
    </div>
  )
}
