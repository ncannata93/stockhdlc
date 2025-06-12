import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function LoadingScreen({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-blue-300 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-8 w-16 h-16 bg-blue-400 rounded-full animate-pulse delay-500"></div>
      </div>

      <div className="text-center z-10 px-6 max-w-sm mx-auto">
        {/* Logo container with animation */}
        <div className="mb-8 relative">
          <div className="w-48 h-32 mx-auto mb-4 relative animate-fade-in">
            <Image
              src="/logo-hoteles-costa.svg"
              alt="Hoteles de la Costa"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>

          {/* Animated ring around logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-blue-200 rounded-full animate-spin-slow opacity-30"></div>
          </div>
        </div>

        {/* Loading spinner with custom styling */}
        <div className="mb-6 relative">
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="absolute inset-0 h-8 w-8 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Loading dots */}
          <div className="flex justify-center space-x-1 mt-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>

        {/* Message with better typography */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-800 animate-fade-in-up">{message}</h2>
          <p className="text-sm text-gray-500 animate-fade-in-up delay-200">Preparando tu experiencia...</p>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-loading-bar"></div>
        </div>
      </div>
    </div>
  )
}
