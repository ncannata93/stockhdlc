import { Loader2 } from "lucide-react"

export default function LoadingScreen({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-700">{message}</h2>
      </div>
    </div>
  )
}
